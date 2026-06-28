import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, CheckCircle, XCircle, Clock, Save, Gamepad2, Info, AlertTriangle, ChevronDown } from 'lucide-react';
import { startTagging, saveJobResult, suggestGames, type JobCreatedResponse, type GameAnalysis, type GameCandidate, type SuggestResponse } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const TAG_CATEGORIES: Record<string, { label: string; color: string }> = {
  gameplay: { label: 'Gameplay', color: 'tag-gameplay' },
  narrative: { label: 'Narrative', color: 'tag-narrative' },
  theme: { label: 'Theme', color: 'tag-theme' },
  setting: { label: 'Setting', color: 'tag-setting' },
  mechanic: { label: 'Mechanics', color: 'tag-mechanic' },
  visual: { label: 'Visual', color: 'tag-visual' },
  engagement: { label: 'Engagement', color: 'tag-engagement' },
  monetization: { label: 'Monetization', color: 'tag-monetization' },
  protagonist: { label: 'Protagonist', color: 'tag-protagonist' },
};

const SOURCE_CONFIG = [
  {
    id: 'wikipedia',
    label: 'Wikipedia',
    description: 'Human-curated genre data',
    time: '1-2s',
    icon: '📚',
    color: 'source-wikipedia',
  },
  {
    id: 'xbox',
    label: 'Xbox Store',
    description: 'Microsoft Store listing',
    time: '1-3s',
    icon: '🟢',
    color: 'source-xbox',
  },
  {
    id: 'steam',
    label: 'Steam Store',
    description: 'PC store page (fallback)',
    time: '1-3s',
    icon: '🎮',
    color: 'source-steam',
  },
  {
    id: 'youtube',
    label: 'Gameplay Trailer',
    description: 'Official trailer frame analysis',
    time: '10-30s',
    icon: '🎬',
    color: 'source-youtube',
  },
];

function ProgressStep({ label, status }: { label: string; status: string }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-xbox-green" />;
      case 'searching':
      case 'fetching':
      case 'downloading':
      case 'extracting':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-xbox-green animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-dark-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'searching':
        return 'Searching...';
      case 'fetching':
        return 'Fetching data...';
      case 'downloading':
        return 'Downloading video...';
      case 'extracting':
        return 'Extracting frames...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const isActive = ['searching', 'fetching', 'downloading', 'extracting', 'processing'].includes(status);
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
      isComplete ? 'bg-xbox-green/5 border-xbox-green/30' :
      isFailed ? 'bg-red-500/5 border-red-500/30' :
      isActive ? 'bg-dark-700 border-xbox-green/20' :
      'bg-dark-700/50 border-dark-600'
    }`}>
      <div className={`flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`}>
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${isComplete ? 'text-xbox-green' : isFailed ? 'text-red-400' : 'text-white'}`}>
          {label}
        </p>
        <p className="text-sm text-dark-300">{getStatusText()}</p>
      </div>
    </div>
  );
}

function TagBadge({ tag, category }: { tag: string; category: string }) {
  const categoryConfig = TAG_CATEGORIES[category] || TAG_CATEGORIES.features;
  const displayName = tag.replace(`${category}_`, '').replace(/_/g, ' ');

  return (
    <span className={`${categoryConfig.color} px-3 py-1.5 rounded-lg text-xs font-medium capitalize`}>
      {displayName}
    </span>
  );
}

function CandidatePicker({
  candidates,
  query,
  onSelect,
  onCancel
}: {
  candidates: GameCandidate[];
  query: string;
  onSelect: (title: string) => void;
  onCancel: () => void;
}) {
  // Group candidates by source for display
  const sourceIcons: Record<string, string> = {
    steam: '🎮',
    xbox: '🟢',
    wikipedia: '📚'
  };

  return (
    <div className="glass-card p-8 animate-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Multiple Games Found</h2>
          <p className="text-dark-300">
            Your search for "<span className="text-white">{query}</span>" matched multiple games. Select the one you want to analyze:
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {candidates.map((candidate, index) => (
          <button
            key={`${candidate.source}-${candidate.title}-${index}`}
            onClick={() => onSelect(candidate.title)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-dark-600 bg-dark-700/50 hover:bg-dark-700 hover:border-xbox-green/50 transition-all duration-200 text-left"
          >
            <span className="text-2xl">{sourceIcons[candidate.source] || '🎮'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{candidate.title}</p>
              {candidate.description && (
                <p className="text-sm text-dark-300 truncate">{candidate.description}</p>
              )}
            </div>
            {candidate.year && (
              <span className="text-sm text-dark-400 flex-shrink-0">{candidate.year}</span>
            )}
            <span className={`text-xs px-2 py-1 rounded source-${candidate.source}`}>
              {candidate.source}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Back to Search
        </button>
      </div>
    </div>
  );
}

function ResultView({
  result,
  originalQuery,
  onSave,
  isSaving,
  alternatives,
  onSelectAlternative,
  isReanalyzing
}: {
  result: GameAnalysis;
  originalQuery: string;
  onSave: () => void;
  isSaving: boolean;
  alternatives?: GameCandidate[];
  onSelectAlternative?: (title: string) => void;
  isReanalyzing?: boolean;
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Group tags by category
  const groupedTags: Record<string, string[]> = {};

  // Check if detected game differs from original query
  const detectedGame = result.detected_game || result.game_name;
  const showDetectedBanner = detectedGame.toLowerCase() !== originalQuery.toLowerCase();

  // Helper to clean titles for comparison (remove Wikipedia suffixes)
  const cleanTitleForComparison = (title: string) =>
    title.replace(/\s*\(\d{4}\s+video\s+game\)/i, '')
         .replace(/\s*\(video\s+game\)/i, '')
         .trim()
         .toLowerCase();

  // Filter alternatives to exclude the current detected game
  const availableAlternatives = alternatives?.filter(
    alt => cleanTitleForComparison(alt.title) !== cleanTitleForComparison(detectedGame)
  ) || [];

  // Check if result is valid enough to save
  const isSaveable = () => {
    // Don't allow saving low confidence results
    if (result.confidence === 'low') return false;

    // Don't allow saving unknown/invalid games
    const gameName = (result.detected_game || result.game_name || '').toLowerCase();
    if (gameName.includes('unknown') || gameName.includes('invalid') || gameName === 'unclassifiable') {
      return false;
    }

    // Don't allow saving if primary genre indicates invalid
    const genre = (result.primary_genre || '').toLowerCase();
    if (genre === 'unclassifiable' || genre === 'unknown') {
      return false;
    }

    return true;
  };

  Object.entries(result).forEach(([key, value]) => {
    if (typeof value !== 'boolean' || !value) return;

    for (const category of Object.keys(TAG_CATEGORIES)) {
      if (key.startsWith(`${category}_`) || (category === 'features' && ['multiplayer', 'open_world', 'procedural', 'story_driven'].includes(key))) {
        if (!groupedTags[category]) groupedTags[category] = [];
        groupedTags[category].push(key);
        break;
      }
    }
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Detected Game Banner */}
      {showDetectedBanner && (
        <div className={`glass-card p-4 border-l-4 border-amber-500 bg-amber-500/5 ${showAlternatives ? 'relative z-50' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">
                  Analyzed as: <span className="text-amber-400">{detectedGame}</span>
                </p>
                <p className="text-sm text-dark-300">
                  Your search "{originalQuery}" was matched to this game
                </p>
              </div>
            </div>
            {availableAlternatives.length > 0 && onSelectAlternative && (
              <div className="relative">
                <button
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  disabled={isReanalyzing}
                  className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
                >
                  {isReanalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Reanalyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Not this game?</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {showAlternatives && !isReanalyzing && (
                  <div className="absolute right-0 mt-2 w-80 bg-dark-900 border border-dark-500 rounded-xl shadow-2xl z-50">
                    <div className="p-3 border-b border-dark-600 bg-dark-800 rounded-t-xl">
                      <p className="text-sm text-dark-200 font-medium">Select the correct game:</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {availableAlternatives.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-dark-400">
                          No alternative games found
                        </div>
                      ) : (
                        availableAlternatives.map((alt, index) => (
                          <button
                            key={`${alt.source}-${alt.title}-${index}`}
                            onClick={() => {
                              setShowAlternatives(false);
                              onSelectAlternative(alt.title);
                            }}
                            className="w-full text-left px-4 py-3 bg-dark-900 hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-0"
                          >
                            <p className="text-white font-medium text-sm">{alt.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`source-${alt.source} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                                {alt.source}
                              </span>
                              {alt.year && (
                                <span className="text-xs text-dark-400">{alt.year}</span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {result.detected_game || result.game_name}
            </h2>
            <p className="text-lg text-dark-200 mt-1">{result.primary_genre}</p>
            {Array.isArray(result.secondary_genres) && result.secondary_genres.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-dark-400 uppercase tracking-wide">Also</span>
                {result.secondary_genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 rounded-lg text-sm font-medium bg-dark-600/60 text-dark-100 border border-dark-500"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className={`confidence-${result.confidence} px-3 py-1.5 rounded-lg text-sm font-medium`}>
                {result.confidence} confidence
              </span>
              {result.sources_used?.map((source) => {
                const sourceUrl = result.source_urls?.[source];
                if (sourceUrl) {
                  return (
                    <a
                      key={source}
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`source-${source} px-2 py-1 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1`}
                      title={`View on ${source}`}
                    >
                      {source}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                }
                return (
                  <span key={source} className={`source-${source} px-2 py-1 rounded-lg text-xs font-medium`}>
                    {source}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={isSaving || !isSaveable()}
            className={`btn-xbox flex items-center gap-2 whitespace-nowrap ${!isSaveable() ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!isSaveable() ? 'Cannot save: low confidence or invalid game' : 'Save to database'}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save to Database</span>
          </button>
        </div>
        {result.analysis_notes && (
          <div className="mt-6 p-4 bg-dark-700 rounded-xl border border-dark-600">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-dark-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-dark-100">{result.analysis_notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* VGMS Tags */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">VGMS Classification Tags</h3>
        <div className="space-y-5">
          {Object.entries(TAG_CATEGORIES)
            .map(([category, config]) => {
              const tags = groupedTags[category] || [];
              if (tags.length === 0) return null;

              return (
                <div key={category}>
                  <p className="text-sm font-medium text-dark-200 mb-3 uppercase tracking-wide">{config.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} category={category} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const [gameName, setGameName] = useState('');
  const [sources, setSources] = useState(['wikipedia', 'xbox', 'steam']);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<GameAnalysis | null>(null);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Disambiguation state
  const [candidates, setCandidates] = useState<GameCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // Original query before disambiguation
  const [showPicker, setShowPicker] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const { lastMessage, isConnected } = useWebSocket(jobId);

  // Search for candidates before starting analysis
  const searchMutation = useMutation({
    mutationFn: suggestGames,
    onSuccess: (data: SuggestResponse) => {
      // Always store candidates for later use (alternative game selection)
      setCandidates(data.candidates);

      if (data.is_direct_match || data.candidates.length === 0) {
        // Direct match or no results - proceed directly to analysis
        // Use original query for search (works better with sources than Wikipedia titles with suffixes)
        const titleToAnalyze = data.query;
        setGameName(titleToAnalyze);
        startMutation.mutate({ game_name: titleToAnalyze, sources });
      } else if (data.candidates.length === 1) {
        // Single result - use cleaned title (remove Wikipedia suffixes)
        const cleanTitle = data.candidates[0].title
          .replace(/\s*\(\d{4}\s+video\s+game\)/i, '')
          .replace(/\s*\(video\s+game\)/i, '')
          .trim();
        setGameName(cleanTitle);
        startMutation.mutate({ game_name: cleanTitle, sources });
      } else {
        // Multiple candidates - show picker
        setShowPicker(true);
      }
    },
  });

  const startMutation = useMutation({
    mutationFn: startTagging,
    onSuccess: (data: JobCreatedResponse) => {
      setJobId(data.job_id);
      setResult(null);
      setProgress({});
      setSaved(false);
      setShowPicker(false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => saveJobResult(jobId!),
    onSuccess: () => {
      setSaved(true);
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'progress') {
      const source = lastMessage.source as string;
      const status = lastMessage.status as string;
      setProgress((prev) => ({ ...prev, [source]: status }));
    } else if (lastMessage.type === 'completed') {
      setResult(lastMessage.result as GameAnalysis);
      setIsReanalyzing(false);
    } else if (lastMessage.type === 'state') {
      setProgress(lastMessage.progress as Record<string, string>);
      if (lastMessage.status === 'completed' && lastMessage.result) {
        setResult(lastMessage.result as GameAnalysis);
        setIsReanalyzing(false);
      }
    }
  }, [lastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || sources.length === 0) return;
    // Store original query for later display
    setSearchQuery(gameName.trim());
    // Search for candidates first
    searchMutation.mutate(gameName.trim());
  };

  const handleCandidateSelect = (title: string) => {
    // Clean Wikipedia suffixes from selected title
    const cleanTitle = title
      .replace(/\s*\(\d{4}\s+video\s+game\)/i, '')
      .replace(/\s*\(video\s+game\)/i, '')
      .trim();
    setGameName(cleanTitle);
    startMutation.mutate({ game_name: cleanTitle, sources });
  };

  const handleCancelPicker = () => {
    setShowPicker(false);
    setCandidates([]);
    setGameName(searchQuery); // Restore original query
  };

  const handleReanalyzeWithAlternative = (title: string) => {
    // Clean Wikipedia suffixes from selected title
    const cleanTitle = title
      .replace(/\s*\(\d{4}\s+video\s+game\)/i, '')
      .replace(/\s*\(video\s+game\)/i, '')
      .trim();
    setIsReanalyzing(true);
    setGameName(cleanTitle);
    setResult(null);
    setProgress({});
    setSaved(false);
    startMutation.mutate({ game_name: cleanTitle, sources });
  };

  const toggleSource = (source: string) => {
    setSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleReset = () => {
    setGameName('');
    setJobId(null);
    setResult(null);
    setProgress({});
    setSaved(false);
    // Clear disambiguation state
    setCandidates([]);
    setSearchQuery('');
    setShowPicker(false);
    setIsReanalyzing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      {/* Candidate Picker */}
      {showPicker && candidates.length > 0 && (
        <CandidatePicker
          candidates={candidates}
          query={searchQuery}
          onSelect={handleCandidateSelect}
          onCancel={handleCancelPicker}
        />
      )}

      {/* Form */}
      {!jobId && !showPicker && (
        <div className="glass-card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-xbox-green/10 rounded-xl border border-xbox-green/20">
              <Gamepad2 className="h-6 w-6 text-xbox-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Game</h2>
              <p className="text-dark-300">Enter a game name to analyze and classify</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Game Name Input */}
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-dark-100 mb-3">
                Game Name
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                <input
                  id="gameName"
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name (e.g., Halo Infinite, Forza Horizon 5)"
                  className="input-xbox pl-12 text-lg"
                />
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-3">
                Data Sources
              </label>
              <div className="grid gap-3">
                {SOURCE_CONFIG.map((source) => {
                  const isSelected = sources.includes(source.id);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleSource(source.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                        isSelected
                          ? 'bg-xbox-green/10 border-xbox-green/50'
                          : 'bg-dark-700/50 border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isSelected ? 'bg-xbox-green/20' : 'bg-dark-600'
                      }`}>
                        {source.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-dark-100'}`}>
                          {source.label}
                        </p>
                        <p className="text-sm text-dark-300">{source.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          isSelected ? 'bg-xbox-green/20 text-xbox-green' : 'bg-dark-600 text-dark-300'
                        }`}>
                          ~{source.time}
                        </span>
                        <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-xbox-green bg-xbox-green'
                            : 'border-dark-400'
                        }`}>
                          {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-dark-400 mt-3">
                Trailer analysis provides the most detailed visual signal but takes a little longer to process.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!gameName.trim() || sources.length === 0 || searchMutation.isPending || startMutation.isPending}
              className="btn-xbox w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              {searchMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : startMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting Analysis...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Search & Analyze</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Progress */}
      {jobId && !result && (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white">
                Analyzing: {gameName}
              </h2>
              <p className="text-dark-300 mt-1">Please wait while we gather and process game data</p>
            </div>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              isConnected ? 'bg-xbox-green/20 text-xbox-green border border-xbox-green/30' : 'bg-dark-600 text-dark-300'
            }`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          <div className="space-y-3">
            {sources.includes('steam') && (
              <ProgressStep label="Steam Store" status={progress.steam || 'pending'} />
            )}
            {sources.includes('xbox') && (
              <ProgressStep label="Xbox Store" status={progress.xbox || 'pending'} />
            )}
            {sources.includes('wikipedia') && (
              <ProgressStep label="Wikipedia" status={progress.wikipedia || 'pending'} />
            )}
            {sources.includes('youtube') && (
              <ProgressStep label="Gameplay Trailer" status={progress.youtube || 'pending'} />
            )}
            <ProgressStep label="AI Classification" status={progress.analysis || 'pending'} />
          </div>

          <div className="mt-8 p-4 bg-dark-700/50 rounded-xl border border-dark-600 text-center">
            <p className="text-sm text-dark-300">
              This may take up to 2 minutes if trailer analysis is enabled.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <ResultView
            result={result}
            originalQuery={searchQuery || gameName}
            onSave={() => saveMutation.mutate()}
            isSaving={saveMutation.isPending}
            alternatives={candidates}
            onSelectAlternative={handleReanalyzeWithAlternative}
            isReanalyzing={isReanalyzing}
          />

          {saved && (
            <div className="glass-card p-4 border-l-4 border-xbox-green">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-xbox-green" />
                <p className="text-white font-medium">Game saved to database successfully!</p>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="btn-secondary w-full py-4 text-lg"
          >
            Analyze Another Game
          </button>
        </>
      )}
    </div>
  );
}
