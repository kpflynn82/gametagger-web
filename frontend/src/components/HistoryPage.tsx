import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, Download, X, Filter, Gamepad2 } from 'lucide-react';
import { getHistory, deleteAnalysis, getAnalysis, type HistoryResponse, type AnalysisSummary } from '../services/api';

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

      // Find category
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
      // Remove prefix for display
      const displayName = TAG_CATEGORIES[foundCategory].prefix
        ? tag.replace(TAG_CATEGORIES[foundCategory].prefix, '').replace(/_/g, ' ')
        : tag.replace(/_/g, ' ');
      groupedTags[foundCategory].push(displayName);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div>
            <h2 className="text-xl font-bold text-white">
              {analysis?.detected_game || analysis?.game_name || 'Loading...'}
            </h2>
            {analysis?.primary_genre && (
              <p className="text-sm text-dark-200 mt-1">{analysis.primary_genre}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-300 hover:text-white transition-colors rounded-lg hover:bg-dark-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">Failed to load analysis</div>
          ) : (
            <div className="space-y-6">
              {/* Analysis notes */}
              {analysis?.analysis_notes && (
                <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
                  <p className="text-sm text-dark-100">{analysis.analysis_notes}</p>
                </div>
              )}

              {/* Tags by category */}
              {Object.entries(TAG_CATEGORIES).map(([category, config]) => {
                const tags = groupedTags[category];
                if (!tags || tags.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-dark-200 mb-3 uppercase tracking-wide">{config.label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={`${config.color} px-3 py-1.5 rounded-lg text-xs font-medium capitalize`}
                        >
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

        {/* Footer */}
        <div className="p-4 border-t border-dark-600 bg-dark-700/50">
          <div className="flex items-center justify-between text-sm text-dark-200">
            <span>
              Sources: {analysis?.sources_used?.join(', ') || '-'}
            </span>
            <span className={`confidence-${analysis?.confidence} px-2 py-1 rounded-lg text-xs font-medium`}>
              {analysis?.confidence || '-'} confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null;
  return (
    <span className={`confidence-${confidence} px-2 py-1 rounded-lg text-xs font-medium`}>
      {confidence}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const sourceClass = `source-${source}`;
  return (
    <span className={`${sourceClass} px-2 py-0.5 rounded-lg text-xs font-medium`}>
      {source}
    </span>
  );
}

function NitrogenBadges({ engagement, monetization, protagonist }: {
  engagement: number;
  monetization: number;
  protagonist: number;
}) {
  const badges = [];
  if (engagement > 0) {
    badges.push(
      <span key="eng" className="tag-engagement px-2 py-0.5 rounded-lg text-xs font-medium" title="Engagement tags">
        E:{engagement}
      </span>
    );
  }
  if (monetization > 0) {
    badges.push(
      <span key="mon" className="tag-monetization px-2 py-0.5 rounded-lg text-xs font-medium" title="Monetization tags">
        M:{monetization}
      </span>
    );
  }
  if (protagonist > 0) {
    badges.push(
      <span key="pro" className="tag-protagonist px-2 py-0.5 rounded-lg text-xs font-medium" title="Protagonist tags">
        P:{protagonist}
      </span>
    );
  }

  if (badges.length === 0) {
    return <span className="text-dark-400 text-xs">-</span>;
  }

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [confidence, setConfidence] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  };

  const { data, isLoading, error } = useQuery<HistoryResponse>({
    queryKey: ['history', page, debouncedSearch, confidence],
    queryFn: () => getHistory({
      page,
      limit: 15,
      search: debouncedSearch || undefined,
      confidence: confidence || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  const handleExport = () => {
    if (!data?.items) return;

    const csvContent = [
      ['Game', 'Detected', 'Genre', 'Confidence', 'Tags', 'Sources', 'Date'].join(','),
      ...data.items.map((item) =>
        [
          `"${item.game_name}"`,
          `"${item.detected_game || ''}"`,
          `"${item.primary_genre || ''}"`,
          item.confidence || '',
          item.tag_count,
          `"${item.sources_used.join(';')}"`,
          new Date(item.created_at).toISOString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gametagger-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Filters */}
      <div className="glass-card p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search games by name..."
                className="input-xbox pl-12"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-dark-300" />
              <select
                value={confidence}
                onChange={(e) => {
                  setConfidence(e.target.value);
                  setPage(1);
                }}
                className="select-xbox"
              >
                <option value="">All Confidence</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={!data?.items?.length}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Results count */}
        {data && (
          <div className="mt-4 pt-4 border-t border-dark-600">
            <p className="text-sm text-dark-300">
              Showing <span className="text-white font-medium">{data.items.length}</span> of{' '}
              <span className="text-white font-medium">{data.total}</span> games
              {debouncedSearch && (
                <span> matching "<span className="text-xbox-green">{debouncedSearch}</span>"</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-10 w-10"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-400 mb-2">Failed to load games</div>
            <p className="text-dark-400 text-sm">Please check if the backend is running.</p>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-12 text-center">
            <Gamepad2 className="h-16 w-16 text-dark-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No games found</h3>
            <p className="text-dark-300">
              {debouncedSearch
                ? `No games match your search for "${debouncedSearch}"`
                : 'Start by analyzing some games!'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Genre</th>
                    <th>Confidence</th>
                    <th>Sources</th>
                    <th>Tags</th>
                    <th>Nitrogen</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((item: AnalysisSummary) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedGameId(item.id)}
                    >
                      <td>
                        <div>
                          <p className="font-medium text-white hover:text-xbox-green transition-colors">
                            {item.detected_game || item.game_name}
                          </p>
                          {item.detected_game && item.detected_game !== item.game_name && (
                            <p className="text-xs text-dark-400 mt-0.5">searched: {item.game_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-dark-200">
                        {item.primary_genre || '-'}
                      </td>
                      <td>
                        <ConfidenceBadge confidence={item.confidence} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {item.sources_used.map((source) => (
                            <SourceBadge key={source} source={source} />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="bg-dark-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          {item.tag_count}
                        </span>
                      </td>
                      <td>
                        <NitrogenBadges
                          engagement={item.engagement_count}
                          monetization={item.monetization_count}
                          protagonist={item.protagonist_count}
                        />
                      </td>
                      <td className="text-dark-300 text-sm">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this analysis?')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="p-2 text-dark-400 hover:text-red-400 transition-colors rounded-lg hover:bg-dark-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-dark-700">
              {data?.items.map((item: AnalysisSummary) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedGameId(item.id)}
                  className="p-4 hover:bg-dark-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-white">
                        {item.detected_game || item.game_name}
                      </p>
                      <p className="text-sm text-dark-300">{item.primary_genre || '-'}</p>
                    </div>
                    <ConfidenceBadge confidence={item.confidence} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {item.sources_used.map((source) => (
                          <SourceBadge key={source} source={source} />
                        ))}
                      </div>
                      <span className="bg-dark-600 text-white px-2 py-0.5 rounded text-xs">
                        {item.tag_count} tags
                      </span>
                    </div>
                    <span className="text-xs text-dark-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-dark-700">
                <p className="text-sm text-dark-300">
                  Page <span className="text-white font-medium">{page}</span> of{' '}
                  <span className="text-white font-medium">{data.pages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                      let pageNum;
                      if (data.pages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= data.pages - 2) {
                        pageNum = data.pages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-xbox-green text-white'
                              : 'bg-dark-600 text-dark-200 hover:bg-dark-500'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
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
