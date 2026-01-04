import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Target, Gamepad2, Trophy, X } from 'lucide-react';
import { getStats, getPopularGames, getAnalysis, type StatsResponse, type PopularGamesResponse } from '../services/api';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// Tag category configuration
const TAG_CATEGORIES: Record<string, { label: string; color: string; prefix: string }> = {
  gameplay: { label: 'Gameplay', color: 'bg-purple-100 text-purple-700', prefix: 'gameplay_' },
  narrative: { label: 'Narrative', color: 'bg-blue-100 text-blue-700', prefix: 'narrative_' },
  theme: { label: 'Theme', color: 'bg-indigo-100 text-indigo-700', prefix: 'theme_' },
  setting: { label: 'Setting', color: 'bg-cyan-100 text-cyan-700', prefix: 'setting_' },
  mechanic: { label: 'Mechanic', color: 'bg-teal-100 text-teal-700', prefix: 'mechanic_' },
  visual: { label: 'Visual', color: 'bg-violet-100 text-violet-700', prefix: 'visual_' },
  features: { label: 'Features', color: 'bg-gray-100 text-gray-700', prefix: '' },
  engagement: { label: 'Engagement', color: 'bg-amber-100 text-amber-700', prefix: 'engagement_' },
  monetization: { label: 'Monetization', color: 'bg-emerald-100 text-emerald-700', prefix: 'monetization_' },
  protagonist: { label: 'Protagonist', color: 'bg-pink-100 text-pink-700', prefix: 'protagonist_' },
};

const FEATURE_TAGS = ['multiplayer', 'open_world', 'procedural', 'story_driven'];

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {analysis?.detected_game || analysis?.game_name || 'Loading...'}
            </h2>
            {analysis?.primary_genre && (
              <p className="text-sm text-gray-500">{analysis.primary_genre}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">Failed to load analysis</div>
          ) : (
            <div className="space-y-4">
              {analysis?.analysis_notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">{analysis.analysis_notes}</p>
                </div>
              )}

              {Object.entries(TAG_CATEGORIES).map(([category, config]) => {
                const tags = groupedTags[category];
                if (!tags || tags.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{config.label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span key={tag} className={`${config.color} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {Object.keys(groupedTags).length === 0 && (
                <p className="text-gray-500 text-center py-4">No tags found</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Sources: {analysis?.sources_used?.join(', ') || '-'}</span>
            <span>Confidence: {analysis?.confidence || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-primary-100 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600" />
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load dashboard stats. Is the backend running?
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
  const engagementTags = (stats.tag_distribution.engagement || []).slice(0, 8).map((t) => ({
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
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          subtitle="analyses"
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Genres</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Success Rates */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Success Rates</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}%`}
                  dataKey="value"
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gameplay Tags Distribution */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gameplay Tags Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gameplayTags}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nitrogen Tags Section */}
      {(engagementTags.length > 0 || monetizationTags.length > 0 || protagonistTags.length > 0) && (
        <>
          <h2 className="text-xl font-bold text-gray-900">Nitrogen Tags</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Engagement Tags */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
              {engagementTags.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementTags} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No engagement data yet</p>
              )}
            </div>

            {/* Monetization Tags */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monetization</h3>
              {monetizationTags.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monetizationTags} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No monetization data yet</p>
              )}
            </div>

            {/* Protagonist Tags */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Protagonist</h3>
              {protagonistTags.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={protagonistTags} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No protagonist data yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Popular Games */}
      {popularGames && popularGames.items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Most Tagged Games</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularGames.items.slice(0, 10).map((game, index) => (
              <div
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-400 w-6">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{game.detected_game || game.game_name}</p>
                    <p className="text-xs text-gray-500">{game.primary_genre}</p>
                  </div>
                </div>
                <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                  {game.tag_count} tags
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h3>
        {stats.recent_analyses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No analyses yet. Start by analyzing a game!</p>
        ) : (
          <div className="space-y-3">
            {stats.recent_analyses.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => setSelectedGameId(analysis.id)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{analysis.detected_game || analysis.game_name}</p>
                  <p className="text-sm text-gray-500">
                    {analysis.primary_genre} - {analysis.tag_count} tags
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`confidence-${analysis.confidence} px-2 py-1 rounded-full text-xs font-medium`}>
                    {analysis.confidence}
                  </span>
                  <span className="text-xs text-gray-400">
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
