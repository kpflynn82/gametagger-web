import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

// Genre lifecycle stages
type LifecycleStage = 'emerging' | 'growth' | 'mature' | 'declining';

interface GenreData {
  genre: string;
  stage: LifecycleStage;
  currentPlayers: number;
  trend: number; // percentage change
  color: string;
  data: { month: string; players: number }[];
}

// Simulated historical data - in production this would come from API
const GENRE_HISTORY: GenreData[] = [
  {
    genre: 'Roguelike',
    stage: 'growth',
    currentPlayers: 450000,
    trend: 34,
    color: '#22c55e',
    data: [
      { month: 'Aug', players: 180000 },
      { month: 'Sep', players: 220000 },
      { month: 'Oct', players: 280000 },
      { month: 'Nov', players: 350000 },
      { month: 'Dec', players: 410000 },
      { month: 'Jan', players: 450000 },
    ],
  },
  {
    genre: 'Cozy Sim',
    stage: 'growth',
    currentPlayers: 320000,
    trend: 28,
    color: '#f59e0b',
    data: [
      { month: 'Aug', players: 140000 },
      { month: 'Sep', players: 180000 },
      { month: 'Oct', players: 210000 },
      { month: 'Nov', players: 260000 },
      { month: 'Dec', players: 290000 },
      { month: 'Jan', players: 320000 },
    ],
  },
  {
    genre: 'FPS',
    stage: 'mature',
    currentPlayers: 1100000,
    trend: 5,
    color: '#3b82f6',
    data: [
      { month: 'Aug', players: 980000 },
      { month: 'Sep', players: 1020000 },
      { month: 'Oct', players: 1050000 },
      { month: 'Nov', players: 1080000 },
      { month: 'Dec', players: 1100000 },
      { month: 'Jan', players: 1100000 },
    ],
  },
  {
    genre: 'Battle Royale',
    stage: 'declining',
    currentPlayers: 420000,
    trend: -15,
    color: '#ef4444',
    data: [
      { month: 'Aug', players: 580000 },
      { month: 'Sep', players: 550000 },
      { month: 'Oct', players: 520000 },
      { month: 'Nov', players: 480000 },
      { month: 'Dec', players: 450000 },
      { month: 'Jan', players: 420000 },
    ],
  },
  {
    genre: 'Extraction Shooter',
    stage: 'emerging',
    currentPlayers: 180000,
    trend: 45,
    color: '#a855f7',
    data: [
      { month: 'Aug', players: 60000 },
      { month: 'Sep', players: 85000 },
      { month: 'Oct', players: 110000 },
      { month: 'Nov', players: 140000 },
      { month: 'Dec', players: 160000 },
      { month: 'Jan', players: 180000 },
    ],
  },
];

const LIFECYCLE_CONFIG: Record<LifecycleStage, { label: string; color: string; bgColor: string; description: string }> = {
  emerging: {
    label: 'Emerging',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
    description: 'New genre gaining traction',
  },
  growth: {
    label: 'Growth',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    description: 'Rapidly growing player base',
  },
  mature: {
    label: 'Mature',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    description: 'Stable, established genre',
  },
  declining: {
    label: 'Declining',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    description: 'Decreasing player interest',
  },
};

function formatPlayers(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

// Merge all genre data into one dataset for the chart
function mergeDataForChart(genres: GenreData[]) {
  const months = genres[0]?.data.map(d => d.month) || [];
  return months.map((month, idx) => {
    const point: Record<string, string | number> = { month };
    genres.forEach(genre => {
      point[genre.genre] = genre.data[idx]?.players || 0;
    });
    return point;
  });
}

interface GenreLifecycleTimelineProps {
  className?: string;
}

export default function GenreLifecycleTimeline({ className = '' }: GenreLifecycleTimelineProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    GENRE_HISTORY.slice(0, 3).map(g => g.genre)
  );

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const filteredGenres = GENRE_HISTORY.filter(g => selectedGenres.includes(g.genre));
  const chartData = mergeDataForChart(filteredGenres);

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Genre Lifecycle Trends</h3>
            <p className="text-sm text-dark-300">6-month player count trends by genre</p>
          </div>
        </div>
      </div>

      {/* Lifecycle Stage Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(LIFECYCLE_CONFIG).map(([stage, config]) => (
          <div
            key={stage}
            className={`px-3 py-1.5 rounded-lg border ${config.bgColor} flex items-center gap-2`}
            title={config.description}
          >
            {stage === 'emerging' && <TrendingUp className="h-3 w-3 text-purple-400" />}
            {stage === 'growth' && <TrendingUp className="h-3 w-3 text-green-400" />}
            {stage === 'mature' && <Minus className="h-3 w-3 text-blue-400" />}
            {stage === 'declining' && <TrendingDown className="h-3 w-3 text-red-400" />}
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Genre Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {GENRE_HISTORY.map(genre => {
          const isSelected = selectedGenres.includes(genre.genre);
          const stageConfig = LIFECYCLE_CONFIG[genre.stage];
          return (
            <button
              key={genre.genre}
              onClick={() => toggleGenre(genre.genre)}
              className={`px-3 py-2 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-dark-600 border-dark-400'
                  : 'bg-dark-700/50 border-dark-600 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: genre.color }}
                />
                <span className="text-sm font-medium text-white">{genre.genre}</span>
                <span className={`text-xs ${stageConfig.color}`}>
                  {genre.trend > 0 ? '+' : ''}{genre.trend}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="month"
              stroke="#525252"
              tick={{ fill: '#a3a3a3', fontSize: 12 }}
            />
            <YAxis
              stroke="#525252"
              tick={{ fill: '#a3a3a3', fontSize: 12 }}
              tickFormatter={(value) => formatPlayers(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f1f1f',
                border: '1px solid #404040',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number, name: string) => [formatPlayers(value), name]}
            />
            <Legend />
            {filteredGenres.map(genre => (
              <Line
                key={genre.genre}
                type="monotone"
                dataKey={genre.genre}
                stroke={genre.color}
                strokeWidth={2}
                dot={{ r: 4, fill: genre.color }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Genre Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {GENRE_HISTORY.map(genre => {
          const stageConfig = LIFECYCLE_CONFIG[genre.stage];
          return (
            <div
              key={genre.genre}
              className={`p-4 rounded-xl border ${stageConfig.bgColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="font-medium text-white">{genre.genre}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${stageConfig.bgColor} ${stageConfig.color}`}>
                  {stageConfig.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatPlayers(genre.currentPlayers)}
                  </p>
                  <p className="text-xs text-dark-400">current players</p>
                </div>
                <div className={`flex items-center gap-1 ${genre.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {genre.trend > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {genre.trend > 0 ? '+' : ''}{genre.trend}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight Box */}
      <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-sm text-purple-300">
          <span className="font-semibold">Insight:</span> Extraction Shooters (+45%) and Roguelikes (+34%) show strongest growth momentum.
          Consider prioritizing catalog acquisitions in these emerging/growth categories while Battle Royale (-15%)
          may be oversaturated.
        </p>
      </div>
    </div>
  );
}
