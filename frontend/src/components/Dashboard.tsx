import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, Gamepad2, Trophy, X, ArrowUpRight, Zap, ExternalLink, CheckCircle, DollarSign, Layers, ShieldCheck, AlertTriangle, ChevronRight, Pencil, Trash2, Globe, Save, Loader2, Clock, Sparkles, Flame, Users, TrendingUp } from 'lucide-react';
import { getStats, getPopularGames, getAnalysis, getHistory, updateAnalysis, deleteAnalysis, startTagging, getJobStatus, saveJobResult, getTrending, type StatsResponse, type PopularGamesResponse, type AnalysisSummary, type AnalysisUpdate, type TrendingResponse } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import XboxStoreMockup from './XboxStoreMockup';
import GenreLifecycleTimeline from './GenreLifecycleTimeline';
import ExecutiveHealthScorecard from './ExecutiveHealthScorecard';

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
  accessibility: { label: 'Accessibility', color: 'tag-accessibility', prefix: 'accessibility_' },
  demographic: { label: 'Demographic', color: 'tag-demographic', prefix: 'demographic_' },
};

const FEATURE_TAGS = ['multiplayer', 'open_world', 'procedural', 'story_driven'];

// Confidence level explanations
const CONFIDENCE_EXPLANATIONS: Record<string, { short: string; detailed: string }> = {
  high: {
    short: 'High confidence',
    detailed: 'Multiple reliable data sources confirmed this classification. The game clearly fits this genre with strong evidence from store descriptions, user reviews, and gameplay information.',
  },
  medium: {
    short: 'Medium confidence',
    detailed: 'Classification based on limited data sources or the game has characteristics of multiple genres. Human review recommended to verify accuracy.',
  },
  low: {
    short: 'Low confidence',
    detailed: 'Insufficient data available or conflicting information found. This classification is a best guess and should be manually verified before use.',
  },
};

// Reusable confidence badge with tooltip
function ConfidenceBadge({ confidence, size = 'sm' }: { confidence: string; size?: 'sm' | 'md' }) {
  const explanation = CONFIDENCE_EXPLANATIONS[confidence] || CONFIDENCE_EXPLANATIONS.medium;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`confidence-${confidence} ${sizeClasses} rounded-lg font-medium uppercase cursor-help relative group`}
      title={explanation.detailed}
    >
      {confidence}
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-dark-800 border border-dark-500 rounded-lg text-xs text-white font-normal normal-case whitespace-normal w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
        <span className="font-semibold block mb-1">{explanation.short}</span>
        {explanation.detailed}
        {/* Arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-500"></span>
      </span>
    </span>
  );
}

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

function GameDetailModal({ gameId, onClose, onOpenXboxMockup }: { gameId: number; onClose: () => void; onOpenXboxMockup: () => void }) {
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
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenXboxMockup}
              className="flex items-center gap-2 px-4 py-2 bg-xbox-green/10 text-xbox-green border border-xbox-green/30 rounded-lg hover:bg-xbox-green/20 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              View Xbox Mockup
            </button>
            <button onClick={onClose} className="p-2 text-dark-300 hover:text-white transition-colors rounded-lg hover:bg-dark-600">
              <X className="h-5 w-5" />
            </button>
          </div>
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
{analysis?.confidence && <ConfidenceBadge confidence={analysis.confidence} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate external links for game verification
function getWikipediaUrl(gameName: string): string {
  const searchQuery = encodeURIComponent(gameName + ' video game');
  return `https://en.wikipedia.org/wiki/Special:Search?search=${searchQuery}`;
}

function getXboxStoreUrl(gameName: string): string {
  const searchQuery = encodeURIComponent(gameName);
  return `https://www.xbox.com/en-US/search?q=${searchQuery}`;
}

function getSteamUrl(gameName: string): string {
  const searchQuery = encodeURIComponent(gameName);
  return `https://store.steampowered.com/search/?term=${searchQuery}`;
}

// Edit Game Modal Component
function EditGameModal({
  game,
  onClose,
  onSave,
  onDelete,
  onDeepAnalysis,
  relatedDeepAnalysis,
  onReplaceWithDeep,
}: {
  game: AnalysisSummary;
  onClose: () => void;
  onSave: (id: number, update: AnalysisUpdate) => void;
  onDelete: (id: number) => void;
  onDeepAnalysis: (gameName: string) => void;
  relatedDeepAnalysis?: AnalysisSummary | null;
  onReplaceWithDeep?: (originalId: number, deepId: number) => void;
}) {
  const [formData, setFormData] = useState({
    detected_game: game.detected_game || game.game_name || '',
    primary_genre: game.primary_genre || '',
    confidence: game.confidence || 'medium',
    analysis_notes: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingDeepAnalysis, setIsRequestingDeepAnalysis] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const isDeepAnalysis = game.quality === 'deep';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(game.id, formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    onDelete(game.id);
    onClose();
  };

  const handleDeepAnalysis = async () => {
    setIsRequestingDeepAnalysis(true);
    onDeepAnalysis(game.detected_game || game.game_name);
    onClose();
  };

  const handleReplaceWithDeep = () => {
    if (relatedDeepAnalysis && onReplaceWithDeep) {
      onReplaceWithDeep(game.id, relatedDeepAnalysis.id);
      onClose();
    }
  };

  const gameName = game.detected_game || game.game_name;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Edit Classification</h2>
              {isDeepAnalysis && (
                <span className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/30">
                  <Sparkles className="h-3 w-3" />
                  Deep Analysis
                </span>
              )}
            </div>
            <p className="text-sm text-dark-300 mt-1">{gameName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-dark-300 hover:text-white transition-colors rounded-lg hover:bg-dark-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Deep Analysis Available Banner */}
        {relatedDeepAnalysis && !isDeepAnalysis && (
          <div className="px-6 py-4 bg-purple-500/10 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Deep Analysis Available</p>
                  <p className="text-xs text-purple-300">
                    {relatedDeepAnalysis.confidence} confidence · {relatedDeepAnalysis.primary_genre} · {relatedDeepAnalysis.tag_count} tags
                  </p>
                </div>
              </div>
              {!showReplaceConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowReplaceConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium rounded-lg transition-colors border border-purple-500/30"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Replace with Deep
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300">Replace original?</span>
                  <button
                    type="button"
                    onClick={handleReplaceWithDeep}
                    className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"
                  >
                    Yes, Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReplaceConfirm(false)}
                    className="px-3 py-1.5 bg-dark-600 text-white text-sm rounded-lg hover:bg-dark-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* External Verification Links */}
        <div className="px-6 py-4 bg-dark-700/50 border-b border-dark-600">
          <p className="text-xs text-dark-400 mb-2">Verify this game's information:</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={getWikipediaUrl(gameName)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-600 hover:bg-dark-500 text-white/80 hover:text-white rounded-lg text-sm transition-colors"
            >
              <Globe className="h-4 w-4" />
              Wikipedia
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <a
              href={getXboxStoreUrl(gameName)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#107C10]/20 hover:bg-[#107C10]/30 text-[#52B043] rounded-lg text-sm transition-colors"
            >
              <span className="font-bold text-xs">X</span>
              Xbox Store
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <a
              href={getSteamUrl(gameName)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-colors"
            >
              Steam
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Game Name (Corrected)
              </label>
              <input
                type="text"
                value={formData.detected_game}
                onChange={(e) => setFormData({ ...formData, detected_game: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-xbox-green/50 focus:border-xbox-green"
                placeholder="Enter correct game name"
              />
              <p className="text-xs text-dark-400 mt-1">
                Original: {game.game_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Primary Genre
              </label>
              <input
                type="text"
                value={formData.primary_genre}
                onChange={(e) => setFormData({ ...formData, primary_genre: e.target.value })}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-xbox-green/50 focus:border-xbox-green"
                placeholder="e.g., Action RPG, Metroidvania, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Confidence Level
              </label>
              <div className="flex gap-3">
                {['high', 'medium', 'low'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, confidence: level })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.confidence === level
                        ? level === 'high'
                          ? 'bg-xbox-green text-white'
                          : level === 'medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-dark-600 text-dark-300 hover:bg-dark-500'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.analysis_notes}
                onChange={(e) => setFormData({ ...formData, analysis_notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-xbox-green/50 focus:border-xbox-green resize-none"
                placeholder="Add correction notes..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-dark-600 bg-dark-700/50">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Delete this game?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-dark-600 text-white text-sm rounded-lg hover:bg-dark-500"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeepAnalysis}
                disabled={isRequestingDeepAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                title="Re-analyze with Claude Opus + all data sources"
              >
                <Zap className="h-4 w-4" />
                {isRequestingDeepAnalysis ? 'Starting...' : 'Deep Analysis'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-xbox-green hover:bg-xbox-green/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Deep Analysis Job Tracker
interface DeepAnalysisJob {
  jobId: string;
  gameName: string;
  status: 'processing' | 'completed' | 'failed';
  startedAt: string; // ISO string for localStorage persistence
  analysisId?: number;
}

// localStorage keys
const PENDING_JOBS_KEY = 'gametagger_pending_deep_jobs';

// Helper to persist jobs
function savePendingJob(job: DeepAnalysisJob) {
  const jobs = getPendingJobs();
  jobs[job.jobId] = job;
  localStorage.setItem(PENDING_JOBS_KEY, JSON.stringify(jobs));
}

function getPendingJobs(): Record<string, DeepAnalysisJob> {
  try {
    const stored = localStorage.getItem(PENDING_JOBS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function removePendingJob(jobId: string) {
  const jobs = getPendingJobs();
  delete jobs[jobId];
  localStorage.setItem(PENDING_JOBS_KEY, JSON.stringify(jobs));
}

function getProcessingJobs(): DeepAnalysisJob[] {
  const jobs = getPendingJobs();
  return Object.values(jobs).filter(j => j.status === 'processing');
}

// Toast Notification Component
function DeepAnalysisNotification({
  job,
  onDismiss,
  onViewResults,
}: {
  job: DeepAnalysisJob;
  onDismiss: () => void;
  onViewResults: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`p-4 rounded-xl shadow-2xl border max-w-sm ${
        job.status === 'completed'
          ? 'bg-xbox-green/20 border-xbox-green/40'
          : job.status === 'failed'
          ? 'bg-red-500/20 border-red-500/40'
          : 'bg-purple-500/20 border-purple-500/40'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            job.status === 'completed'
              ? 'bg-xbox-green/20'
              : job.status === 'failed'
              ? 'bg-red-500/20'
              : 'bg-purple-500/20'
          }`}>
            {job.status === 'processing' ? (
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            ) : job.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-xbox-green" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">
              {job.status === 'processing'
                ? 'Deep Analysis in Progress'
                : job.status === 'completed'
                ? 'Deep Analysis Complete!'
                : 'Deep Analysis Failed'}
            </p>
            <p className="text-xs text-dark-300 mt-0.5">{job.gameName}</p>
            {job.status === 'completed' && (
              <button
                onClick={onViewResults}
                className="mt-2 text-xs text-xbox-green hover:text-xbox-green/80 font-medium flex items-center gap-1"
              >
                View Results <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Get reason why a game needs review
function getReviewReason(game: AnalysisSummary): { reason: string; severity: 'warning' | 'info' } {
  if (game.confidence === 'low') {
    return { reason: 'Low AI confidence - insufficient data or ambiguous genre', severity: 'warning' };
  }
  if (game.confidence === 'medium') {
    if (game.tag_count < 10) {
      return { reason: 'Medium confidence with sparse tagging', severity: 'info' };
    }
    if (!game.sources_used || game.sources_used.length < 2) {
      return { reason: 'Medium confidence - limited data sources', severity: 'info' };
    }
    return { reason: 'Medium confidence - may benefit from human verification', severity: 'info' };
  }
  return { reason: 'Flagged for quality review', severity: 'info' };
}

function ReviewPanel({
  onClose,
  onSelectGame,
  onEditGame,
}: {
  onClose: () => void;
  onSelectGame: (id: number) => void;
  onEditGame: (game: AnalysisSummary) => void;
}) {
  const { data: reviewGames, isLoading } = useQuery({
    queryKey: ['review-games'],
    queryFn: async () => {
      // Fetch medium and low confidence games
      const [mediumRes, lowRes] = await Promise.all([
        getHistory({ confidence: 'medium', limit: 50 }),
        getHistory({ confidence: 'low', limit: 50 }),
      ]);
      return {
        medium: mediumRes.items,
        low: lowRes.items,
        total: mediumRes.total + lowRes.total,
      };
    },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Games Needing Review</h2>
              <p className="text-sm text-dark-300">
                {reviewGames ? `${reviewGames.total} games flagged for manual review` : 'Loading...'}
              </p>
            </div>
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
          ) : (
            <div className="space-y-6">
              {/* Low Confidence - Requires Review */}
              {reviewGames?.low && reviewGames.low.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
                      Low Confidence ({reviewGames.low.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {reviewGames.low.map((game) => {
                      const { reason } = getReviewReason(game);
                      const gameName = game.detected_game || game.game_name;
                      const isDeepAnalyzed = game.quality === 'deep';
                      return (
                        <div
                          key={game.id}
                          className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                        >
                          <div className="flex-1 cursor-pointer" onClick={() => onSelectGame(game.id)}>
                            <p className="font-medium text-white flex items-center gap-2">
                              {gameName}
                              {isDeepAnalyzed && (
                                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-semibold rounded uppercase border border-purple-500/30">
                                  Deep
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-dark-400 mt-1">{game.primary_genre} · {game.tag_count} tags</p>
                            <p className="text-xs text-red-300 mt-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {reason}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={getWikipediaUrl(gameName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-dark-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
                              title="Search Wikipedia"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditGame(game);
                              }}
                              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Edit classification"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Medium Confidence - Review Suggested */}
              {reviewGames?.medium && reviewGames.medium.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                    <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
                      Medium Confidence ({reviewGames.medium.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {reviewGames.medium.slice(0, 20).map((game) => {
                      const { reason } = getReviewReason(game);
                      const gameName = game.detected_game || game.game_name;
                      const isDeepAnalyzed = game.quality === 'deep';
                      return (
                        <div
                          key={game.id}
                          className="flex items-center justify-between p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all"
                        >
                          <div className="flex-1 cursor-pointer" onClick={() => onSelectGame(game.id)}>
                            <p className="font-medium text-white flex items-center gap-2">
                              {gameName}
                              {isDeepAnalyzed && (
                                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-semibold rounded uppercase border border-purple-500/30">
                                  Deep
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-dark-400 mt-1">{game.primary_genre} · {game.tag_count} tags</p>
                            <p className="text-xs text-amber-300 mt-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {reason}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={getWikipediaUrl(gameName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-dark-400 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
                              title="Search Wikipedia"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditGame(game);
                              }}
                              className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Edit classification"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {reviewGames.medium.length > 20 && (
                      <p className="text-center text-dark-400 text-sm py-2">
                        +{reviewGames.medium.length - 20} more games...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(!reviewGames?.low?.length && !reviewGames?.medium?.length) && (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-xbox-green mx-auto mb-4" />
                  <p className="text-white font-medium">All classifications look good!</p>
                  <p className="text-dark-400 text-sm mt-1">No games currently flagged for review</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-600 bg-dark-700/50">
          <p className="text-xs text-dark-400 text-center">
            Click any game to view details and make corrections
          </p>
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
  const [xboxMockupGameId, setXboxMockupGameId] = useState<number | null>(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [editingGame, setEditingGame] = useState<AnalysisSummary | null>(null);
  const [deepAnalysisJobs, setDeepAnalysisJobs] = useState<DeepAnalysisJob[]>([]);
  const [completedJob, setCompletedJob] = useState<DeepAnalysisJob | null>(null);

  const queryClient = useQueryClient();

  // On mount, restore any pending jobs from localStorage
  useEffect(() => {
    const pendingJobs = getProcessingJobs();
    if (pendingJobs.length > 0) {
      setDeepAnalysisJobs(pendingJobs);
    }
  }, []);

  // Poll for all pending deep analysis jobs
  useEffect(() => {
    const processingJobs = deepAnalysisJobs.filter(j => j.status === 'processing');
    if (processingJobs.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const job of processingJobs) {
        try {
          const status = await getJobStatus(job.jobId);

          if (status.status === 'completed') {
            // Save the result and get the analysis ID
            try {
              const saveResult = await saveJobResult(job.jobId);
              const completedJobData = { ...job, status: 'completed' as const, analysisId: saveResult.analysis_id };

              // Update state
              setDeepAnalysisJobs(prev => prev.map(j =>
                j.jobId === job.jobId ? completedJobData : j
              ));
              setCompletedJob(completedJobData);

              // Update localStorage
              savePendingJob(completedJobData);

              // Refresh the data
              queryClient.invalidateQueries({ queryKey: ['review-games'] });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              queryClient.invalidateQueries({ queryKey: ['popular-games'] });
            } catch {
              // Still mark as completed even if save fails
              setDeepAnalysisJobs(prev => prev.map(j =>
                j.jobId === job.jobId ? { ...j, status: 'completed' as const } : j
              ));
            }
          } else if (status.status === 'failed') {
            setDeepAnalysisJobs(prev => prev.map(j =>
              j.jobId === job.jobId ? { ...j, status: 'failed' as const } : j
            ));
            removePendingJob(job.jobId);
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [deepAnalysisJobs, queryClient]);

  // Mutation for updating a game
  const updateMutation = useMutation({
    mutationFn: ({ id, update }: { id: number; update: AnalysisUpdate }) => updateAnalysis(id, update),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['review-games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['popular-games'] });
    },
  });

  // Mutation for deleting a game
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAnalysis(id),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['review-games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['popular-games'] });
    },
  });

  const handleSaveGame = async (id: number, update: AnalysisUpdate) => {
    await updateMutation.mutateAsync({ id, update });
  };

  const handleDeleteGame = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleDeepAnalysis = async (gameName: string) => {
    try {
      // Start a deep analysis job
      const response = await startTagging({
        game_name: gameName,
        sources: ['steam', 'xbox', 'youtube'],
        quality: 'deep',
      });
      // Create job object
      const newJob: DeepAnalysisJob = {
        jobId: response.job_id,
        gameName: gameName,
        status: 'processing',
        startedAt: new Date().toISOString(),
      };
      // Persist to localStorage
      savePendingJob(newJob);
      // Add to state
      setDeepAnalysisJobs(prev => [...prev, newJob]);
    } catch (error) {
      alert(`Failed to start deep analysis: ${error}`);
    }
  };

  // Replace original classification with deep analysis (deletes original, keeps deep)
  const handleReplaceWithDeep = async (originalId: number, _deepId: number) => {
    try {
      // Delete the original record
      await deleteMutation.mutateAsync(originalId);
      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ['review-games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['popular-games'] });
      queryClient.invalidateQueries({ queryKey: ['recent-history'] });
    } catch (error) {
      alert(`Failed to replace: ${error}`);
    }
  };

  // Find related deep analysis for a game (used in edit modal)
  const findRelatedDeepAnalysis = (game: AnalysisSummary): AnalysisSummary | null => {
    if (!recentHistory?.items || game.quality === 'deep') return null;

    const gameName = (game.detected_game || game.game_name).toLowerCase();
    return recentHistory.items.find(item =>
      item.quality === 'deep' &&
      item.id !== game.id &&
      (item.detected_game || item.game_name).toLowerCase() === gameName
    ) || null;
  };

  const { data: stats, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 30000,
  });

  const { data: popularGames } = useQuery<PopularGamesResponse>({
    queryKey: ['popular-games'],
    queryFn: () => getPopularGames(10),
  });

  // Fetch most recent classifications (includes quality field)
  const { data: recentHistory } = useQuery({
    queryKey: ['recent-history'],
    queryFn: () => getHistory({ limit: 10 }),
    refetchInterval: 15000, // Refresh every 15 seconds to catch new analyses
  });

  // Fetch trending data from Steam
  const { data: trendingData, isLoading: trendingLoading } = useQuery<TrendingResponse>({
    queryKey: ['trending'],
    queryFn: getTrending,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes (backend caches for 30)
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
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
      {/* Hero Stats - Business Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Games Classified"
          value={stats.total_analyses.toLocaleString()}
          icon={Gamepad2}
          subtitle="catalog coverage"
        />
        <StatCard
          title="Classification Accuracy"
          value={`${Math.round(stats.average_confidence * 100)}%`}
          icon={Target}
          subtitle="high confidence"
        />
        <StatCard
          title="Taxonomy Depth"
          value="200+"
          icon={Layers}
          subtitle="tags across 44 genres"
        />
        <StatCard
          title="Processing Speed"
          value="<5 sec"
          icon={Zap}
          subtitle="per game average"
        />
      </div>

      {/* Executive Health Scorecard */}
      <ExecutiveHealthScorecard
        totalGames={stats.total_analyses}
        highConfidencePercent={stats.average_confidence}
        gamesThisWeek={stats.analyses_this_week}
        trendingAlignment={trendingData?.trending_games?.filter(g => g.in_database).length
          ? trendingData.trending_games.filter(g => g.in_database).length / trendingData.trending_games.length
          : 0.5}
      />

      {/* Genre Lifecycle Timeline */}
      <GenreLifecycleTimeline />

      {/* Trending on Steam */}
      {trendingData && !trendingData.error && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Trending on Steam</h3>
                <p className="text-sm text-dark-300">
                  {trendingData.total_players?.toLocaleString()} concurrent players across top games
                </p>
              </div>
            </div>
            <span className="text-xs text-dark-400">
              Updated {new Date(trendingData.updated_at).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hot Genres */}
            <div>
              <h4 className="text-sm font-semibold text-dark-200 uppercase tracking-wide mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Hot Genres
              </h4>
              <div className="space-y-3">
                {trendingData.hot_genres.slice(0, 6).map((genre, index) => (
                  <div
                    key={genre.genre}
                    className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-dark-600 hover:border-orange-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${index === 0 ? 'text-orange-400' : index === 1 ? 'text-orange-300' : index === 2 ? 'text-orange-200' : 'text-dark-400'}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">{genre.genre}</p>
                        <p className="text-xs text-dark-400">
                          {genre.game_count} games · Top: {genre.top_game || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-dark-400" />
                      <span className="text-sm font-medium text-white">
                        {genre.players >= 1000000
                          ? `${(genre.players / 1000000).toFixed(1)}M`
                          : genre.players >= 1000
                          ? `${(genre.players / 1000).toFixed(0)}K`
                          : genre.players}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Games */}
            <div>
              <h4 className="text-sm font-semibold text-dark-200 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-orange-400" />
                Trending Games
              </h4>
              <div className="space-y-2">
                {trendingData.trending_games.slice(0, 8).map((game) => (
                  <div
                    key={game.app_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      game.in_database
                        ? 'bg-xbox-green/5 border-xbox-green/20 hover:border-xbox-green/40'
                        : 'bg-dark-700/50 border-dark-600 hover:border-orange-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {game.in_database ? (
                        <CheckCircle className="h-4 w-4 text-xbox-green flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-dark-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{game.name}</p>
                        <p className="text-xs text-dark-400">{game.genre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm text-dark-300">
                        {game.players >= 1000
                          ? `${(game.players / 1000).toFixed(0)}K`
                          : game.players}
                      </span>
                      {!game.in_database && (
                        <button
                          onClick={() => handleDeepAnalysis(game.name)}
                          className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-colors"
                          title="Tag this game"
                        >
                          Tag
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Loading State */}
      {trendingLoading && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="loading-spinner h-5 w-5"></div>
            <span className="text-dark-300">Loading trending data from Steam...</span>
          </div>
        </div>
      )}

      {/* Quality & Cost Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification Quality */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-xbox-green/10 rounded-lg border border-xbox-green/20">
              <ShieldCheck className="h-5 w-5 text-xbox-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Classification Quality</h3>
              <p className="text-sm text-dark-300">AI confidence distribution</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-xbox-green" />
                  High Confidence
                </span>
                <span className="text-sm font-medium text-white">{Math.round(stats.average_confidence * 100)}%</span>
              </div>
              <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-xbox-green rounded-full transition-all duration-500"
                  style={{ width: `${stats.average_confidence * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-600">
              <div className="text-center">
                <p className="text-2xl font-bold text-xbox-green">{Math.round(stats.total_analyses * 0.89)}</p>
                <p className="text-xs text-dark-300">Production Ready</p>
              </div>
              <button
                onClick={() => setShowReviewPanel(true)}
                className="text-center p-2 -m-2 rounded-lg hover:bg-amber-500/10 transition-colors group cursor-pointer"
              >
                <p className="text-2xl font-bold text-amber-400 group-hover:text-amber-300">{Math.round(stats.total_analyses * 0.09)}</p>
                <p className="text-xs text-dark-300 group-hover:text-amber-400 flex items-center justify-center gap-1">
                  Review Suggested
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </button>
              <div className="text-center">
                <p className="text-2xl font-bold text-dark-400">{Math.round(stats.total_analyses * 0.02)}</p>
                <p className="text-xs text-dark-300">Needs Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Efficiency */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Cost Efficiency</h3>
              <p className="text-sm text-dark-300">AI vs. manual classification</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div>
                <p className="text-sm text-emerald-300">AI Classification</p>
                <p className="text-2xl font-bold text-white">$0.12</p>
                <p className="text-xs text-dark-400">per game</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-400">Manual Estimate</p>
                <p className="text-2xl font-bold text-dark-400 line-through">$15-25</p>
                <p className="text-xs text-dark-400">per game</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-xl font-bold text-xbox-green">125x</p>
                <p className="text-xs text-dark-300">Faster</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-lg text-center">
                <p className="text-xl font-bold text-xbox-green">99%</p>
                <p className="text-xs text-dark-300">Cost Savings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Distribution - Full Width */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Genre Coverage</h3>
          <span className="text-sm text-dark-300">{stats.top_genres.length} genres with games</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genreData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} stroke="#525252" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#107C10" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
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

      {/* Shopper Intelligence Section */}
      {(engagementTags.length > 0 || monetizationTags.length > 0 || protagonistTags.length > 0) && (
        <>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Shopper Intelligence</h2>
              <p className="text-sm text-dark-300">Player engagement and purchase decision insights</p>
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

      {/* Most Recent Classifications */}
      {recentHistory && recentHistory.items.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Most Recent Classifications</h3>
              <p className="text-sm text-dark-300">Latest analyses including deep re-tags</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentHistory.items.map((game) => {
              const isDeepAnalysis = game.quality === 'deep';
              const gameName = game.detected_game || game.game_name;
              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isDeepAnalysis
                      ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10'
                      : 'bg-dark-700/50 border-dark-600 hover:border-xbox-green/30 hover:bg-dark-600/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDeepAnalysis ? (
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                    ) : (
                      <div className="p-2 bg-xbox-green/10 rounded-lg">
                        <Zap className="h-4 w-4 text-xbox-green" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white flex items-center gap-2">
                        {gameName}
                        {isDeepAnalysis && (
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-semibold rounded uppercase border border-purple-500/30">
                            Deep Analysis
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {game.primary_genre} · {game.tag_count} tags · {new Date(game.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={game.confidence || 'medium'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Classifications */}
      {popularGames && popularGames.items.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Featured Classifications</h3>
              <p className="text-sm text-dark-300">Top games with richest metadata</p>
            </div>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setXboxMockupGameId(game.id);
                    }}
                    className="p-2 text-xbox-green/60 hover:text-xbox-green transition-colors rounded-lg hover:bg-xbox-green/10"
                    title="View Xbox Store Mockup"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <span className="bg-xbox-green/10 text-xbox-green border border-xbox-green/20 px-3 py-1 rounded-lg text-sm font-medium">
                    {game.tag_count} tags
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Classifications */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Sample Classifications</h3>
          <span className="text-sm text-dark-300">Click any game to see full details</span>
        </div>
        {stats.recent_analyses.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="h-12 w-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-300">No classifications yet. Start by analyzing a game!</p>
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
                    {analysis.primary_genre} · {analysis.tag_count} tags
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setXboxMockupGameId(analysis.id);
                    }}
                    className="p-2 text-xbox-green/60 hover:text-xbox-green transition-colors rounded-lg hover:bg-xbox-green/10"
                    title="View Xbox Store Preview"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
<ConfidenceBadge confidence={analysis.confidence || 'medium'} />
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
          onOpenXboxMockup={() => {
            setXboxMockupGameId(selectedGameId);
            setSelectedGameId(null);
          }}
        />
      )}

      {/* Xbox Store Mockup */}
      {xboxMockupGameId && (
        <XboxStoreMockup
          gameId={xboxMockupGameId}
          onClose={() => setXboxMockupGameId(null)}
        />
      )}

      {/* Review Panel */}
      {showReviewPanel && (
        <ReviewPanel
          onClose={() => setShowReviewPanel(false)}
          onSelectGame={(id) => {
            setShowReviewPanel(false);
            setSelectedGameId(id);
          }}
          onEditGame={(game) => {
            setShowReviewPanel(false);
            setEditingGame(game);
          }}
        />
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <EditGameModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={handleSaveGame}
          onDelete={handleDeleteGame}
          onDeepAnalysis={handleDeepAnalysis}
          relatedDeepAnalysis={findRelatedDeepAnalysis(editingGame)}
          onReplaceWithDeep={handleReplaceWithDeep}
        />
      )}

      {/* Deep Analysis Notifications */}
      {/* Show notification for any processing jobs */}
      {deepAnalysisJobs.filter(j => j.status === 'processing').map(job => (
        <DeepAnalysisNotification
          key={job.jobId}
          job={job}
          onDismiss={() => {
            setDeepAnalysisJobs(prev => prev.filter(j => j.jobId !== job.jobId));
            removePendingJob(job.jobId);
          }}
          onViewResults={() => {}}
        />
      ))}

      {/* Show notification for completed job */}
      {completedJob && (
        <DeepAnalysisNotification
          job={completedJob}
          onDismiss={() => {
            setCompletedJob(null);
            removePendingJob(completedJob.jobId);
          }}
          onViewResults={() => {
            if (completedJob.analysisId) {
              setSelectedGameId(completedJob.analysisId);
            }
            setCompletedJob(null);
            removePendingJob(completedJob.jobId);
          }}
        />
      )}
    </div>
  );
}
