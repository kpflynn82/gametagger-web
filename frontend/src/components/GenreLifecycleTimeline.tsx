import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Plus, X, ChevronDown, Loader2 } from 'lucide-react';
import { getGenreStats, GenreStat } from '../services/api';

// Genre lifecycle stages
type LifecycleStage = 'emerging' | 'growth' | 'mature' | 'declining';

interface GenreData {
  genre: string;
  stage: LifecycleStage;
  currentCount: number;
  trend: number; // percentage change
  color: string;
  games: string[];
  data: { month: string; count: number }[];
}

// Transform API data to component format
function transformGenreData(genres: GenreStat[]): GenreData[] {
  return genres.map(g => ({
    genre: g.genre,
    stage: g.stage,
    currentCount: g.count,
    trend: g.trend,
    color: g.color,
    games: g.games,
    data: g.history.map(h => ({ month: h.month, count: h.count })),
  }));
}

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

function formatCount(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Merge all genre data into one dataset for the chart
function mergeDataForChart(genres: GenreData[]) {
  const months = genres[0]?.data.map(d => d.month) || [];
  return months.map((month, idx) => {
    const point: Record<string, string | number> = { month };
    genres.forEach(genre => {
      point[genre.genre] = genre.data[idx]?.count || 0;
    });
    return point;
  });
}

interface GenreLifecycleTimelineProps {
  className?: string;
}

export default function GenreLifecycleTimeline({ className = '' }: GenreLifecycleTimelineProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch genre data from API
  const { data: genreStatsData, isLoading, error } = useQuery({
    queryKey: ['genreStats'],
    queryFn: getGenreStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform API data
  const allGenres = useMemo(() => {
    if (!genreStatsData?.genres) return [];
    return transformGenreData(genreStatsData.genres);
  }, [genreStatsData]);

  // Initialize selected genres when data loads
  useEffect(() => {
    if (allGenres.length > 0 && selectedGenres.length === 0) {
      // Select top 3 genres by count initially
      setSelectedGenres(allGenres.slice(0, 3).map(g => g.genre));
    }
  }, [allGenres, selectedGenres.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addGenre = (genre: string) => {
    if (!selectedGenres.includes(genre)) {
      setSelectedGenres(prev => [...prev, genre]);
    }
    setIsDropdownOpen(false);
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(prev => prev.filter(g => g !== genre));
  };

  const availableGenres = allGenres.filter(g => !selectedGenres.includes(g.genre));
  const filteredGenres = allGenres.filter(g => selectedGenres.includes(g.genre));
  const chartData = mergeDataForChart(filteredGenres);

  // Loading state
  if (isLoading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          <span className="ml-3 text-dark-300">Loading genre data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-96 text-dark-400">
          <p>Failed to load genre data.</p>
          <p className="text-xs mt-2 text-red-400">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (allGenres.length === 0) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 mb-4">
            <Activity className="h-10 w-10 text-purple-400" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">No Genre Data Yet</h4>
          <p className="text-dark-400 max-w-md">
            Start tagging games to see lifecycle trends and strategic insights about genre performance.
          </p>
        </div>
      </div>
    );
  }

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

      {/* Genre Selector - Selected genres as removable chips + Add dropdown */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Selected genre chips */}
        {filteredGenres.map(genre => {
          const stageConfig = LIFECYCLE_CONFIG[genre.stage];
          return (
            <div
              key={genre.genre}
              className="flex items-center gap-2 px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: genre.color }}
              />
              <span className="text-sm font-medium text-white">{genre.genre}</span>
              <span className={`text-xs ${stageConfig.color}`}>
                {genre.trend > 0 ? '+' : ''}{genre.trend}%
              </span>
              <button
                onClick={() => removeGenre(genre.genre)}
                className="ml-1 p-0.5 hover:bg-dark-500 rounded transition-colors"
                title="Remove from chart"
              >
                <X className="h-3 w-3 text-dark-400 hover:text-white" />
              </button>
            </div>
          );
        })}

        {/* Add Genre Dropdown */}
        {availableGenres.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg hover:border-purple-500/50 transition-colors"
            >
              <Plus className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-dark-300">Add Genre</span>
              <ChevronDown className={`h-4 w-4 text-dark-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-dark-600">
                  <p className="text-xs text-dark-400 uppercase tracking-wide">Available Genres</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {availableGenres.map(genre => {
                    const stageConfig = LIFECYCLE_CONFIG[genre.stage];
                    return (
                      <button
                        key={genre.genre}
                        onClick={() => addGenre(genre.genre)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-dark-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: genre.color }}
                          />
                          <span className="text-sm font-medium text-white">{genre.genre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${stageConfig.color}`}>
                            {genre.trend > 0 ? '+' : ''}{genre.trend}%
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${stageConfig.bgColor} ${stageConfig.color}`}>
                            {stageConfig.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show count */}
        <span className="text-xs text-dark-400 ml-2">
          {selectedGenres.length} of {allGenres.length} genres selected
        </span>
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
              tickFormatter={(value) => formatCount(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(18, 18, 18, 0.95)',
                border: '1px solid #3d3d3d',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                padding: '12px 16px',
              }}
              labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '8px' }}
              itemStyle={{ color: '#a3a3a3', padding: '2px 0' }}
              formatter={(value: number, name: string) => [`${value.toLocaleString()} games`, name]}
              cursor={{ stroke: '#525252', strokeDasharray: '4 4' }}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {allGenres.slice(0, 8).map(genre => {
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
                    {genre.currentCount}
                  </p>
                  <p className="text-xs text-dark-400">games in catalog</p>
                </div>
                <div className={`flex items-center gap-1 ${genre.trend > 0 ? 'text-green-400' : genre.trend < 0 ? 'text-red-400' : 'text-dark-400'}`}>
                  {genre.trend > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : genre.trend < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {genre.trend > 0 ? '+' : ''}{genre.trend}%
                  </span>
                </div>
              </div>
              {/* Sample games */}
              {genre.games.length > 0 && (
                <div className="mt-2 pt-2 border-t border-dark-600/50">
                  <p className="text-xs text-dark-400 truncate" title={genre.games.join(', ')}>
                    {genre.games.slice(0, 2).join(', ')}{genre.games.length > 2 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more indicator */}
      {allGenres.length > 8 && (
        <p className="text-center text-sm text-dark-400 mt-4">
          Showing top 8 of {allGenres.length} genres. Use the dropdown above to explore more.
        </p>
      )}

      {/* Insight Box */}
      <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-sm text-purple-300">
          <span className="font-semibold">Insight:</span>{' '}
          {(() => {
            const growthGenres = allGenres.filter(g => g.stage === 'growth' || g.stage === 'emerging');
            const decliningGenres = allGenres.filter(g => g.stage === 'declining');
            const topGrowth = growthGenres.slice(0, 2);

            if (topGrowth.length === 0) {
              return `Your catalog has ${allGenres.length} genres. Most genres are mature or stable.`;
            }

            const growthText = topGrowth.map(g => `${g.genre} (+${g.trend}%)`).join(' and ');
            const decliningText = decliningGenres.length > 0
              ? ` while ${decliningGenres[0].genre} may be oversaturated.`
              : '.';

            return `${growthText} show${topGrowth.length === 1 ? 's' : ''} growth momentum. Consider prioritizing these ${topGrowth.length === 1 ? 'category' : 'categories'}${decliningText}`;
          })()}
        </p>
      </div>
    </div>
  );
}
