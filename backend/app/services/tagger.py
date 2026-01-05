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


class AsyncGameTagger:
    """Async game tagger service."""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.temp_dir = tempfile.mkdtemp()
        self.steam = AsyncSteamSource()
        self.xbox = AsyncXboxSource()
        self.youtube = AsyncYouTubeSource(self.temp_dir)

    async def analyze_with_claude(self, game_name: str, sources: list) -> dict:
        """Combine sources and analyze with Claude."""
        content = []
        context_parts = []

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

        context_text = '\n'.join(context_parts)
        prompt = ANALYSIS_PROMPT.format(game_name=game_name, context=context_text)
        content.insert(0, {"type": "text", "text": prompt})

        # Run Claude API call in thread pool (it's sync) with timeout
        loop = asyncio.get_event_loop()
        try:
            # Check if API key is set
            if not self.client.api_key:
                return {'error': 'ANTHROPIC_API_KEY not configured - please set in environment variables'}

            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self.client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=2000,
                        messages=[{"role": "user", "content": content}]
                    )
                ),
                timeout=120  # 2 minute timeout for Claude API
            )

            response_text = response.content[0].text
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                return json.loads(json_match.group())
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
        progress_callback: Callable = None
    ) -> dict:
        """Tag a game using specified sources with timeout protection."""
        try:
            return await asyncio.wait_for(
                self._tag_game_impl(game_name, sources, progress_callback),
                timeout=300  # 5 minute master timeout
            )
        except asyncio.TimeoutError:
            return {'game_name': game_name, 'error': 'Overall tagging process timed out after 5 minutes'}
        except Exception as e:
            return {'game_name': game_name, 'error': f'Unexpected error: {str(e)}'}

    async def _tag_game_impl(
        self,
        game_name: str,
        sources: list = None,
        progress_callback: Callable = None
    ) -> dict:
        """Internal implementation of tag_game."""
        if sources is None:
            sources = ['steam', 'xbox', 'youtube']

        source_data = []

        # Fetch Steam and Xbox concurrently with timeout (they're fast)
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
                await progress_callback('analysis', 'processing (no external sources)')
            result = await self.analyze_with_claude(game_name, [])
            result['game_name'] = game_name
            result['sources_used'] = ['claude_only']
            result['source_data'] = {}
            if progress_callback:
                await progress_callback('analysis', 'completed')
            return result

        # Analyze with Claude
        if progress_callback:
            await progress_callback('analysis', 'processing')

        result = await self.analyze_with_claude(game_name, source_data)

        if progress_callback:
            await progress_callback('analysis', 'completed')

        # Add metadata
        result['game_name'] = game_name
        result['sources_used'] = [s['source'] for s in successful]

        # Include source data for reference
        result['source_data'] = {
            s['source']: {k: v for k, v in s.items() if k not in ['screenshots', 'frames']}
            for s in successful
        }

        return result
