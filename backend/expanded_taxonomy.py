"""
Expanded VGMS Taxonomy v3.0
Based on analysis of 953 tagged games from the Nitrogen database.
Consolidated taxonomy with 43 primary genres.
"""

# Standardized Primary Genres (consolidated to 43 genres)
PRIMARY_GENRES = {
    # Action-based
    "Action": ["action", "hack and slash", "beat em up", "brawler"],
    "Action RPG": ["action rpg", "arpg", "action role-playing", "dungeon crawler", "dungeon crawling"],
    "Action Adventure": ["action adventure", "action-adventure"],
    "First-Person Shooter": ["fps", "first person shooter", "first-person shooter"],
    "Third-Person Shooter": ["tps", "third person shooter"],
    "Bullet Hell": ["bullet hell", "danmaku", "bullet hell shooter", "shmup", "shoot em up"],

    # RPG variants
    "JRPG": ["jrpg", "japanese rpg", "japanese role-playing"],
    "Turn-Based RPG": ["turn-based rpg", "turn based rpg"],
    "Tactical RPG": ["tactical rpg", "srpg", "strategy rpg"],
    "MMORPG": ["mmorpg", "mmo rpg", "massively multiplayer"],
    "Roguelike": ["roguelike", "roguelite", "action roguelike", "rogue-like", "rogue-lite"],

    # Platformers
    "2D Platformer": ["2d platformer", "side-scroller", "sidescroller", "precision platformer", "masocore"],
    "3D Platformer": ["3d platformer", "3d platform"],
    "Metroidvania": ["metroidvania", "metroid-like"],

    # Strategy
    "Real-Time Strategy": ["rts", "real-time strategy", "real time strategy"],
    "Turn-Based Strategy": ["tbs", "turn-based strategy", "turn based strategy"],
    "Tower Defense": ["tower defense", "td"],
    "4X Strategy": ["4x", "4x strategy"],
    "Grand Strategy": ["grand strategy", "historical strategy"],

    # Simulation
    "Life Simulation": ["life sim", "life simulation", "virtual life"],
    "Farm Simulation": ["farming sim", "farm simulation", "farming"],
    "Management Simulation": ["management sim", "business sim", "tycoon"],
    "Racing Simulation": ["racing sim", "realistic racing", "sim racing"],
    "Flight Simulation": ["flight sim", "flying simulation", "flight simulator"],
    "City Builder": ["city builder", "city building", "urban planning"],

    # Puzzle
    "Puzzle": ["puzzle", "brain teaser"],
    "Puzzle Platformer": ["puzzle platformer", "puzzle-platformer"],
    "Match-3": ["match-3", "match 3", "tile matching"],
    "Physics Puzzle": ["physics puzzle", "physics-based puzzle"],

    # Adventure
    "Adventure": ["adventure", "story adventure", "point and click", "point-and-click", "graphic adventure"],
    "Narrative Adventure": ["narrative adventure", "interactive story", "walking sim", "walking simulator", "exploration game"],
    "Visual Novel": ["visual novel", "vn", "interactive fiction"],

    # Fighting
    "2D Fighting": ["2d fighting", "2d fighter", "platform fighter", "smash-like"],
    "3D Fighting": ["3d fighting", "3d fighter", "arena fighter"],

    # Racing
    "Arcade Racing": ["arcade racing", "arcade racer"],
    "Kart Racing": ["kart racing", "kart racer"],
    "Rally Racing": ["rally", "rally racing", "rally simulation"],

    # Sports
    "Sports": ["sports", "athletic", "extreme sports", "action sports", "sports sim"],

    # Horror
    "Horror": ["horror", "survival horror", "psychological horror", "horror survival"],

    # Card/Board
    "Card Game": ["card game", "ccg"],
    "Deck Builder": ["deck builder", "deckbuilder", "deck building"],
    "Board Game": ["board game", "digital board game"],
    "Digital TCG": ["tcg", "trading card", "digital tcg"],

    # Other
    "Arcade": ["arcade", "arcade action", "twin-stick shooter", "top-down shooter"],
    "Rhythm Game": ["rhythm", "music game", "rhythm action"],
    "Party Game": ["party game", "party"],
    "Battle Royale": ["battle royale", "br"],
    "Sandbox": ["sandbox", "open world sandbox"],
    "Idle Game": ["idle", "clicker", "incremental"],
    "Souls-like": ["souls-like", "soulslike", "souls like"],
    "Immersive Sim": ["immersive sim", "immersive simulation"],
    "Educational": ["educational", "edutainment"],
}

# Expanded Gameplay Tags (consolidated and expanded)
GAMEPLAY_TAGS = {
    # Core genres
    "action": "Fast-paced combat or physical challenges",
    "adventure": "Exploration and discovery focused",
    "rpg": "Character progression and role-playing elements",
    "strategy": "Tactical planning and resource management",
    "simulation": "Real-world system modeling",
    "puzzle": "Logic and problem-solving challenges",
    "platformer": "Jumping and movement-based gameplay",
    "shooter": "Projectile-based combat",
    "fighting": "One-on-one or group combat",
    "racing": "Vehicle or character speed competition",
    "sports": "Athletic competition simulation",
    "survival": "Resource management for staying alive",
    "stealth": "Avoiding detection gameplay",
    "rhythm": "Music-timed gameplay",
    "party": "Multiplayer social games",
    "roguelike": "Procedural runs with permadeath",
    "card": "Card-based mechanics",
    "idle": "Passive progression gameplay",

    # Sub-genres (new)
    "metroidvania": "Exploration with ability-gated progression",
    "souls_like": "Challenging combat with death penalties",
    "battle_royale": "Last-player-standing multiplayer",
    "deck_builder": "Building card decks during gameplay",
    "auto_battler": "Automated combat with strategic setup",
    "bullet_hell": "Dodging dense projectile patterns",
    "tower_defense": "Strategic placement to stop enemies",
    "city_builder": "Urban planning and management",
    "farming": "Agricultural simulation",
    "dating_sim": "Relationship-building focus",
    "visual_novel": "Story-driven with branching choices",
    "point_and_click": "Classic adventure game style",
    "walking_sim": "Exploration-focused narrative",
    "extraction": "Risk/reward loot retrieval",
    "moba": "Multiplayer online battle arena",
    "mmorpg": "Massively multiplayer RPG",
    "looter_shooter": "Shooting with loot focus",
    "immersive_sim": "Systems-driven emergent gameplay",
    "sandbox": "Open-ended freeform play",
    "educational": "Learning-focused gameplay",
}

# Expanded Mechanics (standardized from 300+ variations)
MECHANIC_TAGS = {
    # Progression
    "leveling": "Character or skill level increases",
    "skill_trees": "Branching ability upgrades",
    "crafting": "Creating items from components",
    "building": "Construction mechanics",
    "collection": "Gathering items or characters",
    "inventory": "Item management system",
    "equipment": "Gear and loadout management",
    "upgrades": "Improving stats or abilities",
    "unlockables": "Content gated by progression",

    # Combat
    "real_time_combat": "Live action combat",
    "turn_based_combat": "Sequential combat rounds",
    "combo_system": "Chained attack mechanics",
    "parry": "Timed defensive blocks",
    "dodge_roll": "Invincibility frame movement",
    "stamina": "Limited action resource",
    "boss_battles": "Major enemy encounters",
    "permadeath": "Permanent character death",
    "respawn": "Death and return mechanics",

    # Movement
    "parkour": "Free-running movement",
    "wall_jump": "Vertical surface jumping",
    "dash": "Quick burst movement",
    "grapple": "Hook-based traversal",
    "gliding": "Aerial descent control",
    "swimming": "Underwater navigation",
    "climbing": "Vertical surface traversal",
    "teleport": "Instant relocation",

    # Choices
    "dialogue_choices": "Branching conversations",
    "moral_choices": "Ethical decision making",
    "branching_narrative": "Story paths based on choices",
    "romance": "Relationship building options",
    "faction_system": "Allegiance mechanics",

    # Resource Management
    "resource_management": "Managing limited resources",
    "time_management": "Time-based constraints",
    "economy": "Currency and trading systems",
    "hunger_thirst": "Survival resource needs",
    "base_building": "Headquarters construction",

    # Puzzle/Logic
    "physics_puzzles": "Physics-based problem solving",
    "pattern_matching": "Recognizing and matching patterns",
    "logic_puzzles": "Deduction-based challenges",
    "hidden_objects": "Finding concealed items",
    "word_puzzles": "Language-based puzzles",

    # Social/Multiplayer
    "co_op": "Cooperative multiplayer",
    "pvp": "Player versus player",
    "guilds": "Player organizations",
    "trading": "Player-to-player exchange",
    "leaderboards": "Competitive rankings",

    # Meta mechanics
    "procedural_generation": "Algorithmically created content",
    "new_game_plus": "Enhanced replay mode",
    "speedrun_features": "Time attack support",
    "photo_mode": "Screenshot capture features",
    "mod_support": "User modification capability",
}

# Expanded Setting Tags
SETTING_TAGS = {
    # Time Period
    "prehistoric": "Before recorded history",
    "ancient": "Ancient civilizations",
    "medieval": "Middle Ages",
    "renaissance": "15th-17th century",
    "victorian": "19th century",
    "modern": "Present day",
    "near_future": "Next 50-100 years",
    "far_future": "Distant future",
    "post_apocalyptic": "After civilization collapse",

    # Environment
    "urban": "City environments",
    "rural": "Countryside settings",
    "wilderness": "Untamed nature",
    "underwater": "Beneath the waves",
    "space": "Outer space",
    "underground": "Subterranean areas",
    "sky": "Aerial/floating environments",

    # Genre Settings
    "fantasy": "Magical medieval-inspired",
    "high_fantasy": "Epic magical worlds",
    "dark_fantasy": "Grim magical settings",
    "sci_fi": "Science fiction",
    "cyberpunk": "High tech, low life",
    "steampunk": "Victorian + steam technology",
    "dieselpunk": "WWII-era aesthetic",
    "solarpunk": "Eco-futuristic",
    "gothic": "Dark romantic architecture",
    "horror": "Frightening atmosphere",
    "western": "American frontier",
    "pirate": "Nautical adventure",
    "samurai": "Feudal Japan",
    "wuxia": "Chinese martial arts fantasy",
    "mythology": "Based on myths/legends",

    # Style
    "realistic": "Grounded in reality",
    "stylized": "Artistic interpretation",
    "abstract": "Non-representational",
    "surreal": "Dreamlike/impossible",
    "cartoon": "Animated style",
    "anime": "Japanese animation style",
}

# Expanded Theme Tags
THEME_TAGS = {
    # Core themes
    "exploration": "Discovery and investigation",
    "survival": "Staying alive against odds",
    "war": "Armed conflict",
    "revenge": "Retribution narrative",
    "redemption": "Making amends",
    "coming_of_age": "Personal growth journey",
    "mystery": "Unknown to be solved",
    "horror": "Fear and dread",
    "comedy": "Humor focused",
    "tragedy": "Sorrowful outcome",
    "romance": "Love story",
    "friendship": "Bonds between characters",
    "family": "Familial relationships",
    "betrayal": "Trust broken",
    "sacrifice": "Giving up for others",
    "power": "Gaining/using influence",
    "corruption": "Moral decay",
    "isolation": "Being alone",
    "identity": "Who am I?",
    "freedom": "Breaking constraints",
    "destiny": "Predetermined fate",
    "good_vs_evil": "Moral binary conflict",
    "nature_vs_tech": "Natural vs artificial",
    "class_struggle": "Social hierarchy conflict",
    "colonialism": "Expansion/exploitation themes",
    "environmentalism": "Nature preservation",
}

# Expanded Visual Tags
VISUAL_TAGS = {
    # Rendering Style
    "realistic": "Photorealistic graphics",
    "stylized": "Artistic interpretation",
    "pixel_art": "Retro pixel graphics",
    "voxel": "3D pixel blocks",
    "low_poly": "Minimal polygon count",
    "hand_drawn": "Illustrated appearance",
    "cel_shaded": "Cartoon-like shading",
    "watercolor": "Painted appearance",
    "minimalist": "Simple, clean visuals",

    # Perspective
    "first_person": "Player POV",
    "third_person": "Behind character view",
    "top_down": "Overhead view",
    "isometric": "Angled overhead view",
    "side_scrolling": "2D horizontal view",
    "fixed_camera": "Static camera angles",

    # Art Style
    "anime": "Japanese animation style",
    "cartoon": "Western animation style",
    "comic_book": "Panel-style visuals",
    "noir": "High contrast shadows",
    "neon": "Glowing bright colors",
    "muted": "Desaturated palette",
    "vibrant": "Saturated colors",
    "monochrome": "Single color scheme",
}

# Expanded Narrative Tags
NARRATIVE_TAGS = {
    "fantasy": "Magic and mythical elements",
    "sci_fi": "Science fiction themes",
    "horror": "Fear-inducing content",
    "comedy": "Humorous tone",
    "drama": "Emotional depth",
    "mystery": "Unknown to discover",
    "thriller": "Suspense and tension",
    "romance": "Love story elements",
    "tragedy": "Sorrowful outcomes",
    "historical": "Based on real history",
    "military": "Armed forces focus",
    "crime": "Criminal elements",
    "western": "American frontier",
    "superhero": "Powered heroes",
    "slice_of_life": "Everyday experiences",
    "psychological": "Mind-focused narrative",
    "dystopian": "Oppressive future society",
    "utopian": "Ideal society",
    "absurdist": "Irrational/meaningless themes",
    "satirical": "Mocking social commentary",
}

# Engagement/Monetization Tags (Nitrogen-specific)
ENGAGEMENT_TAGS = {
    "pvp": "Player vs player combat",
    "pve": "Player vs environment focus",
    "co_op": "Cooperative multiplayer",
    "competitive": "Ranked/competitive modes",
    "casual": "Low-commitment play",
    "hardcore": "High difficulty/commitment",
    "daily_rewards": "Daily login bonuses",
    "battle_pass": "Season pass progression",
    "events": "Limited-time content",
    "gacha": "Random character/item pulls",
    "guilds": "Player organizations",
    "leaderboards": "Score rankings",
    "achievements": "Accomplishment tracking",
    "social": "Social interaction features",
}

MONETIZATION_TAGS = {
    "free_to_play": "No upfront cost",
    "premium": "One-time purchase",
    "subscription": "Recurring payment",
    "iap": "In-app purchases",
    "cosmetic_only": "Only visual purchases",
    "pay_to_win": "Purchases affect gameplay",
    "dlc": "Downloadable content",
    "season_pass": "Content bundle pass",
    "ad_supported": "Contains advertisements",
}

PROTAGONIST_TAGS = {
    "customizable": "Player-created character",
    "predefined": "Set character with backstory",
    "silent": "Non-speaking protagonist",
    "ensemble": "Multiple playable characters",
    "non_human": "Animal/robot/creature protagonist",
    "child": "Young protagonist",
    "villain": "Playing as antagonist",
    "anti_hero": "Morally gray protagonist",
}

# Similar Games Patterns (for learning from existing tags)
SIMILAR_GAME_PATTERNS = {
    "souls_like": {
        "examples": ["Dark Souls", "Elden Ring", "Sekiro", "Lies of P", "Nioh"],
        "mechanics": ["stamina", "dodge_roll", "parry", "boss_battles", "permadeath"],
        "themes": ["dark_fantasy", "difficulty", "exploration"],
    },
    "metroidvania": {
        "examples": ["Hollow Knight", "Metroid Dread", "Ori", "Castlevania"],
        "mechanics": ["ability_gating", "backtracking", "map_exploration", "upgrades"],
        "themes": ["exploration", "isolation"],
    },
    "roguelike": {
        "examples": ["Hades", "Dead Cells", "Binding of Isaac", "Spelunky"],
        "mechanics": ["permadeath", "procedural_generation", "meta_progression"],
        "themes": ["challenge", "replayability"],
    },
    "cozy_sim": {
        "examples": ["Stardew Valley", "Animal Crossing", "Spiritfarer"],
        "mechanics": ["farming", "crafting", "relationship_building", "collection"],
        "themes": ["relaxation", "community", "nature"],
    },
    "boomer_shooter": {
        "examples": ["DOOM", "Quake", "DUSK", "Ultrakill"],
        "mechanics": ["fast_movement", "circle_strafing", "weapon_switching"],
        "themes": ["action", "retro"],
    },
    "immersive_sim": {
        "examples": ["Deus Ex", "Dishonored", "Prey", "System Shock"],
        "mechanics": ["multiple_solutions", "stealth", "hacking", "environmental_interaction"],
        "themes": ["player_agency", "exploration"],
    },
}

def get_all_tags():
    """Return all tags organized by category."""
    return {
        "gameplay": list(GAMEPLAY_TAGS.keys()),
        "mechanic": list(MECHANIC_TAGS.keys()),
        "setting": list(SETTING_TAGS.keys()),
        "theme": list(THEME_TAGS.keys()),
        "visual": list(VISUAL_TAGS.keys()),
        "narrative": list(NARRATIVE_TAGS.keys()),
        "engagement": list(ENGAGEMENT_TAGS.keys()),
        "monetization": list(MONETIZATION_TAGS.keys()),
        "protagonist": list(PROTAGONIST_TAGS.keys()),
    }

def get_tag_descriptions():
    """Return all tag descriptions for prompt building."""
    all_tags = {}
    all_tags.update({f"gameplay_{k}": v for k, v in GAMEPLAY_TAGS.items()})
    all_tags.update({f"mechanic_{k}": v for k, v in MECHANIC_TAGS.items()})
    all_tags.update({f"setting_{k}": v for k, v in SETTING_TAGS.items()})
    all_tags.update({f"theme_{k}": v for k, v in THEME_TAGS.items()})
    all_tags.update({f"visual_{k}": v for k, v in VISUAL_TAGS.items()})
    all_tags.update({f"narrative_{k}": v for k, v in NARRATIVE_TAGS.items()})
    all_tags.update({f"engagement_{k}": v for k, v in ENGAGEMENT_TAGS.items()})
    all_tags.update({f"monetization_{k}": v for k, v in MONETIZATION_TAGS.items()})
    all_tags.update({f"protagonist_{k}": v for k, v in PROTAGONIST_TAGS.items()})
    return all_tags
