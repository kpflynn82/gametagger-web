import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { getHistory, deleteAnalysis, getAnalysis, type HistoryResponse, type AnalysisSummary } from '../services/api';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {analysis?.detected_game || analysis?.game_name || 'Loading...'}
            </h2>
            {analysis?.primary_genre && (
              <p className="text-sm text-gray-500">{analysis.primary_genre}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">Failed to load analysis</div>
          ) : (
            <div className="space-y-4">
              {/* Analysis notes */}
              {analysis?.analysis_notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">{analysis.analysis_notes}</p>
                </div>
              )}

              {/* Tags by category */}
              {Object.entries(TAG_CATEGORIES).map(([category, config]) => {
                const tags = groupedTags[category];
                if (!tags || tags.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{config.label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={`${config.color} px-2 py-1 rounded-full text-xs font-medium capitalize`}
                        >
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

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Sources: {analysis?.sources_used?.join(', ') || '-'}
            </span>
            <span>
              Confidence: {analysis?.confidence || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null;

  const colorClass = {
    high: 'confidence-high',
    medium: 'confidence-medium',
    low: 'confidence-low',
  }[confidence] || 'bg-gray-100 text-gray-600';

  return (
    <span className={`${colorClass} px-2 py-1 rounded-full text-xs font-medium`}>
      {confidence}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    steam: 'bg-blue-100 text-blue-700',
    xbox: 'bg-green-100 text-green-700',
    youtube: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`${colors[source] || 'bg-gray-100 text-gray-600'} px-2 py-0.5 rounded text-xs`}>
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
      <span key="eng" className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs" title="Engagement tags">
        E:{engagement}
      </span>
    );
  }
  if (monetization > 0) {
    badges.push(
      <span key="mon" className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs" title="Monetization tags">
        M:{monetization}
      </span>
    );
  }
  if (protagonist > 0) {
    badges.push(
      <span key="pro" className="bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded text-xs" title="Protagonist tags">
        P:{protagonist}
      </span>
    );
  }

  if (badges.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
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
    a.download = `gametagger-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search games..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <select
            value={confidence}
            onChange={(e) => {
              setConfidence(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={handleExport}
            disabled={!data?.items?.length}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            Failed to load history. Is the backend running?
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No analyses found. Start by analyzing some games!
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Genre
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sources
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nitrogen
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.items.map((item: AnalysisSummary) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedGameId(item.id)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 hover:text-primary-600">
                          {item.detected_game || item.game_name}
                        </p>
                        {item.detected_game && item.detected_game !== item.game_name && (
                          <p className="text-sm text-gray-500">searched: {item.game_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.primary_genre || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <ConfidenceBadge confidence={item.confidence} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.sources_used.map((source) => (
                          <SourceBadge key={source} source={source} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.tag_count} tags
                    </td>
                    <td className="px-6 py-4">
                      <NitrogenBadges
                        engagement={item.engagement_count}
                        monetization={item.monetization_count}
                        protagonist={item.protagonist_count}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this analysis?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, data.total)} of {data.total} results
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {data.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
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
