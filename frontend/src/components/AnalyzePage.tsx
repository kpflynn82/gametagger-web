import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import { startTagging, saveJobResult, type JobCreatedResponse, type GameAnalysis } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const TAG_CATEGORIES: Record<string, { label: string; color: string }> = {
  gameplay: { label: 'Gameplay', color: 'tag-gameplay' },
  narrative: { label: 'Narrative', color: 'tag-narrative' },
  theme: { label: 'Theme', color: 'tag-theme' },
  setting: { label: 'Setting', color: 'tag-setting' },
  mechanic: { label: 'Mechanics', color: 'tag-mechanic' },
  visual: { label: 'Visual', color: 'tag-visual' },
  features: { label: 'Features', color: 'tag-features' },
};

function ProgressStep({ label, status }: { label: string; status: string }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'searching':
      case 'fetching':
      case 'downloading':
      case 'extracting':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'searching':
        return 'Searching...';
      case 'fetching':
        return 'Fetching...';
      case 'downloading':
        return 'Downloading...';
      case 'extracting':
        return 'Extracting frames...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Done';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      {getStatusIcon()}
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{getStatusText()}</p>
      </div>
    </div>
  );
}

function TagBadge({ tag, category }: { tag: string; category: string }) {
  const categoryConfig = TAG_CATEGORIES[category] || TAG_CATEGORIES.features;
  const displayName = tag.replace(`${category}_`, '').replace(/_/g, ' ');

  return (
    <span className={`${categoryConfig.color} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
      {displayName}
    </span>
  );
}

function ResultView({ result, onSave }: { result: GameAnalysis; onSave: () => void }) {
  // Group tags by category
  const groupedTags: Record<string, string[]> = {};

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {result.detected_game || result.game_name}
            </h2>
            <p className="text-lg text-gray-600 mt-1">{result.primary_genre}</p>
            <div className="flex items-center space-x-2 mt-3">
              <span className={`confidence-${result.confidence} px-3 py-1 rounded-full text-sm font-medium`}>
                {result.confidence} confidence
              </span>
              {result.sources_used?.map((source) => (
                <span key={source} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                  {source}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save to History</span>
          </button>
        </div>
        {result.analysis_notes && (
          <p className="mt-4 text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
            {result.analysis_notes}
          </p>
        )}
      </div>

      {/* Tags by Category */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">VGMS Tags</h3>
        <div className="space-y-4">
          {Object.entries(TAG_CATEGORIES).map(([category, config]) => {
            const tags = groupedTags[category] || [];
            if (tags.length === 0) return null;

            return (
              <div key={category}>
                <p className="text-sm font-medium text-gray-500 mb-2">{config.label}</p>
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
  const [sources, setSources] = useState(['steam', 'xbox', 'youtube']);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<GameAnalysis | null>(null);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { lastMessage, isConnected } = useWebSocket(jobId);

  const startMutation = useMutation({
    mutationFn: startTagging,
    onSuccess: (data: JobCreatedResponse) => {
      setJobId(data.job_id);
      setResult(null);
      setProgress({});
      setSaved(false);
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
    } else if (lastMessage.type === 'state') {
      setProgress(lastMessage.progress as Record<string, string>);
      if (lastMessage.status === 'completed' && lastMessage.result) {
        setResult(lastMessage.result as GameAnalysis);
      }
    }
  }, [lastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || sources.length === 0) return;
    startMutation.mutate({ game_name: gameName, sources });
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
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Form */}
      {!jobId && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analyze a Game</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 mb-2">
                Game Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="gameName"
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name (e.g., Elden Ring)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Sources
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'steam', label: 'Steam Store', time: '1-3s' },
                  { id: 'xbox', label: 'Xbox Store', time: '1-3s' },
                  { id: 'youtube', label: 'YouTube Video', time: '30-90s' },
                ].map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      sources.includes(source.id)
                        ? 'bg-primary-100 border-primary-500 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{source.label}</span>
                    <span className="text-xs ml-2 opacity-70">~{source.time}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                YouTube provides the most detailed visual analysis but takes longer.
              </p>
            </div>

            <button
              type="submit"
              disabled={!gameName.trim() || sources.length === 0 || startMutation.isPending}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Analyze Game</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Progress */}
      {jobId && !result && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Analyzing: {gameName}
            </h2>
            <span className={`px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
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
            {sources.includes('youtube') && (
              <ProgressStep label="YouTube Video" status={progress.youtube || 'pending'} />
            )}
            <ProgressStep label="Claude Analysis" status={progress.analysis || 'pending'} />
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            This may take up to 2 minutes if YouTube is enabled...
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <ResultView result={result} onSave={() => saveMutation.mutate()} />
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-center">
              Result saved to history!
            </div>
          )}
          <button
            onClick={handleReset}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Analyze Another Game
          </button>
        </>
      )}
    </div>
  );
}
