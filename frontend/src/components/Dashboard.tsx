import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Target, Gamepad2 } from 'lucide-react';
import { getStats, type StatsResponse } from '../services/api';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let colorClass = 'bg-green-100 text-green-800';
  if (percentage < 70) colorClass = 'bg-yellow-100 text-yellow-800';
  if (percentage < 50) colorClass = 'bg-red-100 text-red-800';

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {percentage}% avg confidence
    </span>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 30000,
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
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
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
    </div>
  );
}
