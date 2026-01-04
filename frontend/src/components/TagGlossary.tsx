import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Gamepad2, BookOpen, Palette, Map, Wrench, Eye, Zap, DollarSign, User, Sparkles } from 'lucide-react';

// Tag definitions with descriptions
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
    },
  },
  narrative: {
    label: 'Narrative',
    description: 'Story tone, genre, and thematic elements',
    icon: BookOpen,
    color: 'blue',
    tags: {
      horror: 'Fear-inducing atmosphere with scary themes, creatures, or psychological terror',
      comedy: 'Humorous tone with jokes, satire, or absurdist elements',
      mystery: 'Investigation-driven plot with clues, secrets, and revelations',
      scifi: 'Science fiction themes including futuristic technology, space, or alternate realities',
      fantasy: 'Magical elements, mythical creatures, and supernatural worldbuilding',
      historical: 'Set in or inspired by real historical periods and events',
      western: 'American frontier themes with cowboys, outlaws, and frontier justice',
    },
  },
  theme: {
    label: 'Theme',
    description: 'Core thematic elements and subject matter',
    icon: Sparkles,
    color: 'indigo',
    tags: {
      war: 'Military conflict as central theme, including combat and its consequences',
      exploration: 'Discovery and traversal of unknown territories as primary focus',
      survival: 'Endurance against hostile conditions, scarcity, or threats',
      crime: 'Criminal activities, law enforcement, or underworld narratives',
      family: 'Family relationships, dynamics, and bonds as central themes',
      revenge: 'Vengeance-driven narrative with retribution as motivation',
      coming_of_age: 'Character growth and maturation through formative experiences',
      politics: 'Power dynamics, governance, and political intrigue',
      environmental: 'Nature, ecology, or environmental themes and messages',
    },
  },
  setting: {
    label: 'Setting',
    description: 'World and environment context',
    icon: Map,
    color: 'cyan',
    tags: {
      fantasy: 'Magical realms with mythical elements and supernatural phenomena',
      scifi: 'Futuristic or technologically advanced settings',
      contemporary: 'Modern-day real-world settings and environments',
      historical: 'Past time periods with period-accurate elements',
      post_apocalyptic: 'World after civilization-ending events',
      urban: 'City environments with metropolitan infrastructure',
      rural: 'Countryside, villages, or non-urban environments',
      underwater: 'Oceanic or aquatic environments and settings',
      space: 'Outer space, planets, or cosmic environments',
    },
  },
  mechanic: {
    label: 'Mechanics',
    description: 'Specific gameplay systems and features',
    icon: Wrench,
    color: 'teal',
    tags: {
      leveling: 'Character or skill progression through experience points',
      crafting: 'Item creation from gathered materials and resources',
      farming: 'Agricultural cultivation and harvest mechanics',
      building: 'Construction of structures, bases, or environments',
      collection: 'Gathering and cataloging items, achievements, or collectibles',
      inventory: 'Item management systems with limited carrying capacity',
      permadeath: 'Permanent character death requiring restart',
      time_management: 'Scheduling and time allocation as core gameplay',
      resource_management: 'Strategic allocation and conservation of limited resources',
      stealth: 'Detection avoidance and covert movement systems',
      parkour: 'Athletic traversal including climbing, jumping, and acrobatics',
      dialogue_choices: 'Branching conversations affecting story or relationships',
      moral_choices: 'Ethical decisions with gameplay or narrative consequences',
      romance: 'Romantic relationship mechanics with NPCs',
    },
  },
  visual: {
    label: 'Visual Style',
    description: 'Art direction and graphical presentation',
    icon: Palette,
    color: 'violet',
    tags: {
      realistic: 'Photorealistic graphics aiming for visual authenticity',
      stylized: 'Artistic interpretation with distinctive visual identity',
      pixel_art: 'Retro-inspired pixel-based graphics',
      minimalist: 'Simplified, clean visual design with limited elements',
      hand_drawn: 'Illustration-style graphics with artistic brush or pen aesthetics',
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
    label: 'Engagement (Nitrogen)',
    description: 'Player retention and engagement mechanics',
    icon: Zap,
    color: 'amber',
    tags: {
      gacha: 'Randomized reward systems with purchasable attempts',
      daily_rewards: 'Incentives for consecutive daily logins or play sessions',
      energy_system: 'Time-gated mechanics limiting play sessions',
      pvp: 'Player versus player competitive modes',
      guild: 'Social organization systems with group goals and rewards',
      events: 'Limited-time content with exclusive rewards',
      battle_pass: 'Seasonal progression tracks with tiered rewards',
      auto_play: 'Automated gameplay features for passive progression',
    },
  },
  monetization: {
    label: 'Monetization (Nitrogen)',
    description: 'Business model and payment structures',
    icon: DollarSign,
    color: 'emerald',
    tags: {
      free_to_play: 'No upfront cost with optional purchases',
      premium: 'One-time purchase required for access',
      subscription: 'Recurring payment for continued access or benefits',
      iap: 'In-app purchases for virtual goods or currency',
    },
  },
  protagonist: {
    label: 'Protagonist (Nitrogen)',
    description: 'Player character configuration',
    icon: User,
    color: 'pink',
    tags: {
      customizable: 'Player-created character with appearance and attribute options',
      predefined: 'Fixed protagonist with established identity and backstory',
      ensemble: 'Multiple playable characters with switching mechanics',
      non_human: 'Non-humanoid playable character (animal, robot, abstract)',
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
};

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['gameplay']));

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
    setExpandedCategories(new Set(Object.keys(TAG_GLOSSARY)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Count total matching tags for search
  const totalTags = Object.values(TAG_GLOSSARY).reduce((acc, cat) => acc + Object.keys(cat.tags).length, 0);
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
          <h1 className="text-2xl font-bold text-white">Tag Glossary</h1>
          <p className="text-dark-200 mt-1">
            Complete reference of all VGMS classification tags
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
              placeholder="Search tags by name or description..."
              className="input-xbox pl-12"
            />
          </div>
          <div className="text-sm text-dark-200 whitespace-nowrap">
            {searchQuery ? (
              <span>
                Found <span className="text-xbox-green font-medium">{matchingTags}</span> of {totalTags} tags
              </span>
            ) : (
              <span>
                <span className="text-xbox-green font-medium">{totalTags}</span> total tags
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nitrogen Tags Notice */}
      <div className="glass-card p-4 border-l-4 border-xbox-green">
        <div className="flex gap-3">
          <Zap className="h-5 w-5 text-xbox-green flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-white">Nitrogen Tags</h4>
            <p className="text-sm text-dark-200 mt-1">
              Tags marked with "Nitrogen" are specialized classifications for mobile gaming analysis,
              tracking engagement mechanics, monetization models, and protagonist configurations.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
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
      {searchQuery && matchingTags === 0 && (
        <div className="glass-card p-12 text-center">
          <Search className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No tags found</h3>
          <p className="text-dark-200">
            No tags match your search for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
