import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Star,
  Users,
  Calendar,
  HardDrive,
  Globe,
  Shield,
  MonitorPlay,
  Gamepad2,
  ChevronRight,
  ChevronDown,
  Check,
  Heart,
  Share2,
  ShoppingCart,
  Gift,
  Clock,
  Zap,
  DollarSign,
  User,
  Award,
  Sparkles,
} from 'lucide-react';
import { getAnalysis } from '../services/api';

// Tag category configuration with Xbox-style colors
const TAG_CATEGORIES: Record<string, { label: string; color: string; bgColor: string; prefix: string }> = {
  gameplay: { label: 'Gameplay', color: 'text-purple-300', bgColor: 'bg-purple-500/20', prefix: 'gameplay_' },
  narrative: { label: 'Story', color: 'text-blue-300', bgColor: 'bg-blue-500/20', prefix: 'narrative_' },
  theme: { label: 'Themes', color: 'text-indigo-300', bgColor: 'bg-indigo-500/20', prefix: 'theme_' },
  setting: { label: 'Setting', color: 'text-cyan-300', bgColor: 'bg-cyan-500/20', prefix: 'setting_' },
  mechanic: { label: 'Mechanics', color: 'text-teal-300', bgColor: 'bg-teal-500/20', prefix: 'mechanic_' },
  visual: { label: 'Visuals', color: 'text-violet-300', bgColor: 'bg-violet-500/20', prefix: 'visual_' },
  engagement: { label: 'Engagement', color: 'text-amber-300', bgColor: 'bg-amber-500/20', prefix: 'engagement_' },
  monetization: { label: 'Purchase Info', color: 'text-emerald-300', bgColor: 'bg-emerald-500/20', prefix: 'monetization_' },
  protagonist: { label: 'Main Character', color: 'text-pink-300', bgColor: 'bg-pink-500/20', prefix: 'protagonist_' },
};

// Helper function to format tag names for display
function formatTagName(tag: string, prefix: string): string {
  return tag.replace(prefix, '').replace(/_/g, ' ');
}

// Function to generate game screenshot URLs
// Uses RAWG.io CDN with fallback to gradient placeholder
function getGameImageUrl(gameName: string, _type: 'hero' | 'thumb' = 'hero'): string {
  // Normalize game name for URL encoding
  const normalizedName = gameName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  // Try RAWG.io CDN (free, good coverage)
  return `https://media.rawg.io/media/games/${normalizedName}.jpg`;
}

// Generate placeholder gradient based on game name
function getPlaceholderGradient(gameName: string): string {
  // Generate consistent colors from game name
  let hash = 0;
  for (let i = 0; i < gameName.length; i++) {
    hash = gameName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 25%) 0%, hsl(${hue2}, 60%, 15%) 100%)`;
}

interface XboxStoreMockupProps {
  gameId: number;
  onClose: () => void;
}

// Engagement insight component
function EngagementInsight({ tags }: { tags: string[] }) {
  const getEngagementDescription = (tag: string): string => {
    const descriptions: Record<string, string> = {
      'daily play': 'This game rewards daily check-ins with bonuses and rewards.',
      'competitive': 'Features competitive multiplayer modes and rankings.',
      'collection': 'Includes collectible items, achievements, and unlockables.',
      'progression': 'Deep progression systems with levels, skills, and upgrades.',
      'social': 'Strong social features for playing with friends.',
      'events': 'Regular live events and limited-time content.',
      'challenges': 'Daily and weekly challenges to complete.',
      'leaderboards': 'Global and friend leaderboards to compete on.',
    };
    return descriptions[tag.toLowerCase()] || 'Engaging gameplay feature.';
  };

  if (tags.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/20 rounded-xl p-5 border border-amber-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Zap className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h4 className="font-semibold text-white">Player Engagement</h4>
          <p className="text-xs text-amber-200/70">What keeps players coming back</p>
        </div>
      </div>
      <div className="space-y-3">
        {tags.slice(0, 4).map((tag) => (
          <div key={tag} className="flex items-start gap-3">
            <Check className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white capitalize">{tag}</p>
              <p className="text-xs text-amber-100/60">{getEngagementDescription(tag)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Monetization insight component
function MonetizationInsight({ tags }: { tags: string[] }) {
  const getMonetizationIcon = (tag: string) => {
    if (tag.includes('free') || tag.includes('f2p')) return <Gift className="h-4 w-4" />;
    if (tag.includes('subscription') || tag.includes('pass')) return <Calendar className="h-4 w-4" />;
    if (tag.includes('premium') || tag.includes('paid')) return <DollarSign className="h-4 w-4" />;
    return <ShoppingCart className="h-4 w-4" />;
  };

  const getMonetizationDescription = (tag: string): string => {
    const descriptions: Record<string, string> = {
      'premium': 'One-time purchase with full game access.',
      'free to play': 'Free to download and play.',
      'subscription': 'Requires active subscription.',
      'game pass': 'Available with Xbox Game Pass.',
      'dlc': 'Additional paid content available.',
      'cosmetic mtx': 'Cosmetic-only microtransactions.',
      'battle pass': 'Seasonal battle pass available.',
      'in app purchases': 'Contains in-app purchases.',
    };
    return descriptions[tag.toLowerCase()] || 'Purchase option available.';
  };

  if (tags.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/20 rounded-xl p-5 border border-emerald-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <DollarSign className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-semibold text-white">Purchase Information</h4>
          <p className="text-xs text-emerald-200/70">How this game is monetized</p>
        </div>
      </div>
      <div className="space-y-3">
        {tags.map((tag) => (
          <div key={tag} className="flex items-start gap-3">
            <span className="text-emerald-400 mt-0.5 flex-shrink-0">{getMonetizationIcon(tag)}</span>
            <div>
              <p className="text-sm font-medium text-white capitalize">{tag}</p>
              <p className="text-xs text-emerald-100/60">{getMonetizationDescription(tag)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Protagonist insight component
function ProtagonistInsight({ tags }: { tags: string[] }) {
  const getProtagonistDescription = (tag: string): string => {
    const descriptions: Record<string, string> = {
      'customizable': 'Create and customize your own character.',
      'male': 'Play as a male protagonist.',
      'female': 'Play as a female protagonist.',
      'choice': 'Choose your character\'s gender and appearance.',
      'silent': 'Silent protagonist for self-insertion.',
      'voiced': 'Fully voiced protagonist with personality.',
      'multiple': 'Multiple playable characters available.',
      'animal': 'Play as a non-human character.',
    };
    return descriptions[tag.toLowerCase()] || 'Unique protagonist features.';
  };

  if (tags.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/20 rounded-xl p-5 border border-pink-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <User className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <h4 className="font-semibold text-white">Main Character</h4>
          <p className="text-xs text-pink-200/70">Who you play as</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag}
            className="px-3 py-2 bg-pink-500/20 rounded-lg border border-pink-500/30"
            title={getProtagonistDescription(tag)}
          >
            <p className="text-sm font-medium text-pink-200 capitalize">{tag}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact tag pill component for Xbox-style display
function TagPill({ tag, color = 'gray' }: { tag: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-xbox-green/20 text-xbox-green border-xbox-green/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    gray: 'bg-white/10 text-white/70 border-white/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClasses[color] || colorClasses.gray} capitalize`}>
      {tag}
    </span>
  );
}

// Main Xbox Store Mockup Component
export default function XboxStoreMockup({ gameId, onClose }: XboxStoreMockupProps) {
  const [imageError, setImageError] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', gameId],
    queryFn: () => getAnalysis(gameId),
  });

  // Group tags by category
  const groupedTags: Record<string, string[]> = {};
  const nitrogenTags: Record<string, string[]> = {
    engagement: [],
    monetization: [],
    protagonist: [],
  };

  // Helper to process tags from any source
  const processTags = (tagsSource: Record<string, unknown>) => {
    Object.entries(tagsSource).forEach(([tag, value]) => {
      if (value !== true) return;

      // Check for nitrogen tags first
      if (tag.startsWith('engagement_')) {
        nitrogenTags.engagement.push(formatTagName(tag, 'engagement_'));
        return;
      }
      if (tag.startsWith('monetization_')) {
        nitrogenTags.monetization.push(formatTagName(tag, 'monetization_'));
        return;
      }
      if (tag.startsWith('protagonist_')) {
        nitrogenTags.protagonist.push(formatTagName(tag, 'protagonist_'));
        return;
      }

      // Find category for other tags
      let foundCategory = 'gameplay'; // default fallback
      for (const [cat, config] of Object.entries(TAG_CATEGORIES)) {
        if (config.prefix && tag.startsWith(config.prefix)) {
          foundCategory = cat;
          break;
        }
      }

      if (!groupedTags[foundCategory]) {
        groupedTags[foundCategory] = [];
      }
      const displayName = TAG_CATEGORIES[foundCategory].prefix
        ? formatTagName(tag, TAG_CATEGORIES[foundCategory].prefix)
        : tag.replace(/_/g, ' ');
      groupedTags[foundCategory].push(displayName);
    });
  };

  // Try to get tags from structured tags object first, then fall back to flat structure
  if (analysis?.tags) {
    processTags(analysis.tags);
  } else if (analysis) {
    // Fall back to flat structure - filter out known non-tag properties
    const knownProps = ['game_name', 'detected_game', 'confidence', 'primary_genre', 'analysis_notes', 'sources_used', 'id', 'created_at'];
    const flatTags: Record<string, unknown> = {};
    Object.entries(analysis).forEach(([key, value]) => {
      if (!knownProps.includes(key) && typeof value === 'boolean') {
        flatTags[key] = value;
      }
    });
    processTags(flatTags);
  }

  // Calculate total tags for display
  const totalTags = Object.values(groupedTags).reduce((sum, tags) => sum + tags.length, 0);

  // Generate mock price based on monetization tags
  const isFreeToPlay = nitrogenTags.monetization.some(
    (tag) => tag.toLowerCase().includes('free') || tag.toLowerCase().includes('f2p')
  );
  const mockPrice = isFreeToPlay ? 'Free' : '$59.99';
  const hasGamePass = nitrogenTags.monetization.some(
    (tag) => tag.toLowerCase().includes('game pass') || tag.toLowerCase().includes('subscription')
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner h-12 w-12"></div>
          <p className="text-white text-lg">Loading Xbox Store Preview...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">Failed to load game data</p>
          <button onClick={onClose} className="btn-xbox">
            Close
          </button>
        </div>
      </div>
    );
  }

  const gameName = analysis.detected_game || analysis.game_name || 'Unknown Game';

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] z-50 overflow-y-auto">
      {/* Xbox Header Bar */}
      <header className="sticky top-0 z-50 bg-[#1f1f1f]/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Xbox Logo and Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#107C10] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">X</span>
                </div>
                <span className="text-white font-semibold text-lg hidden sm:block">XBOX</span>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <span className="text-white/70 text-sm hover:text-white cursor-pointer transition-colors">
                  Game Pass
                </span>
                <span className="text-white font-medium text-sm border-b-2 border-[#107C10] pb-4 -mb-4">
                  Games
                </span>
                <span className="text-white/70 text-sm hover:text-white cursor-pointer transition-colors">
                  Devices
                </span>
                <span className="text-white/70 text-sm hover:text-white cursor-pointer transition-colors">
                  Play
                </span>
                <span className="text-white/70 text-sm hover:text-white cursor-pointer transition-colors">
                  Community
                </span>
              </nav>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 font-medium">
                VGMS Preview Mode
              </span>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-[#1a1a1a] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50 hover:text-white cursor-pointer transition-colors">Xbox</span>
            <ChevronRight className="h-4 w-4 text-white/30" />
            <span className="text-white/50 hover:text-white cursor-pointer transition-colors">Games</span>
            <ChevronRight className="h-4 w-4 text-white/30" />
            <span className="text-white/50 hover:text-white cursor-pointer transition-colors">
              {analysis.primary_genre || 'All Games'}
            </span>
            <ChevronRight className="h-4 w-4 text-white/30" />
            <span className="text-white">{gameName}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Media */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-video bg-gradient-to-br from-[#107C10]/20 to-[#0a0a0a] rounded-xl overflow-hidden border border-white/10">
              {!imageError ? (
                <img
                  src={getGameImageUrl(gameName, 'hero')}
                  alt={gameName}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: getPlaceholderGradient(gameName) }}
                >
                  <div className="text-center p-8">
                    <h2 className="text-4xl font-bold text-white mb-2">{gameName}</h2>
                    <p className="text-white/60 text-sm">{analysis.primary_genre}</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2">
                  {hasGamePass && (
                    <span className="bg-[#107C10] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                      Game Pass
                    </span>
                  )}
                  {analysis.confidence === 'high' && (
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded">
                      VGMS Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* About This Game - VGMS Tags Section */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[#107C10]" />
                    <h2 className="text-xl font-bold text-white">About This Game</h2>
                  </div>
                  <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">
                    {totalTags} VGMS Tags
                  </span>
                </div>
              </div>

              {/* Analysis Notes */}
              {analysis.analysis_notes && (
                <div className="p-6 border-b border-white/10">
                  <p className="text-white/80 leading-relaxed">{analysis.analysis_notes}</p>
                </div>
              )}

              {/* Tag Categories - Compact Xbox-style layout */}
              <div className="p-6 space-y-4">
                {Object.entries(TAG_CATEGORIES)
                  .filter(([category]) => !['engagement', 'monetization', 'protagonist'].includes(category))
                  .map(([category, config]) => {
                    const tags = groupedTags[category];
                    if (!tags || tags.length === 0) return null;

                    const displayTags = showAllTags ? tags : tags.slice(0, 8);
                    const hasMore = tags.length > 8;

                    // Map category to TagPill color
                    const colorMap: Record<string, string> = {
                      gameplay: 'purple',
                      narrative: 'blue',
                      theme: 'blue',
                      setting: 'cyan',
                      mechanic: 'green',
                      visual: 'purple',
                      features: 'gray',
                    };

                    return (
                      <div key={category} className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-medium ${config.color} uppercase tracking-wide min-w-[70px]`}>
                          {config.label}
                        </span>
                        {displayTags.map((tag) => (
                          <TagPill key={tag} tag={tag} color={colorMap[category] || 'gray'} />
                        ))}
                        {hasMore && !showAllTags && (
                          <button
                            onClick={() => setShowAllTags(true)}
                            className="text-white/40 hover:text-white text-xs flex items-center gap-0.5"
                          >
                            +{tags.length - 8}
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Shopper Insights Section - The Key VGMS Value Prop */}
            {(nitrogenTags.engagement.length > 0 ||
              nitrogenTags.monetization.length > 0 ||
              nitrogenTags.protagonist.length > 0) && (
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-[#107C10]" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Shopper Insights</h2>
                      <p className="text-sm text-white/50 mt-0.5">
                        Detailed information to help you decide if this game is right for you
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EngagementInsight tags={nitrogenTags.engagement} />
                    <MonetizationInsight tags={nitrogenTags.monetization} />
                    {nitrogenTags.protagonist.length > 0 && (
                      <div className="md:col-span-2">
                        <ProtagonistInsight tags={nitrogenTags.protagonist} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Capabilities Section */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Capabilities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {groupedTags.features?.includes('multiplayer') && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-white/50" />
                    <span className="text-sm text-white/80">Online multiplayer</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MonitorPlay className="h-5 w-5 text-white/50" />
                  <span className="text-sm text-white/80">4K Ultra HD</span>
                </div>
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5 text-white/50" />
                  <span className="text-sm text-white/80">Single player</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-white/50" />
                  <span className="text-sm text-white/80">Xbox achievements</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-white/50" />
                  <span className="text-sm text-white/80">Cloud enabled</span>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-white/50" />
                  <span className="text-sm text-white/80">Smart Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="space-y-6">
            {/* Game Title Card */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
              <h1 className="text-2xl font-bold text-white mb-2">{gameName}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-white/60">{analysis.primary_genre}</span>
                {analysis.confidence && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      analysis.confidence === 'high'
                        ? 'bg-[#107C10]/20 text-[#52B043]'
                        : analysis.confidence === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {analysis.confidence} confidence
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-white/60">4.2 (12,847 ratings)</span>
              </div>

              {/* Price and Buy Button */}
              <div className="space-y-4">
                {hasGamePass ? (
                  <div className="bg-gradient-to-r from-[#107C10] to-[#0B5E0B] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-bold text-lg">Included with Game Pass</span>
                    </div>
                    <p className="text-white/80 text-sm mb-3">
                      Play this game and 100+ more with Xbox Game Pass
                    </p>
                    <button className="w-full bg-white text-[#107C10] font-bold py-3 rounded-lg hover:bg-white/90 transition-colors">
                      Join Game Pass
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{mockPrice}</span>
                      {!isFreeToPlay && <span className="text-sm text-white/40 line-through">$69.99</span>}
                    </div>
                    <button className="w-full bg-[#107C10] hover:bg-[#0E9C0E] text-white font-bold py-3 rounded-lg transition-colors">
                      {isFreeToPlay ? 'Get' : 'Buy'}
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 rounded-lg transition-colors">
                    <Heart className="h-5 w-5" />
                    <span className="text-sm font-medium">Wishlist</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 rounded-lg transition-colors">
                    <Share2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Developer</span>
                <span className="text-white">Xbox Game Studios</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Publisher</span>
                <span className="text-white">Microsoft</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Release date</span>
                <span className="text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/50" />
                  2024
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Approximate size</span>
                <span className="text-white flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-white/50" />
                  50+ GB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Data sources</span>
                <div className="flex gap-1">
                  {analysis.sources_used?.map((source) => (
                    <span
                      key={source}
                      className={`text-xs px-2 py-0.5 rounded ${
                        source === 'steam'
                          ? 'bg-blue-500/20 text-blue-300'
                          : source === 'xbox'
                          ? 'bg-[#107C10]/20 text-[#52B043]'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ESRB Rating Placeholder */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-white/60 text-2xl font-bold">T</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Teen</p>
                  <p className="text-white/50 text-sm">Violence, Mild Language</p>
                </div>
              </div>
            </div>

            {/* Time to Beat */}
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-[#107C10]" />
                <h3 className="text-lg font-semibold text-white">How Long to Beat</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Main Story</span>
                  <span className="text-white">12-15 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Completionist</span>
                  <span className="text-white">40+ hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#107C10] rounded flex items-center justify-center">
                <span className="text-white font-bold">X</span>
              </div>
              <span className="text-white/50 text-sm">
                This is a VGMS mockup preview. Not an actual Xbox store page.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-white/50 text-sm hover:text-white cursor-pointer">Privacy</span>
              <span className="text-white/50 text-sm hover:text-white cursor-pointer">Terms</span>
              <span className="text-white/50 text-sm hover:text-white cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
