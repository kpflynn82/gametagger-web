"""Async game tagger service - adapted from game_tagger.py CLI tool."""
import asyncio
import base64
import json
import os
import re
import tempfile
from typing import Callable, Optional

import anthropic
import httpx

# Try to import optional dependencies
try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    import yt_dlp
    HAS_YTDLP = True
except ImportError:
    HAS_YTDLP = False


# VGMS Schema
VGMS_CATEGORIES = {
    'gameplay': [
        'action', 'adventure', 'rpg', 'strategy', 'simulation', 'sports',
        'platformer', 'puzzle', 'shooter', 'stealth', 'survival', 'rhythm',
        'party', 'roguelike', 'fighting', 'racing'
    ],
    'narrative': [
        'horror', 'comedy', 'mystery', 'scifi', 'fantasy', 'historical', 'western'
    ],
    'theme': [
        'war', 'exploration', 'survival', 'crime', 'family', 'revenge',
        'coming_of_age', 'politics', 'environmental'
    ],
    'setting': [
        'fantasy', 'scifi', 'contemporary', 'historical', 'post_apocalyptic',
        'urban', 'rural', 'underwater', 'space'
    ],
    'mechanic': [
        'leveling', 'crafting', 'farming', 'building', 'collection', 'inventory',
        'permadeath', 'time_management', 'resource_management', 'stealth',
        'parkour', 'dialogue_choices', 'moral_choices', 'romance'
    ],
    'visual': [
        'realistic', 'stylized', 'pixel_art', 'minimalist', 'hand_drawn'
    ],
    'features': [
        'multiplayer', 'open_world', 'procedural', 'story_driven'
    ],
    # Nitrogen-specific categories
    'engagement': [
        'gacha', 'daily_rewards', 'energy_system', 'pvp', 'guild',
        'events', 'battle_pass', 'auto_play'
    ],
    'monetization': [
        'free_to_play', 'premium', 'subscription', 'iap'
    ],
    'protagonist': [
        'customizable', 'predefined', 'ensemble', 'non_human'
    ],
    # Accessibility features
    'accessibility': [
        'colorblind_modes', 'subtitle_options', 'difficulty_options',
        'motor_accessibility', 'cognitive_assist'
    ],
    # Demographic appeal
    'demographic': [
        'family_friendly', 'teen_focused', 'mature_audience',
        'female_protagonist', 'diverse_cast', 'nostalgia_retro'
    ]
}

ANALYSIS_PROMPT = """Analyze this game and classify it using VGMS (Video Game Metadata Schema).

GAME: {game_name}

{context}

Based on all available information, return a JSON object with:

1. Boolean tags for each category (prefix_tag format):
   - gameplay_action, gameplay_adventure, gameplay_rpg, gameplay_strategy, etc.
   - narrative_horror, narrative_comedy, narrative_scifi, narrative_fantasy, etc.
   - theme_war, theme_exploration, theme_survival, etc.
   - setting_fantasy, setting_scifi, setting_contemporary, etc.
   - mechanic_leveling, mechanic_crafting, mechanic_building, etc.
   - visual_realistic, visual_stylized, visual_pixel_art, etc.
   - multiplayer, open_world, procedural, story_driven
   - engagement_gacha, engagement_daily_rewards, engagement_energy_system, engagement_pvp, engagement_guild, engagement_events, engagement_battle_pass, engagement_auto_play
   - monetization_free_to_play, monetization_premium, monetization_subscription, monetization_iap
   - protagonist_customizable, protagonist_predefined, protagonist_ensemble, protagonist_non_human
   - accessibility_colorblind_modes, accessibility_subtitle_options, accessibility_difficulty_options, accessibility_motor_accessibility, accessibility_cognitive_assist
   - demographic_family_friendly, demographic_teen_focused, demographic_mature_audience, demographic_female_protagonist, demographic_diverse_cast, demographic_nostalgia_retro

2. Metadata:
   - detected_game: The game name you identified
   - confidence: "high", "medium", or "low"
   - primary_genre: The main genre (e.g., "Action RPG", "FPS", "Platformer")
   - analysis_notes: Brief notes about classification reasoning

Return ONLY valid JSON, no other text.
"""


class AsyncSteamSource:
    """Async Steam Store data fetcher."""

    async def search(self, game_name: str) -> Optional[int]:
        """Search Steam for app ID."""
        from urllib.parse import quote
        url = f"https://store.steampowered.com/api/storesearch/?term={quote(game_name)}&l=english&cc=US"
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    if data.get('items'):
                        return data['items'][0]['id']
            except Exception:
                pass
        return None

    async def search_multiple(self, game_name: str, limit: int = 5) -> list[dict]:
        """Search Steam and return multiple candidate games."""
        from urllib.parse import quote
        url = f"https://store.steampowered.com/api/storesearch/?term={quote(game_name)}&l=english&cc=US"
        candidates = []
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    for item in data.get('items', [])[:limit]:
                        candidates.append({
                            'source': 'steam',
                            'source_id': str(item.get('id')),
                            'title': item.get('name', ''),
                            'description': None,
                            'year': None
                        })
            except Exception:
                pass
        return candidates

    async def fetch_details(self, app_id: int) -> Optional[dict]:
        """Fetch app details from Steam API."""
        url = f"https://store.steampowered.com/api/appdetails?appids={app_id}&l=english"
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    if str(app_id) in data and data[str(app_id)].get('success'):
                        return data[str(app_id)]['data']
            except Exception:
                pass
        return None

    async def download_image(self, url: str) -> Optional[str]:
        """Download and encode image."""
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, timeout=10)
                if r.status_code == 200:
                    return base64.b64encode(r.content).decode('utf-8')
            except Exception:
                pass
        return None

    async def fetch(self, game_name: str, progress_callback: Callable = None) -> dict:
        """Fetch Steam Store data."""
        if progress_callback:
            await progress_callback('steam', 'searching')

        app_id = await self.search(game_name)
        if not app_id:
            return {'source': 'steam', 'success': False, 'error': 'Game not found'}

        if progress_callback:
            await progress_callback('steam', 'fetching')

        details = await self.fetch_details(app_id)
        if not details:
            return {'source': 'steam', 'success': False, 'error': 'Could not fetch details'}

        # Get screenshots
        screenshots = []
        for ss in details.get('screenshots', [])[:4]:
            url = ss.get('path_thumbnail') or ss.get('path_full')
            if url:
                img_data = await self.download_image(url)
                if img_data:
                    screenshots.append(img_data)

        genres = [g['description'] for g in details.get('genres', [])]
        categories = [c['description'] for c in details.get('categories', [])]

        if progress_callback:
            await progress_callback('steam', 'completed')

        return {
            'source': 'steam',
            'success': True,
            'title': details.get('name', ''),
            'description': details.get('short_description', ''),
            'detailed_description': details.get('detailed_description', ''),
            'genres': genres,
            'categories': categories,
            'screenshots': screenshots,
            'app_id': app_id
        }


class AsyncXboxSource:
    """Async Xbox Store data fetcher."""

    KNOWN_PRODUCTS = {
        'halo infinite': '9PP5G1F0C2B6',
        'forza horizon 5': '9NKX70BBCDRN',
        'sea of thieves': '9PGGP1DS3GJM',
        'minecraft': '9PGW18NPBZV5',
        'starfield': '9NCJLTR0C9HS',
        'gears 5': '9NR3Z3K2K9GN',
        'flight simulator': '9NXN8GF8N9WT',
        'age of empires iv': '9NKH1TZP07R1',
        'grounded': '9NZTDDQGCH2L',
        'psychonauts 2': '9NR2Q5QMTFQH',
        'ori and the will of the wisps': '9N8CD0XZKLP4',
        'state of decay 2': '9NT4X7P8B9NB',
        'the outer worlds': '9NKXMG6ZCRLW',
        'fallout 4': 'C3KLDKZBHNCZ',
        'doom eternal': '9P5S26314HWQ',
        'elder scrolls online': 'BQLQNFLHKJGR',
    }

    async def search(self, game_name: str) -> Optional[str]:
        """Search for product ID."""
        from urllib.parse import quote

        # Check known products
        product_id = self.KNOWN_PRODUCTS.get(game_name.lower())
        if product_id:
            return product_id

        # Try search API
        url = f"https://storeedgefd.dsx.mp.microsoft.com/v9.0/search?market=US&locale=en-US&query={quote(game_name)}&mediaType=games"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }

        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, headers=headers, timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    payload = data.get('Payload', {})
                    for key in ['HighlightedList', 'SearchResults']:
                        items = payload.get(key, [])
                        if items:
                            return items[0].get('ProductId')
            except Exception:
                pass
        return None

    async def search_multiple(self, game_name: str, limit: int = 5) -> list[dict]:
        """Search Xbox and return multiple candidate games."""
        from urllib.parse import quote
        candidates = []

        # Check known products first (exact match only)
        product_id = self.KNOWN_PRODUCTS.get(game_name.lower())
        if product_id:
            candidates.append({
                'source': 'xbox',
                'source_id': product_id,
                'title': game_name,
                'description': None,
                'year': None
            })

        # Search API for more candidates
        url = f"https://storeedgefd.dsx.mp.microsoft.com/v9.0/search?market=US&locale=en-US&query={quote(game_name)}&mediaType=games"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }

        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, headers=headers, timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    payload = data.get('Payload', {})
                    for key in ['HighlightedList', 'SearchResults']:
                        for item in payload.get(key, [])[:limit]:
                            pid = item.get('ProductId')
                            title = item.get('Title', '')
                            if pid and not any(c['source_id'] == pid for c in candidates):
                                candidates.append({
                                    'source': 'xbox',
                                    'source_id': pid,
                                    'title': title,
                                    'description': item.get('Description'),
                                    'year': None
                                })
            except Exception:
                pass
        return candidates[:limit]

    async def fetch_product(self, product_id: str) -> Optional[dict]:
        """Fetch product details."""
        url = f"https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds={product_id}&market=US&languages=en-US"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }

        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, headers=headers, timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    if 'Products' in data and data['Products']:
                        return data['Products'][0]
            except Exception:
                pass
        return None

    async def download_image(self, url: str) -> Optional[str]:
        """Download and encode image."""
        if url.startswith('//'):
            url = 'https:' + url
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, timeout=10)
                if r.status_code == 200:
                    return base64.b64encode(r.content).decode('utf-8')
            except Exception:
                pass
        return None

    async def fetch(self, game_name: str, progress_callback: Callable = None) -> dict:
        """Fetch Xbox Store data."""
        if progress_callback:
            await progress_callback('xbox', 'searching')

        product_id = await self.search(game_name)
        if not product_id:
            return {'source': 'xbox', 'success': False, 'error': 'Product not found'}

        if progress_callback:
            await progress_callback('xbox', 'fetching')

        product = await self.fetch_product(product_id)
        if not product:
            return {'source': 'xbox', 'success': False, 'error': 'Could not fetch details'}

        localized = product.get('LocalizedProperties', [{}])[0]
        properties = product.get('Properties', {})

        # Extract screenshots
        screenshots = []
        for img in localized.get('Images', []):
            purpose = img.get('ImagePurpose', '')
            uri = img.get('Uri', '')
            if uri and purpose in ['Screenshot', 'SuperHeroArt', 'Hero', 'Poster']:
                img_data = await self.download_image(uri)
                if img_data:
                    screenshots.append({'data': img_data, 'purpose': purpose})
                    if len(screenshots) >= 4:
                        break

        if progress_callback:
            await progress_callback('xbox', 'completed')

        return {
            'source': 'xbox',
            'success': True,
            'title': localized.get('ProductTitle', ''),
            'description': localized.get('ProductDescription', ''),
            'publisher': localized.get('PublisherName', ''),
            'categories': properties.get('Categories', []),
            'screenshots': screenshots
        }


class AsyncYouTubeSource:
    """Async YouTube video fetcher (uses sync yt-dlp in thread pool)."""

    def __init__(self, temp_dir: str):
        self.temp_dir = temp_dir
        self.available = HAS_YTDLP and HAS_OPENCV

    def _search_video_sync(self, game_name: str, max_duration: int = 1200) -> dict:
        """Search for gameplay video (sync, run in thread pool)."""
        if not self.available:
            return {'success': False, 'error': 'yt-dlp or opencv not installed'}

        search_query = f"{game_name} gameplay"
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'default_search': 'ytsearch5',
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(f"ytsearch5:{search_query}", download=False)
                if result and 'entries' in result:
                    for video in result['entries']:
                        duration = video.get('duration', 0) or 0
                        if 0 < duration <= max_duration:
                            return {
                                'success': True,
                                'url': video.get('webpage_url'),
                                'video_id': video.get('id'),
                                'title': video.get('title'),
                                'duration': duration
                            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

        return {'success': False, 'error': 'No suitable video found'}

    def _download_video_sync(self, url: str) -> Optional[str]:
        """Download video (sync, run in thread pool)."""
        output_path = os.path.join(self.temp_dir, 'video.mp4')

        ydl_opts = {
            'format': 'worst[height>=360][ext=mp4]/worst[ext=mp4]/worst',
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'max_filesize': 100 * 1024 * 1024,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            if os.path.exists(output_path):
                return output_path
        except Exception:
            pass

        return None

    def _extract_frames_sync(self, video_path: str, num_frames: int = 6) -> list:
        """Extract frames from video (sync)."""
        frames = []
        cap = cv2.VideoCapture(video_path)

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Skip first/last 10%
        start_frame = int(total_frames * 0.1)
        end_frame = int(total_frames * 0.9)
        interval = (end_frame - start_frame) // (num_frames + 1)

        for i in range(num_frames):
            frame_pos = start_frame + (i + 1) * interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
            ret, frame = cap.read()

            if ret:
                h, w = frame.shape[:2]
                if w > 800:
                    scale = 800 / w
                    frame = cv2.resize(frame, (800, int(h * scale)))

                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frames.append(base64.b64encode(buffer).decode('utf-8'))

        cap.release()
        return frames

    async def fetch(self, game_name: str, progress_callback: Callable = None) -> dict:
        """Fetch YouTube gameplay data with timeout protection."""
        if not self.available:
            return {'source': 'youtube', 'success': False, 'error': 'yt-dlp or opencv not installed'}

        # Skip YouTube on Railway/production (it's slow and often fails)
        if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('SKIP_YOUTUBE'):
            return {'source': 'youtube', 'success': False, 'error': 'YouTube disabled in production'}

        loop = asyncio.get_event_loop()

        try:
            if progress_callback:
                await progress_callback('youtube', 'searching')

            # Search with timeout (30 seconds)
            video = await asyncio.wait_for(
                loop.run_in_executor(None, self._search_video_sync, game_name),
                timeout=30
            )
            if not video.get('success'):
                return {'source': 'youtube', 'success': False, 'error': video.get('error')}

            if progress_callback:
                await progress_callback('youtube', 'downloading')

            # Download with timeout (120 seconds)
            video_path = await asyncio.wait_for(
                loop.run_in_executor(None, self._download_video_sync, video['url']),
                timeout=120
            )
            if not video_path:
                return {'source': 'youtube', 'success': False, 'error': 'Download failed'}

            if progress_callback:
                await progress_callback('youtube', 'extracting')

            # Extract frames with timeout (60 seconds)
            frames = await asyncio.wait_for(
                loop.run_in_executor(None, self._extract_frames_sync, video_path),
                timeout=60
            )

            # Cleanup
            try:
                os.remove(video_path)
            except Exception:
                pass

            if progress_callback:
                await progress_callback('youtube', 'completed')

            return {
                'source': 'youtube',
                'success': True,
                'video_title': video['title'],
                'video_url': video['url'],
                'frames': frames,
                'frame_count': len(frames)
            }

        except asyncio.TimeoutError:
            if progress_callback:
                await progress_callback('youtube', 'timeout')
            return {'source': 'youtube', 'success': False, 'error': 'YouTube fetch timed out'}
        except Exception as e:
            return {'source': 'youtube', 'success': False, 'error': f'YouTube error: {str(e)}'}


class AsyncWikipediaSource:
    """Async Wikipedia data fetcher - extracts genre info from game articles."""

    # Wikipedia API requires a proper User-Agent header
    HEADERS = {
        'User-Agent': 'GameTagger/1.0 (https://gametagger.app; contact@gametagger.app) Python/httpx',
        'Accept': 'application/json',
    }

    async def search(self, game_name: str) -> Optional[str]:
        """Search Wikipedia for a game article, returns page title."""
        from urllib.parse import quote

        # Try searching with "video game" suffix for disambiguation
        search_queries = [
            f"{game_name} video game",
            f"{game_name} game",
            game_name,
        ]

        async with httpx.AsyncClient() as client:
            for query in search_queries:
                url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(query)}&format=json&srlimit=5"
                try:
                    r = await client.get(url, headers=self.HEADERS, timeout=10)
                    if r.status_code == 200:
                        data = r.json()
                        results = data.get('query', {}).get('search', [])
                        for result in results:
                            title = result.get('title', '').lower()
                            # Check if it's likely a video game article
                            if 'video game' in title or 'game' in title or game_name.lower() in title:
                                return result.get('title')
                        # If no game-specific result, use first result from first query
                        if results and query == search_queries[0]:
                            return results[0].get('title')
                except Exception:
                    continue
        return None

    async def search_multiple(self, game_name: str, limit: int = 5) -> list[dict]:
        """Search Wikipedia and return multiple candidate games."""
        from urllib.parse import quote
        import re
        candidates = []
        seen_titles = set()

        # Search with "video game" suffix for best results
        url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(game_name + ' video game')}&format=json&srlimit=10"

        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, headers=self.HEADERS, timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    results = data.get('query', {}).get('search', [])
                    for result in results:
                        title = result.get('title', '')
                        title_lower = title.lower()
                        # Filter for game-related articles
                        if ('video game' in title_lower or 'game' in title_lower or
                            game_name.lower() in title_lower):
                            if title not in seen_titles:
                                seen_titles.add(title)
                                # Extract year from title if present (e.g., "Game (2023 video game)")
                                year_match = re.search(r'\((\d{4})', title)
                                year = int(year_match.group(1)) if year_match else None
                                candidates.append({
                                    'source': 'wikipedia',
                                    'source_id': title,
                                    'title': title,
                                    'description': result.get('snippet', '').replace('<span class="searchmatch">', '').replace('</span>', ''),
                                    'year': year
                                })
                                if len(candidates) >= limit:
                                    break
            except Exception:
                pass

        return candidates

    async def fetch_page_content(self, title: str) -> Optional[dict]:
        """Fetch Wikipedia page content and parse infobox."""
        from urllib.parse import quote

        async with httpx.AsyncClient() as client:
            # Get page content with parsed text
            url = f"https://en.wikipedia.org/w/api.php?action=query&titles={quote(title)}&prop=revisions|extracts&rvprop=content&exintro=true&explaintext=true&format=json"
            try:
                r = await client.get(url, headers=self.HEADERS, timeout=15)
                if r.status_code != 200:
                    return None

                data = r.json()
                pages = data.get('query', {}).get('pages', {})
                if not pages:
                    return None

                page = list(pages.values())[0]
                if 'missing' in page:
                    return None

                # Get the wikitext content
                revisions = page.get('revisions', [])
                wikitext = revisions[0].get('*', '') if revisions else ''

                # Get the plain text extract (intro paragraph)
                extract = page.get('extract', '')

                return {
                    'title': page.get('title', ''),
                    'wikitext': wikitext,
                    'extract': extract,
                }
            except Exception:
                return None

    def parse_infobox(self, wikitext: str) -> dict:
        """Parse the infobox from wikitext to extract genre and other info."""
        infobox_data = {}

        # Common infobox patterns for video games
        # Look for genre field
        genre_patterns = [
            r'\|\s*genre\s*=\s*([^\n\|]+)',
            r'\|\s*genres\s*=\s*([^\n\|]+)',
        ]
        for pattern in genre_patterns:
            match = re.search(pattern, wikitext, re.IGNORECASE)
            if match:
                genre_text = match.group(1).strip()
                # Clean up wiki markup
                genre_text = re.sub(r'\[\[([^\]|]+)\|?[^\]]*\]\]', r'\1', genre_text)  # [[Link|Text]] -> Link
                genre_text = re.sub(r'\{\{[^}]+\}\}', '', genre_text)  # Remove templates
                genre_text = re.sub(r'<[^>]+>', '', genre_text)  # Remove HTML tags
                genre_text = re.sub(r"'''?", '', genre_text)  # Remove bold/italic
                infobox_data['genres'] = [g.strip() for g in re.split(r'[,\n•]', genre_text) if g.strip()]
                break

        # Look for mode (single-player, multiplayer, etc.)
        mode_patterns = [
            r'\|\s*modes?\s*=\s*([^\n\|]+)',
        ]
        for pattern in mode_patterns:
            match = re.search(pattern, wikitext, re.IGNORECASE)
            if match:
                mode_text = match.group(1).strip()
                mode_text = re.sub(r'\[\[([^\]|]+)\|?[^\]]*\]\]', r'\1', mode_text)
                mode_text = re.sub(r'\{\{[^}]+\}\}', '', mode_text)
                mode_text = re.sub(r'<[^>]+>', '', mode_text)
                infobox_data['modes'] = [m.strip() for m in re.split(r'[,\n•]', mode_text) if m.strip()]
                break

        # Look for developer
        dev_patterns = [
            r'\|\s*developer\s*=\s*([^\n\|]+)',
        ]
        for pattern in dev_patterns:
            match = re.search(pattern, wikitext, re.IGNORECASE)
            if match:
                dev_text = match.group(1).strip()
                dev_text = re.sub(r'\[\[([^\]|]+)\|?[^\]]*\]\]', r'\1', dev_text)
                dev_text = re.sub(r'\{\{[^}]+\}\}', '', dev_text)
                dev_text = re.sub(r'<[^>]+>', '', dev_text)
                infobox_data['developer'] = dev_text.strip()
                break

        # Look for platform
        platform_patterns = [
            r'\|\s*platforms?\s*=\s*([^\n\|]+)',
        ]
        for pattern in platform_patterns:
            match = re.search(pattern, wikitext, re.IGNORECASE)
            if match:
                platform_text = match.group(1).strip()
                platform_text = re.sub(r'\[\[([^\]|]+)\|?[^\]]*\]\]', r'\1', platform_text)
                platform_text = re.sub(r'\{\{[^}]+\}\}', '', platform_text)
                platform_text = re.sub(r'<[^>]+>', '', platform_text)
                infobox_data['platforms'] = [p.strip() for p in re.split(r'[,\n•]', platform_text) if p.strip()]
                break

        return infobox_data

    async def fetch(self, game_name: str, progress_callback: Callable = None) -> dict:
        """Fetch Wikipedia data for a game."""
        if progress_callback:
            await progress_callback('wikipedia', 'searching')

        # Search for the game's Wikipedia page
        title = await self.search(game_name)
        if not title:
            return {'source': 'wikipedia', 'success': False, 'error': 'Game not found on Wikipedia'}

        if progress_callback:
            await progress_callback('wikipedia', 'fetching')

        # Fetch page content
        page_data = await self.fetch_page_content(title)
        if not page_data:
            return {'source': 'wikipedia', 'success': False, 'error': 'Could not fetch Wikipedia page'}

        # Parse infobox
        infobox = self.parse_infobox(page_data.get('wikitext', ''))

        if progress_callback:
            await progress_callback('wikipedia', 'completed')

        return {
            'source': 'wikipedia',
            'success': True,
            'title': page_data.get('title', ''),
            'description': page_data.get('extract', '')[:1500],  # First ~1500 chars of intro
            'genres': infobox.get('genres', []),
            'modes': infobox.get('modes', []),
            'developer': infobox.get('developer', ''),
            'platforms': infobox.get('platforms', []),
            'wikipedia_url': f"https://en.wikipedia.org/wiki/{page_data.get('title', '').replace(' ', '_')}",
        }


class AsyncGameTagger:
    """Async game tagger service."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.temp_dir = tempfile.mkdtemp()
        self.steam = AsyncSteamSource()
        self.xbox = AsyncXboxSource()
        self.youtube = AsyncYouTubeSource(self.temp_dir)
        self.wikipedia = AsyncWikipediaSource()

    async def search_candidates(self, query: str, limit: int = 8) -> dict:
        """Search for candidate games across all sources before full analysis."""
        all_candidates = []

        # Search all sources concurrently
        try:
            wiki_task = self.wikipedia.search_multiple(query, limit=5)
            xbox_task = self.xbox.search_multiple(query, limit=5)
            steam_task = self.steam.search_multiple(query, limit=5)

            results = await asyncio.gather(wiki_task, xbox_task, steam_task, return_exceptions=True)

            for result in results:
                if isinstance(result, list):
                    all_candidates.extend(result)
        except Exception:
            pass

        # Deduplicate by normalizing titles
        seen_titles = set()
        unique_candidates = []
        for c in all_candidates:
            # Normalize title for comparison
            normalized = c['title'].lower().strip()
            # Remove common suffixes for comparison
            for suffix in [' (video game)', ' video game', ' (game)', ' game']:
                normalized = normalized.replace(suffix, '')
            if normalized not in seen_titles:
                seen_titles.add(normalized)
                unique_candidates.append(c)

        # Sort by: Wikipedia first (more reliable), then by whether title contains query
        query_lower = query.lower()
        def sort_key(c):
            title_lower = c['title'].lower()
            # Exact match gets highest priority
            if query_lower == title_lower or query_lower in title_lower:
                return (0, c['source'] != 'wikipedia', c['title'])
            return (1, c['source'] != 'wikipedia', c['title'])

        unique_candidates.sort(key=sort_key)

        # Determine if this is a direct match (single high-confidence result)
        is_direct_match = (
            len(unique_candidates) == 1 or
            (len(unique_candidates) > 0 and query_lower in unique_candidates[0]['title'].lower())
        )

        return {
            'query': query,
            'candidates': unique_candidates[:limit],
            'is_direct_match': is_direct_match and len(unique_candidates) > 0,
            'suggested_title': unique_candidates[0]['title'] if unique_candidates else None
        }

    async def analyze_with_claude(self, game_name: str, sources: list, quality: str = "standard") -> dict:
        """Combine sources and analyze with Claude."""
        content = []
        context_parts = []

        # Select model based on quality
        # Standard uses Haiku for cost efficiency (~60x cheaper than Sonnet)
        # Deep uses Opus for highest accuracy
        if quality == "deep":
            model = "claude-opus-4-20250514"
            max_tokens = 4000
        else:
            model = "claude-3-5-haiku-20241022"
            max_tokens = 2000

        for src in sources:
            if not src.get('success'):
                continue

            if src['source'] == 'youtube':
                context_parts.append(f"YOUTUBE VIDEO: {src.get('video_title', 'Gameplay footage')}")
                for frame in src.get('frames', [])[:4]:
                    content.append({
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": frame}
                    })

            elif src['source'] == 'xbox':
                context_parts.append(f"XBOX STORE:")
                context_parts.append(f"  Title: {src.get('title', 'Unknown')}")
                context_parts.append(f"  Categories: {', '.join(src.get('categories', []))}")
                context_parts.append(f"  Description: {src.get('description', '')[:1000]}")
                for ss in src.get('screenshots', [])[:2]:
                    content.append({
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": ss['data']}
                    })

            elif src['source'] == 'steam':
                context_parts.append(f"STEAM STORE:")
                context_parts.append(f"  Title: {src.get('title', 'Unknown')}")
                context_parts.append(f"  Genres: {', '.join(src.get('genres', []))}")
                context_parts.append(f"  Categories: {', '.join(src.get('categories', []))}")
                context_parts.append(f"  Description: {src.get('description', '')[:1000]}")
                for ss in src.get('screenshots', [])[:2]:
                    content.append({
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": ss}
                    })

            elif src['source'] == 'wikipedia':
                context_parts.append(f"WIKIPEDIA:")
                context_parts.append(f"  Article: {src.get('title', 'Unknown')}")
                if src.get('genres'):
                    context_parts.append(f"  Genres (from infobox): {', '.join(src.get('genres', []))}")
                if src.get('modes'):
                    context_parts.append(f"  Game Modes: {', '.join(src.get('modes', []))}")
                if src.get('developer'):
                    context_parts.append(f"  Developer: {src.get('developer', '')}")
                if src.get('platforms'):
                    context_parts.append(f"  Platforms: {', '.join(src.get('platforms', []))}")
                if src.get('description'):
                    context_parts.append(f"  Description: {src.get('description', '')[:1000]}")

        context_text = '\n'.join(context_parts)
        prompt = ANALYSIS_PROMPT.format(game_name=game_name, context=context_text)
        content.insert(0, {"type": "text", "text": prompt})

        # Run Claude API call in thread pool (it's sync) with timeout
        loop = asyncio.get_event_loop()
        try:
            # Check if API key is set
            if not self.client.api_key:
                return {'error': 'ANTHROPIC_API_KEY not configured - please set in environment variables'}

            # Longer timeout for Opus (deep analysis)
            timeout = 180 if quality == "deep" else 120

            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda m=model, mt=max_tokens: self.client.messages.create(
                        model=m,
                        max_tokens=mt,
                        messages=[{"role": "user", "content": content}]
                    )
                ),
                timeout=timeout
            )

            response_text = response.content[0].text
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
                # Flatten any nested tag objects (e.g., gameplay_tags: {gameplay_action: true})
                flattened = {}
                for key, value in result.items():
                    if isinstance(value, dict) and key.endswith('_tags'):
                        # Flatten nested tags
                        for tag_key, tag_value in value.items():
                            flattened[tag_key] = tag_value
                    else:
                        flattened[key] = value
                return flattened
        except asyncio.TimeoutError:
            return {'error': 'Claude API timed out after 120 seconds'}
        except anthropic.APIConnectionError as e:
            return {'error': f'Cannot connect to Anthropic API: {str(e)}'}
        except anthropic.AuthenticationError as e:
            return {'error': f'Invalid API key: {str(e)}'}
        except anthropic.RateLimitError as e:
            return {'error': f'Rate limited: {str(e)}'}
        except Exception as e:
            return {'error': f'Analysis failed ({type(e).__name__}): {str(e)}'}

        return {'error': 'Could not parse response'}

    async def tag_game(
        self,
        game_name: str,
        sources: list = None,
        quality: str = "standard",
        progress_callback: Callable = None
    ) -> dict:
        """Tag a game using specified sources with timeout protection."""
        try:
            # Longer timeout for deep analysis
            timeout = 600 if quality == "deep" else 300
            return await asyncio.wait_for(
                self._tag_game_impl(game_name, sources, quality, progress_callback),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            return {'game_name': game_name, 'error': f'Overall tagging process timed out after {timeout // 60} minutes'}
        except Exception as e:
            return {'game_name': game_name, 'error': f'Unexpected error: {str(e)}'}

    async def _tag_game_impl(
        self,
        game_name: str,
        sources: list = None,
        quality: str = "standard",
        progress_callback: Callable = None
    ) -> dict:
        """Internal implementation of tag_game."""
        if sources is None:
            sources = ['wikipedia', 'xbox', 'steam']  # Wikipedia and Xbox first, Steam as fallback

        source_data = []

        # Fetch Steam, Xbox, and Wikipedia concurrently with timeout (they're fast)
        tasks = []

        if 'steam' in sources:
            tasks.append(asyncio.wait_for(
                self.steam.fetch(game_name, progress_callback),
                timeout=30
            ))
        if 'xbox' in sources:
            tasks.append(asyncio.wait_for(
                self.xbox.fetch(game_name, progress_callback),
                timeout=30
            ))
        if 'wikipedia' in sources:
            tasks.append(asyncio.wait_for(
                self.wikipedia.fetch(game_name, progress_callback),
                timeout=30
            ))

        # Run fast sources concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, dict):
                    source_data.append(r)
                elif isinstance(r, asyncio.TimeoutError):
                    source_data.append({'source': 'unknown', 'success': False, 'error': 'Timeout'})

        # YouTube separately (slow, has its own timeouts)
        if 'youtube' in sources:
            try:
                yt_result = await self.youtube.fetch(game_name, progress_callback)
                source_data.append(yt_result)
            except Exception as e:
                source_data.append({'source': 'youtube', 'success': False, 'error': str(e)})

        # Check what we got
        successful = [s for s in source_data if s.get('success')]

        if not successful:
            # Try to proceed with just Claude's knowledge if no sources work
            if progress_callback:
                model_name = "Claude Opus" if quality == "deep" else "Claude Haiku"
                await progress_callback('analysis', f'processing with {model_name} (no external sources)')
            result = await self.analyze_with_claude(game_name, [], quality)
            result['game_name'] = game_name
            result['sources_used'] = ['claude_only']
            result['quality'] = quality
            result['source_data'] = {}
            if progress_callback:
                await progress_callback('analysis', 'completed')
            return result

        # Analyze with Claude
        if progress_callback:
            model_name = "Claude Opus" if quality == "deep" else "Claude Haiku"
            await progress_callback('analysis', f'processing with {model_name}')

        result = await self.analyze_with_claude(game_name, source_data, quality)

        if progress_callback:
            await progress_callback('analysis', 'completed')

        # Add metadata
        result['game_name'] = game_name
        result['sources_used'] = [s['source'] for s in successful]
        result['quality'] = quality

        # Include source data for reference
        result['source_data'] = {
            s['source']: {k: v for k, v in s.items() if k not in ['screenshots', 'frames']}
            for s in successful
        }

        # Validate: if no tags were extracted, confidence should be "low"
        tag_count = sum(1 for k, v in result.items() if isinstance(v, bool) and v)
        if tag_count == 0 and result.get('confidence') != 'low':
            result['confidence'] = 'low'
            result['analysis_notes'] = (result.get('analysis_notes', '') +
                ' [Warning: No tags extracted, confidence downgraded to low]').strip()

        return result
