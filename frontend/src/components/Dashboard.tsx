import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Clock, Target, Gamepad2, Trophy, X, ArrowUpRight, Zap } from 'lucide-react';
import { getStats, getPopularGames, getAnalysis, type StatsResponse, type PopularGamesResponse } from '../services/api';

const CHART_COLORS = ['#107C10', '#52B043', '#10b981', '#22c55e', '#4ade80', '#86efac'];

// Tag category configuration
const TAG_CATEGORIES: Record<string, { label: string; color: string; prefix: string }> = {
  gameplay: { label: 'Gameplay', color: 'tag-gameplay', prefix: 'gameplay_' },
  narrative: { label: 'Narrative', color: 'tag-narrative', prefix: 'narrative_' },
  theme: { label: 'Theme', color: 'tag-theme', prefix: 'theme_' },
  setting: { label: 'Setting', color: 'tag-setting', prefix: 'setting_' },
  mechanic: { label: 'Mechanic', color: 'tag-mechanic', prefix: 'mechanic_' },
  visual: { label: 'Visual', color: 'tag-visual', prefix: 'visual_' },
  features: { label: 'Features', color: 'tag-features', prefix: '' },
  engagement: { label: 'Engagement', color: 'tag-engagement', prefix: 'engagement_' },
  monetization: { label: 'Monetization', color: 'tag-monetization', prefix: 'monetization_' },
  protagonist: { label: 'Protagonist', color: 'tag-protagonist', prefix: 'protagonist_' },
};

const FEATURE_TAGS = ['multiplayer', 'open_world', 'procedural', 'story_driven'];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white font-medium">{label}</p>
        <p className="text-xbox-green">{payload[0].value} games</p>
      </div>
    );
  }
  return null;
};

function GameDetailModal({ gameId, onClose }: { gameId: number; onClose: () => void }) {
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', gameId],
    queryFn: () => getAnalysis(gameId),
  });

  // Group tags by category
  const groupedTags: Record<string, string[]> = {};
  if (analysis?.tags) {
    Object.entries(analysis.tags).forEach(([tag, value]) => {
      if (value !== true) return;

      let foundCategory = 'features';
      for (const [cat, config] of Object.entries(TAG_CATEGORIES)) {
        if (config.prefix && tag.startsWith(config.prefix)) {
          foundCategory = cat;
          break;
        }
      }
      if (FEATURE_TAGS.includes(tag)) {
        foundCategory = 'features';
      }

      if (!groupedTags[foundCategory]) {
        groupedTags[foundCategory] = [];
      }
      const displayName = TAG_CATEGORIES[foundCategory].prefix
        ? tag.replace(TAG_CATEGORIES[foundCategory].prefix, '').replace(/_/g, ' ')
        : tag.replace(/_/g, ' ');
      groupedTags[foundCategory].push(displayName);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div>
            <h2 className="text-xl font-bold text-white">
              {analysis?.detected_game || analysis?.game_name || 'Loading...'}
            </h2>
            {analysis?.primary_genre && (
              <p className="text-sm text-dark-200 mt-1">{analysis.primary_genre}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-dark-300 hover:text-white transition-colors rounded-lg hover:bg-dark-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">Failed to load analysis</div>
          ) : (
            <div className="space-y-6">
              {analysis?.analysis_notes && (
                <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
                  <p className="text-sm text-dark-100">{analysis.analysis_notes}</p>
                </div>
              )}

              {Object.entries(TAG_CATEGORIES).map(([category, config]) => {
                const tags = groupedTags[category];
                if (!tags || tags.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">{config.label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className={`${config.color} px-3 py-1.5 rounded-lg text-xs font-medium capitalize`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {Object.keys(groupedTags).length === 0 && (
                <p className="text-dark-300 text-center py-4">No tags found</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-600 bg-dark-700/50">
          <div className="flex items-center justify-between text-sm text-dark-200">
            <span>Sources: {analysis?.sources_used?.join(', ') || '-'}</span>
            <span className={`confidence-${analysis?.confidence} px-2 py-1 rounded-lg text-xs font-medium`}>
              {analysis?.confidence || '-'} confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, subtitle, trend }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: number;
}) {
  return (
    <div className="glass-card glass-card-hover p-6 stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-200">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-dark-300 mt-1 flex items-center gap-1">
              {trend !== undefined && (
                <span className={`flex items-center ${trend >= 0 ? 'text-xbox-green' : 'text-red-400'}`}>
                  <ArrowUpRight className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(trend)}%
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 bg-xbox-green/10 rounded-xl border border-xbox-green/20">
          <Icon className="h-6 w-6 text-xbox-green" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const { data: stats, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 30000,
  });

  const { data: popularGames } = useQuery<PopularGamesResponse>({
    queryKey: ['popular-games'],
    queryFn: () => getPopularGames(10),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-10 w-10"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
        <p className="text-dark-200">Failed to load dashboard stats. Please check if the backend is running.</p>
      </div>
    );
  }

  // Prepare genre chart data
  const genreData = stats.top_genres.slice(0, 6).map((g) => ({
    name: g.name,
    count: g.count,
  }));

  // Prepare source success data
  const sourceData = Object.entries(stats.source_success_rates).map(([source, rate]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: Math.round(rate * 100),
  }));

  // Prepare gameplay tags for bar chart
  const gameplayTags = (stats.tag_distribution.gameplay || []).slice(0, 8).map((t) => ({
    name: t.tag_name.replace('gameplay_', ''),
    count: t.count,
  }));

  // Prepare nitrogen tags for charts
  const engagementTags = (stats.tag_distribution.engagement || []).slice(0, 6).map((t) => ({
    name: t.tag_name.replace('engagement_', '').replace(/_/g, ' '),
    count: t.count,
  }));

  const monetizationTags = (stats.tag_distribution.monetization || []).slice(0, 4).map((t) => ({
    name: t.tag_name.replace('monetization_', '').replace(/_/g, ' '),
    count: t.count,
  }));

  const protagonistTags = (stats.tag_distribution.protagonist || []).slice(0, 4).map((t) => ({
    name: t.tag_name.replace('protagonist_', '').replace(/_/g, ' '),
    count: t.count,
  }));

  return (
    <div className="space-y-8 animate-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Analyses"
          value={stats.total_analyses}
          icon={Gamepad2}
          subtitle="all time"
        />
        <StatCard
          title="This Week"
          value={stats.analyses_this_week}
          icon={TrendingUp}
          subtitle="new analyses"
        />
        <StatCard
          title="Avg Confidence"
          value={`${Math.round(stats.average_confidence * 100)}%`}
          icon={Target}
        />
        <StatCard
          title="Top Genre"
          value={stats.top_genres[0]?.name || 'N/A'}
          icon={Clock}
          subtitle={`${stats.top_genres[0]?.count || 0} games`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Top Genres</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#107C10" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Success Rates */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Source Success Rates</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}%`}
                  dataKey="value"
                  stroke="#1a1a1a"
                  strokeWidth={2}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gameplay Tags Distribution */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Gameplay Tags Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={gameplayTags} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGameplay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#107C10" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#107C10" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
              <YAxis stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#107C10" strokeWidth={2} fillOpacity={1} fill="url(#colorGameplay)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nitrogen Tags Section */}
      {(engagementTags.length > 0 || monetizationTags.length > 0 || protagonistTags.length > 0) && (
        <>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nitrogen Tags</h2>
              <p className="text-sm text-dark-300">Mobile gaming analytics and monetization insights</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Engagement Tags */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Engagement
              </h3>
              {engagementTags.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementTags} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10, fill: '#a3a3a3' }} stroke="#525252" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-dark-400 text-sm text-center py-8">No engagement data yet</p>
              )}
            </div>

            {/* Monetization Tags */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Monetization
              </h3>
              {monetizationTags.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monetizationTags} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10, fill: '#a3a3a3' }} stroke="#525252" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-dark-400 text-sm text-center py-8">No monetization data yet</p>
              )}
            </div>

            {/* Protagonist Tags */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                Protagonist
              </h3>
              {protagonistTags.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={protagonistTags} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10, fill: '#a3a3a3' }} stroke="#525252" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-dark-400 text-sm text-center py-8">No protagonist data yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Popular Games */}
      {popularGames && popularGames.items.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Most Tagged Games</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularGames.items.slice(0, 10).map((game, index) => (
              <div
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl border border-dark-600 hover:border-xbox-green/30 hover:bg-dark-600/50 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-dark-400 w-8">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-white">{game.detected_game || game.game_name}</p>
                    <p className="text-xs text-dark-300">{game.primary_genre}</p>
                  </div>
                </div>
                <span className="bg-xbox-green/10 text-xbox-green border border-xbox-green/20 px-3 py-1 rounded-lg text-sm font-medium">
                  {game.tag_count} tags
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Recent Analyses</h3>
        {stats.recent_analyses.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="h-12 w-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-300">No analyses yet. Start by analyzing a game!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recent_analyses.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => setSelectedGameId(analysis.id)}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl border border-dark-600 hover:border-xbox-green/30 hover:bg-dark-600/50 cursor-pointer transition-all duration-200"
              >
                <div>
                  <p className="font-medium text-white">{analysis.detected_game || analysis.game_name}</p>
                  <p className="text-sm text-dark-300">
                    {analysis.primary_genre} - {analysis.tag_count} tags
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`confidence-${analysis.confidence} px-2 py-1 rounded-lg text-xs font-medium`}>
                    {analysis.confidence}
                  </span>
                  <span className="text-xs text-dark-400">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Detail Modal */}
      {selectedGameId && (
        <GameDetailModal
          gameId={selectedGameId}
          onClose={() => setSelectedGameId(null)}
        />
      )}
    </div>
  );
}
