import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Gamepad2, BookOpen, Palette, Map, Wrench, Eye, Zap, DollarSign, User, Sparkles, Layers, Info } from 'lucide-react';

// Primary Genre definitions - ONE genre per game (the defining classification)
// Consolidated taxonomy v3.1 - 44 genres
const GENRE_GLOSSARY: Record<string, { description: string; examples: string[] }> = {
  // Action-based
  "Action": { description: "Fast-paced combat emphasizing reflexes and physical challenges", examples: ["Devil May Cry 5", "Bayonetta", "God of War"] },
  "Action RPG": { description: "Real-time combat combined with character progression and loot", examples: ["Diablo IV", "Elden Ring", "Path of Exile", "Torchlight"] },
  "Action Adventure": { description: "Exploration and combat with puzzle-solving elements", examples: ["The Legend of Zelda", "Uncharted", "Tomb Raider"] },
  "First-Person Shooter": { description: "Combat through the protagonist's eyes with ranged weapons", examples: ["DOOM Eternal", "Call of Duty", "Halo Infinite"] },
  "Third-Person Shooter": { description: "Ranged combat from behind-the-character camera perspective", examples: ["Gears of War", "Resident Evil 4", "Control"] },
  "Bullet Hell": { description: "Dodging dense projectile patterns requiring precise movement", examples: ["Touhou", "Ikaruga", "Mushihimesama"] },

  // RPG variants
  "JRPG": { description: "Japanese-style RPG with turn-based combat and anime aesthetics", examples: ["Persona 5", "Final Fantasy", "Dragon Quest XI"] },
  "Turn-Based RPG": { description: "Strategic combat with sequential turns and party management", examples: ["Divinity: Original Sin 2", "Baldur's Gate 3", "Octopath Traveler"] },
  "Tactical RPG": { description: "Grid-based combat with positioning and unit management", examples: ["Fire Emblem", "XCOM 2", "Triangle Strategy"] },
  "MMORPG": { description: "Massively multiplayer persistent world with social features", examples: ["World of Warcraft", "Final Fantasy XIV", "Guild Wars 2"] },
  "Roguelike": { description: "Procedural runs with permadeath or permanent progression between deaths", examples: ["Hades", "Dead Cells", "Slay the Spire", "Spelunky 2"] },

  // Platformers
  "2D Platformer": { description: "Side-scrolling jumping challenges in 2D space", examples: ["Celeste", "Super Mario Bros. Wonder", "Shovel Knight", "Super Meat Boy"] },
  "3D Platformer": { description: "Jumping challenges in 3D environments", examples: ["Super Mario Odyssey", "Ratchet & Clank", "A Hat in Time"] },
  "Metroidvania": { description: "Interconnected world with ability-gated exploration", examples: ["Hollow Knight", "Metroid Dread", "Ori and the Will of the Wisps"] },

  // Strategy
  "Real-Time Strategy": { description: "Base building and army management in real-time", examples: ["StarCraft II", "Age of Empires IV", "Company of Heroes"] },
  "Turn-Based Strategy": { description: "Sequential tactical planning with no time pressure", examples: ["Civilization VI", "Into the Breach", "Advance Wars"] },
  "Tower Defense": { description: "Placing defensive structures to stop enemy waves", examples: ["Bloons TD 6", "Kingdom Rush", "Defense Grid"] },
  "4X Strategy": { description: "eXplore, eXpand, eXploit, eXterminate grand strategy", examples: ["Civilization VI", "Stellaris", "Endless Legend"] },
  "Grand Strategy": { description: "Large-scale geopolitical simulation with complex systems", examples: ["Crusader Kings III", "Europa Universalis IV", "Hearts of Iron IV"] },

  // Simulation
  "Life Simulation": { description: "Simulating daily life, relationships, and activities", examples: ["The Sims 4", "Animal Crossing", "Stardew Valley"] },
  "Farm Simulation": { description: "Agricultural management with farming mechanics", examples: ["Stardew Valley", "Farming Simulator", "Story of Seasons"] },
  "City Builder": { description: "Urban planning and infrastructure management", examples: ["Cities: Skylines", "SimCity", "Frostpunk"] },
  "Management Simulation": { description: "Running businesses, organizations, or systems", examples: ["Two Point Hospital", "Planet Coaster", "Football Manager"] },
  "Racing Simulation": { description: "Realistic vehicle physics and racing mechanics", examples: ["Gran Turismo 7", "Forza Motorsport", "iRacing"] },
  "Flight Simulation": { description: "Aircraft piloting with realistic or arcade physics", examples: ["Microsoft Flight Simulator", "Ace Combat 7", "IL-2 Sturmovik"] },

  // Puzzle
  "Puzzle": { description: "Logic and problem-solving as primary gameplay", examples: ["Tetris", "Portal 2", "The Witness"] },
  "Puzzle Platformer": { description: "Platform navigation combined with puzzle-solving", examples: ["Braid", "Limbo", "Inside"] },
  "Match-3": { description: "Matching similar tiles in rows or columns", examples: ["Candy Crush", "Puzzle Quest", "Gems of War"] },
  "Physics Puzzle": { description: "Puzzles based on realistic physics simulation", examples: ["Angry Birds", "World of Goo", "Human Fall Flat"] },

  // Adventure
  "Adventure": { description: "Story-driven exploration with puzzle elements", examples: ["Monkey Island", "Grim Fandango", "Life is Strange"] },
  "Narrative Adventure": { description: "Story-focused with branching choices and exploration", examples: ["Disco Elysium", "Gone Home", "What Remains of Edith Finch"] },
  "Visual Novel": { description: "Story told through text, images, and branching choices", examples: ["Ace Attorney", "Danganronpa", "Steins;Gate"] },

  // Fighting
  "2D Fighting": { description: "Side-view combat with combos, special moves, or ring-outs", examples: ["Street Fighter 6", "Super Smash Bros.", "Guilty Gear Strive"] },
  "3D Fighting": { description: "Arena-based combat with 3D movement", examples: ["Tekken 8", "Soulcalibur VI", "Virtua Fighter 5"] },

  // Racing
  "Arcade Racing": { description: "Accessible, fast-paced racing with power-ups", examples: ["Need for Speed", "Burnout Paradise", "Forza Horizon 5"] },
  "Kart Racing": { description: "Fun racing with items and character-based vehicles", examples: ["Mario Kart 8", "Crash Team Racing", "Team Sonic Racing"] },
  "Rally Racing": { description: "Off-road racing with realistic terrain and handling", examples: ["Dirt Rally 2.0", "WRC", "Art of Rally"] },

  // Horror
  "Horror": { description: "Fear-inducing gameplay with tense atmosphere and survival elements", examples: ["Resident Evil", "Silent Hill 2", "Amnesia", "Dead Space"] },

  // Card/Board
  "Card Game": { description: "Card-based gameplay as the primary mechanic", examples: ["Hearthstone", "Magic: The Gathering Arena", "Legends of Runeterra"] },
  "Deck Builder": { description: "Building and optimizing card decks during gameplay", examples: ["Slay the Spire", "Monster Train", "Inscryption"] },
  "Board Game": { description: "Digital adaptations of tabletop board games", examples: ["Tabletop Simulator", "Wingspan", "Gloomhaven"] },
  "Digital TCG": { description: "Digital trading card games with collection elements", examples: ["Pokemon TCG Live", "Yu-Gi-Oh! Master Duel", "Marvel Snap"] },

  // Sports
  "Sports": { description: "Athletic competition based on real or fictional sports", examples: ["FIFA", "NBA 2K", "Madden NFL", "Rocket League"] },

  // Other
  "Arcade": { description: "Accessible action games with simple controls and pick-up-and-play design", examples: ["Enter the Gungeon", "Hotline Miami", "Pac-Man", "Geometry Wars"] },
  "Rhythm Game": { description: "Music-based gameplay synchronized to audio", examples: ["Beat Saber", "Guitar Hero", "Taiko no Tatsujin"] },
  "Party Game": { description: "Multiplayer minigames for social group play", examples: ["Mario Party", "Jackbox Party Pack", "Fall Guys"] },
  "Battle Royale": { description: "Last-player-standing multiplayer with shrinking arena", examples: ["Fortnite", "PUBG", "Apex Legends"] },
  "Sandbox": { description: "Open-ended creative gameplay with player-driven goals", examples: ["Garry's Mod", "Roblox", "Dreams"] },
  "Survival": { description: "Open-world resource gathering, crafting, and building while managing hunger, thirst, and environmental threats", examples: ["Subnautica", "Don't Starve", "Valheim", "Minecraft Survival", "The Forest"] },
  "Idle Game": { description: "Passive progression with minimal active input", examples: ["Cookie Clicker", "Adventure Capitalist", "Melvor Idle"] },
  "Souls-like": { description: "Challenging action RPG with stamina combat and death penalties", examples: ["Dark Souls", "Elden Ring", "Lies of P"] },
  "Immersive Sim": { description: "Systems-driven gameplay with multiple solutions", examples: ["Deus Ex", "Dishonored", "Prey"] },
  "Educational": { description: "Learning-focused gameplay with educational content", examples: ["Oregon Trail", "Kerbal Space Program", "Big Brain Academy"] },
};

// Tag definitions with descriptions - Expanded Standardized Taxonomy v2.0
const TAG_GLOSSARY = {
  gameplay: {
    label: 'Gameplay',
    description: 'Core gameplay mechanics and genre classifications',
    icon: Gamepad2,
    color: 'purple',
    tags: {
      action: 'Fast-paced gameplay emphasizing physical challenges, hand-eye coordination, and reaction time',
      adventure: 'Exploration-focused gameplay with puzzle-solving and narrative progression',
      rpg: 'Role-playing elements including character progression, stats, and skill systems',
      strategy: 'Tactical decision-making and resource management in competitive or puzzle scenarios',
      simulation: 'Realistic recreation of real-world activities, systems, or experiences',
      sports: 'Athletic competition games based on real or fictional sports',
      platformer: 'Character movement through levels via jumping between platforms and avoiding obstacles',
      puzzle: 'Problem-solving challenges requiring logic, pattern recognition, or spatial reasoning',
      shooter: 'Combat-focused gameplay centered on ranged weapons and aiming mechanics',
      stealth: 'Gameplay emphasizing avoiding detection and strategic infiltration',
      survival: 'Resource gathering and management to endure hostile environments',
      rhythm: 'Music-based gameplay synchronized to beats and audio cues',
      party: 'Multiplayer-focused minigames designed for social group play',
      roguelike: 'Procedurally generated runs with permadeath and incremental progression',
      fighting: 'One-on-one or team-based combat with combo systems and special moves',
      racing: 'Vehicle-based competition focused on speed and track navigation',
      // New standardized tags
      metroidvania: 'Exploration with ability-gated progression and interconnected world design',
      souls_like: 'Challenging combat with stamina management, death penalties, and deliberate pacing',
      battle_royale: 'Last-player-standing multiplayer with shrinking play area',
      deck_builder: 'Building and optimizing card decks during gameplay runs',
      auto_battler: 'Automated combat with strategic unit placement and team composition',
      bullet_hell: 'Dodging dense projectile patterns with precise movement',
      tower_defense: 'Strategic placement of defenses to stop waves of enemies',
      city_builder: 'Urban planning, infrastructure management, and population growth',
      farming: 'Agricultural cultivation, harvesting, and farm management',
      visual_novel: 'Story-driven gameplay with branching narrative choices',
      point_and_click: 'Classic adventure game style with inventory puzzles',
      walking_sim: 'Exploration-focused narrative with minimal gameplay mechanics',
      idle: 'Passive progression with minimal active input required',
      card: 'Card-based mechanics as core gameplay loop',
      moba: 'Multiplayer online battle arena with team-based objectives',
      mmorpg: 'Massively multiplayer persistent world with social features',
      sandbox: 'Open-ended freeform play with player-driven goals',
      extraction: 'Risk/reward loot retrieval with permanent loss on death',
      immersive_sim: 'Systems-driven emergent gameplay with multiple solutions',
    },
  },
  narrative: {
    label: 'Narrative',
    description: 'Story tone, genre, and thematic elements',
    icon: BookOpen,
    color: 'blue',
    tags: {
      fantasy: 'Magical elements, mythical creatures, and supernatural worldbuilding',
      scifi: 'Science fiction themes including futuristic technology, space, or alternate realities',
      horror: 'Fear-inducing atmosphere with scary themes, creatures, or psychological terror',
      comedy: 'Humorous tone with jokes, satire, or absurdist elements',
      drama: 'Character-focused storytelling with emotional depth and conflict',
      mystery: 'Investigation-driven plot with clues, secrets, and revelations',
      thriller: 'Suspenseful narrative with tension, danger, and high stakes',
      romance: 'Love and relationships as central narrative focus',
      tragedy: 'Stories exploring loss, downfall, and inevitable suffering',
      historical: 'Set in or inspired by real historical periods and events',
      military: 'Armed forces, warfare tactics, and soldier experiences',
      crime: 'Criminal underworld, heists, or law enforcement narratives',
      western: 'American frontier themes with cowboys, outlaws, and frontier justice',
      superhero: 'Characters with extraordinary powers fighting for justice',
      slice_of_life: 'Everyday experiences and mundane moments portrayed meaningfully',
      psychological: 'Mind-bending narratives exploring mental states and perception',
      dystopian: 'Oppressive societies with totalitarian control and social decay',
      satirical: 'Using humor and irony to critique society or human nature',
    },
  },
  theme: {
    label: 'Theme',
    description: 'Core thematic elements and subject matter',
    icon: Sparkles,
    color: 'indigo',
    tags: {
      exploration: 'Discovery and traversal of unknown territories as primary focus',
      survival: 'Endurance against hostile conditions, scarcity, or threats',
      war: 'Military conflict as central theme, including combat and its consequences',
      revenge: 'Vengeance-driven narrative with retribution as motivation',
      redemption: 'Characters seeking to atone for past mistakes or wrongdoing',
      coming_of_age: 'Character growth and maturation through formative experiences',
      mystery: 'Uncovering secrets, solving puzzles, or investigating the unknown',
      horror: 'Fear, dread, and confronting terrifying threats',
      comedy: 'Light-hearted tone emphasizing humor and fun',
      tragedy: 'Narratives centered on loss, suffering, and inevitable downfall',
      romance: 'Love, relationships, and emotional connections',
      friendship: 'Bonds between companions and the power of camaraderie',
      family: 'Family relationships, dynamics, and bonds as central themes',
      betrayal: 'Trust broken and alliances shattered',
      sacrifice: 'Giving up something precious for a greater cause',
      power: 'Pursuit, use, and consequences of authority and might',
      corruption: 'Moral decay and the erosion of principles',
      isolation: 'Solitude, loneliness, and disconnection from others',
      identity: 'Self-discovery, transformation, and understanding who you are',
      freedom: 'Liberation, independence, and breaking free from constraints',
      destiny: 'Fate, prophecy, and predetermined paths',
      good_vs_evil: 'Classic moral conflict between opposing forces',
      heroism: 'Acts of bravery, selflessness, and standing against adversity',
      environmentalism: 'Nature preservation and ecological awareness',
      competition: 'Rivalry, contests, and striving to be the best',
    },
  },
  setting: {
    label: 'Setting',
    description: 'World and environment context',
    icon: Map,
    color: 'cyan',
    tags: {
      // Time periods
      prehistoric: 'Ancient era before written history with dinosaurs or early humans',
      ancient: 'Classical civilizations like Rome, Greece, or Egypt',
      medieval: 'Middle Ages with castles, knights, and feudal societies',
      victorian: '19th century industrial era with steam and invention',
      modern: 'Present-day contemporary settings',
      near_future: 'Slightly advanced technology in recognizable society',
      far_future: 'Distant future with highly advanced technology',
      post_apocalyptic: 'World after civilization-ending events',
      // Locations
      urban: 'City environments with metropolitan infrastructure',
      rural: 'Countryside, villages, or non-urban environments',
      wilderness: 'Untamed natural environments and landscapes',
      underwater: 'Oceanic or aquatic environments and settings',
      space: 'Outer space, planets, or cosmic environments',
      underground: 'Subterranean caves, dungeons, or underground cities',
      sky: 'Aerial environments, floating islands, or cloud cities',
      // Genres
      fantasy: 'Magical realms with mythical elements and supernatural phenomena',
      high_fantasy: 'Epic fantasy with elaborate magic systems and world-building',
      dark_fantasy: 'Grim fantasy with horror elements and moral ambiguity',
      scifi: 'Futuristic or technologically advanced settings',
      cyberpunk: 'High-tech dystopia with corporate control and neon aesthetics',
      steampunk: 'Victorian-era aesthetics with steam-powered technology',
      gothic: 'Dark, atmospheric settings with horror and romance elements',
      horror: 'Frightening environments designed to unsettle and scare',
      western: 'American frontier with deserts, saloons, and frontier towns',
      pirate: 'Nautical adventures on the high seas',
      samurai: 'Feudal Japan with warriors, honor, and tradition',
      mythology: 'Based on mythological pantheons and legendary tales',
      // Visual styles
      realistic: 'Grounded in real-world logic and appearance',
      stylized: 'Artistic interpretation departing from realism',
      abstract: 'Non-representational or conceptual environments',
      surreal: 'Dreamlike, impossible, or distorted reality',
      cartoon: 'Animated, exaggerated visual style',
      anime: 'Japanese animation aesthetic and conventions',
    },
  },
  mechanic: {
    label: 'Mechanics',
    description: 'Specific gameplay systems and features',
    icon: Wrench,
    color: 'teal',
    tags: {
      // Progression
      leveling: 'Character or skill progression through experience points',
      skill_trees: 'Branching ability upgrades with player choice',
      crafting: 'Item creation from gathered materials and resources',
      building: 'Construction of structures, bases, or environments',
      collection: 'Gathering and cataloging items, achievements, or collectibles',
      inventory: 'Item management systems with limited carrying capacity',
      equipment: 'Gear and loadout systems affecting character stats',
      upgrades: 'Improving weapons, abilities, or equipment over time',
      unlockables: 'Content or features revealed through progression',
      // Combat
      real_time_combat: 'Action-based fighting requiring reflexes and timing',
      turn_based_combat: 'Sequential tactical combat with planning phases',
      combo_system: 'Chaining attacks for increased damage or effects',
      parry: 'Timed defensive maneuver to counter enemy attacks',
      dodge_roll: 'Invincibility-frame dodge for avoiding damage',
      stamina: 'Limited resource governing actions like attacks and dodges',
      boss_battles: 'Climactic encounters against powerful unique enemies',
      permadeath: 'Permanent character death requiring restart',
      respawn: 'Returning to life after death with various penalties',
      // Movement
      parkour: 'Athletic traversal including climbing, jumping, and acrobatics',
      wall_jump: 'Bouncing off walls to reach higher areas',
      dash: 'Quick burst of movement for dodging or traversal',
      grapple: 'Hook or rope-based swinging and pulling mechanics',
      gliding: 'Controlled descent through the air',
      swimming: 'Underwater movement and exploration',
      climbing: 'Scaling vertical surfaces and structures',
      teleport: 'Instant movement between locations',
      // Narrative
      dialogue_choices: 'Branching conversations affecting story or relationships',
      moral_choices: 'Ethical decisions with gameplay or narrative consequences',
      branching_narrative: 'Story paths that diverge based on player decisions',
      romance: 'Romantic relationship mechanics with NPCs',
      faction_system: 'Reputation and allegiance with different groups',
      // Resource systems
      resource_management: 'Strategic allocation and conservation of limited resources',
      time_management: 'Scheduling and time allocation as core gameplay',
      economy: 'Trading, buying, selling, and market systems',
      hunger_thirst: 'Survival needs requiring food and water management',
      base_building: 'Constructing and managing a home base or settlement',
      // Puzzle types
      physics_puzzles: 'Challenges based on realistic physics simulation',
      pattern_matching: 'Recognizing and replicating sequences or designs',
      logic_puzzles: 'Deduction and reasoning-based challenges',
      hidden_objects: 'Finding concealed items in complex scenes',
      // Social
      co_op: 'Cooperative multiplayer requiring teamwork',
      pvp: 'Player versus player competitive combat',
      guilds: 'Player organizations with shared goals and resources',
      trading: 'Exchange of items between players',
      leaderboards: 'Competitive ranking and score comparison',
      // Meta features
      procedural_generation: 'Algorithmically created content for variety',
      new_game_plus: 'Replaying with carried-over progress or unlocks',
      photo_mode: 'In-game photography with camera controls',
      mod_support: 'Tools and systems for player-created modifications',
    },
  },
  visual: {
    label: 'Visual Style',
    description: 'Art direction and graphical presentation',
    icon: Palette,
    color: 'violet',
    tags: {
      // Fidelity
      realistic: 'Photorealistic graphics aiming for visual authenticity',
      stylized: 'Artistic interpretation with distinctive visual identity',
      pixel_art: 'Retro-inspired pixel-based graphics',
      voxel: '3D cube-based aesthetic similar to Minecraft',
      low_poly: 'Simplified 3D geometry with visible facets',
      hand_drawn: 'Illustration-style graphics with artistic brush or pen aesthetics',
      cel_shaded: 'Flat shading creating cartoon or comic book appearance',
      watercolor: 'Painterly aesthetic with soft, flowing colors',
      minimalist: 'Simplified, clean visual design with limited elements',
      // Anime & cartoon
      anime: 'Japanese animation style with expressive characters',
      cartoon: 'Western animation style with exaggerated features',
      comic_book: 'Bold lines and panels inspired by graphic novels',
      // Atmosphere
      noir: 'Dark, shadowy aesthetic with high contrast',
      neon: 'Bright, glowing colors often associated with cyberpunk',
      vibrant: 'Saturated, colorful palette with visual energy',
      muted: 'Desaturated, subdued color palette',
      monochrome: 'Single color or grayscale visual design',
      // Camera perspective
      first_person: 'View through the protagonist\'s eyes',
      third_person: 'Camera behind and above the character',
      top_down: 'Overhead view looking down at the action',
      isometric: 'Angled overhead view with no perspective distortion',
      side_scrolling: 'Horizontal view typical of 2D platformers',
    },
  },
  features: {
    label: 'Features',
    description: 'Game structure and design features',
    icon: Eye,
    color: 'gray',
    tags: {
      multiplayer: 'Online or local multi-player gameplay modes',
      open_world: 'Non-linear exploration of large, interconnected game worlds',
      procedural: 'Algorithmically generated content for varied experiences',
      story_driven: 'Narrative-focused design with emphasis on plot and characters',
    },
  },
  engagement: {
    label: 'Engagement',
    description: 'Player retention and engagement mechanics',
    icon: Zap,
    color: 'amber',
    tags: {
      // Play modes
      pvp: 'Player versus player competitive modes',
      pve: 'Player versus environment cooperative or solo content',
      co_op: 'Cooperative multiplayer gameplay with other players',
      competitive: 'Ranked or skill-based matchmaking systems',
      // Player types
      casual: 'Accessible for short play sessions and relaxed gameplay',
      hardcore: 'Demanding gameplay requiring significant time and skill',
      // Retention mechanics
      daily_rewards: 'Incentives for consecutive daily logins or play sessions',
      battle_pass: 'Seasonal progression tracks with tiered rewards',
      events: 'Limited-time content with exclusive rewards',
      gacha: 'Randomized reward systems with purchasable attempts',
      energy_system: 'Time-gated mechanics limiting play sessions',
      auto_play: 'Automated gameplay features for passive progression',
      // Social
      guilds: 'Social organization systems with group goals and rewards',
      leaderboards: 'Competitive ranking and score comparison systems',
      achievements: 'Milestone rewards for completing specific challenges',
      social: 'Friend systems, chat, and social interactions',
    },
  },
  monetization: {
    label: 'Monetization',
    description: 'Business model and payment structures',
    icon: DollarSign,
    color: 'emerald',
    tags: {
      free_to_play: 'No upfront cost with optional purchases',
      premium: 'One-time purchase required for access',
      subscription: 'Recurring payment for continued access or benefits',
      iap: 'In-app purchases for virtual goods or currency',
      cosmetic_only: 'Purchases limited to visual items with no gameplay advantage',
      pay_to_win: 'Purchases providing significant gameplay advantages',
      dlc: 'Downloadable content expanding the base game',
      season_pass: 'Bundled content released over time',
      ad_supported: 'Free access with advertisement viewing',
    },
  },
  protagonist: {
    label: 'Protagonist',
    description: 'Player character configuration',
    icon: User,
    color: 'pink',
    tags: {
      customizable: 'Player-created character with appearance and attribute options',
      predefined: 'Fixed protagonist with established identity and backstory',
      silent: 'Protagonist who does not speak or has minimal dialogue',
      ensemble: 'Multiple playable characters with switching mechanics',
      non_human: 'Non-humanoid playable character (animal, robot, abstract)',
      child: 'Young protagonist navigating an adult world',
      villain: 'Playing as the antagonist or morally corrupt character',
      anti_hero: 'Protagonist with questionable morals or methods',
    },
  },
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30', icon: 'text-purple-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30', icon: 'text-blue-400' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30', icon: 'text-indigo-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/30', icon: 'text-cyan-400' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30', icon: 'text-teal-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/30', icon: 'text-violet-400' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-300', border: 'border-gray-500/30', icon: 'text-gray-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30', icon: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: 'text-emerald-400' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-300', border: 'border-pink-500/30', icon: 'text-pink-400' },
  green: { bg: 'bg-xbox-green/10', text: 'text-xbox-green', border: 'border-xbox-green/30', icon: 'text-xbox-green' },
};

// Genre Section Component
function GenreSection({ isExpanded, onToggle, searchQuery }: { isExpanded: boolean; onToggle: () => void; searchQuery: string }) {
  const colors = COLOR_CLASSES.green;

  const filteredGenres = Object.entries(GENRE_GLOSSARY).filter(([genreName, data]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return genreName.toLowerCase().includes(query) ||
           data.description.toLowerCase().includes(query) ||
           data.examples.some(ex => ex.toLowerCase().includes(query));
  });

  if (searchQuery && filteredGenres.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 ${colors.bg} border-b ${colors.border} transition-colors hover:bg-opacity-20`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border`}>
            <Layers className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Primary Genres</h3>
            <p className="text-sm text-dark-200">The main classification - ONE per game</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
            {filteredGenres.length} genres
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-dark-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-dark-200" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5">
          <div className="grid gap-3">
            {filteredGenres.map(([genreName, data]) => (
              <div
                key={genreName}
                className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-200 hover:border-opacity-50`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border whitespace-nowrap`}>
                      {genreName}
                    </span>
                    <p className="text-sm text-dark-100 leading-relaxed">{data.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-xs text-dark-300">Examples:</span>
                    <span className="text-xs text-dark-200">{data.examples.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GlossaryCategory {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tags: Record<string, string>;
}

interface CategorySectionProps {
  category: GlossaryCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}

function CategorySection({ category, isExpanded, onToggle, searchQuery }: CategorySectionProps) {
  const Icon = category.icon;
  const colors = COLOR_CLASSES[category.color];

  // Filter tags based on search
  const filteredTags = Object.entries(category.tags).filter(([tagName, description]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return tagName.toLowerCase().includes(query) || description.toLowerCase().includes(query);
  });

  if (searchQuery && filteredTags.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 ${colors.bg} border-b ${colors.border} transition-colors hover:bg-opacity-20`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">{category.label}</h3>
            <p className="text-sm text-dark-200">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
            {filteredTags.length} tags
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-dark-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-dark-200" />
          )}
        </div>
      </button>

      {/* Tags Grid */}
      {isExpanded && (
        <div className="p-5">
          <div className="grid gap-3">
            {filteredTags.map(([tagName, description]) => (
              <div
                key={tagName}
                className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-200 hover:border-opacity-50`}
              >
                <div className="flex items-start gap-3">
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${colors.bg} ${colors.text} ${colors.border} border capitalize whitespace-nowrap`}>
                    {tagName.replace(/_/g, ' ')}
                  </span>
                  <p className="text-sm text-dark-100 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TagGlossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['genres']));

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(['genres', ...Object.keys(TAG_GLOSSARY)]));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Count totals
  const totalGenres = Object.keys(GENRE_GLOSSARY).length;
  const totalTags = Object.values(TAG_GLOSSARY).reduce((acc, cat) => acc + Object.keys(cat.tags).length, 0);

  // Count matching for search
  const matchingGenres = searchQuery
    ? Object.entries(GENRE_GLOSSARY).filter(([name, data]) => {
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) ||
               data.description.toLowerCase().includes(query) ||
               data.examples.some(ex => ex.toLowerCase().includes(query));
      }).length
    : totalGenres;

  const matchingTags = searchQuery
    ? Object.values(TAG_GLOSSARY).reduce((acc, cat) => {
        return acc + Object.entries(cat.tags).filter(([tagName, desc]) => {
          const query = searchQuery.toLowerCase();
          return tagName.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        }).length;
      }, 0)
    : totalTags;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Classification Glossary</h1>
          <p className="text-dark-200 mt-1">
            Complete reference of genres and tags in the VGMS taxonomy
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={expandAll} className="btn-secondary text-sm">
            Expand All
          </button>
          <button onClick={collapseAll} className="btn-secondary text-sm">
            Collapse All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search genres and tags..."
              className="input-xbox pl-12"
            />
          </div>
          <div className="text-sm text-dark-200 whitespace-nowrap">
            {searchQuery ? (
              <span>
                Found <span className="text-xbox-green font-medium">{matchingGenres}</span> genres, <span className="text-xbox-green font-medium">{matchingTags}</span> tags
              </span>
            ) : (
              <span>
                <span className="text-xbox-green font-medium">{totalGenres}</span> genres, <span className="text-xbox-green font-medium">{totalTags}</span> tags
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Genre vs Tags Explanation */}
      <div className="glass-card p-4 border-l-4 border-blue-500">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-white">Genres vs Tags: What's the Difference?</h4>
            <div className="text-sm text-dark-200 mt-2 space-y-2">
              <p>
                <span className="text-xbox-green font-medium">Primary Genre</span> = The ONE defining classification.
                What you'd say if asked "what type of game is this?" (e.g., "It's a Metroidvania")
              </p>
              <p>
                <span className="text-purple-300 font-medium">Gameplay Tags</span> = ALL applicable elements.
                A game can have multiple tags (e.g., action + platformer + souls_like)
              </p>
              <p className="text-dark-300 italic">
                Example: Hollow Knight has Genre: "Metroidvania" and Tags: gameplay_action, gameplay_platformer, gameplay_metroidvania, mechanic_boss_battles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Section */}
      <div className="space-y-4">
        <GenreSection
          isExpanded={expandedCategories.has('genres')}
          onToggle={() => toggleCategory('genres')}
          searchQuery={searchQuery}
        />
      </div>

      {/* Tag Categories */}
      <div className="space-y-4">
        {Object.entries(TAG_GLOSSARY).map(([key, category]) => (
          <CategorySection
            key={key}
            category={category}
            isExpanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* No Results */}
      {searchQuery && matchingTags === 0 && matchingGenres === 0 && (
        <div className="glass-card p-12 text-center">
          <Search className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
          <p className="text-dark-200">
            No genres or tags match your search for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
