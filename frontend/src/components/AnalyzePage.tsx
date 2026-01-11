import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, CheckCircle, XCircle, Clock, Save, Gamepad2, Info, Zap } from 'lucide-react';
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
  engagement: { label: 'Engagement', color: 'tag-engagement' },
  monetization: { label: 'Monetization', color: 'tag-monetization' },
  protagonist: { label: 'Protagonist', color: 'tag-protagonist' },
};

const SOURCE_CONFIG = [
  {
    id: 'steam',
    label: 'Steam Store',
    description: 'Official store page data',
    time: '1-3s',
    icon: '🎮',
    color: 'source-steam',
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
    id: 'wikipedia',
    label: 'Wikipedia',
    description: 'Encyclopedia genre data',
    time: '1-2s',
    icon: '📚',
    color: 'source-wikipedia',
  },
  {
    id: 'youtube',
    label: 'YouTube Video',
    description: 'Gameplay video analysis',
    time: '30-90s',
    icon: '📺',
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

function ResultView({ result, onSave, isSaving }: { result: GameAnalysis; onSave: () => void; isSaving: boolean }) {
  // Group tags by category
  const groupedTags: Record<string, string[]> = {};
  const nitrogenTags: Record<string, string[]> = { engagement: [], monetization: [], protagonist: [] };

  Object.entries(result).forEach(([key, value]) => {
    if (typeof value !== 'boolean' || !value) return;

    // Check for nitrogen tags first
    if (key.startsWith('engagement_')) {
      nitrogenTags.engagement.push(key);
      return;
    }
    if (key.startsWith('monetization_')) {
      nitrogenTags.monetization.push(key);
      return;
    }
    if (key.startsWith('protagonist_')) {
      nitrogenTags.protagonist.push(key);
      return;
    }

    for (const category of Object.keys(TAG_CATEGORIES)) {
      if (key.startsWith(`${category}_`) || (category === 'features' && ['multiplayer', 'open_world', 'procedural', 'story_driven'].includes(key))) {
        if (!groupedTags[category]) groupedTags[category] = [];
        groupedTags[category].push(key);
        break;
      }
    }
  });

  const hasNitrogenTags = nitrogenTags.engagement.length > 0 || nitrogenTags.monetization.length > 0 || nitrogenTags.protagonist.length > 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Header Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {result.detected_game || result.game_name}
            </h2>
            <p className="text-lg text-dark-200 mt-1">{result.primary_genre}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className={`confidence-${result.confidence} px-3 py-1.5 rounded-lg text-sm font-medium`}>
                {result.confidence} confidence
              </span>
              {result.sources_used?.map((source) => (
                <span key={source} className={`source-${source} px-2 py-1 rounded-lg text-xs font-medium`}>
                  {source}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-xbox flex items-center gap-2 whitespace-nowrap"
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
            .filter(([category]) => !['engagement', 'monetization', 'protagonist'].includes(category))
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

      {/* Nitrogen Tags */}
      {hasNitrogenTags && (
        <div className="glass-card p-6 border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Nitrogen Tags</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nitrogenTags.engagement.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-300 mb-3 uppercase tracking-wide">Engagement</p>
                <div className="flex flex-wrap gap-2">
                  {nitrogenTags.engagement.map((tag) => (
                    <TagBadge key={tag} tag={tag} category="engagement" />
                  ))}
                </div>
              </div>
            )}
            {nitrogenTags.monetization.length > 0 && (
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-3 uppercase tracking-wide">Monetization</p>
                <div className="flex flex-wrap gap-2">
                  {nitrogenTags.monetization.map((tag) => (
                    <TagBadge key={tag} tag={tag} category="monetization" />
                  ))}
                </div>
              </div>
            )}
            {nitrogenTags.protagonist.length > 0 && (
              <div>
                <p className="text-sm font-medium text-pink-300 mb-3 uppercase tracking-wide">Protagonist</p>
                <div className="flex flex-wrap gap-2">
                  {nitrogenTags.protagonist.map((tag) => (
                    <TagBadge key={tag} tag={tag} category="protagonist" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  const [gameName, setGameName] = useState('');
  const [sources, setSources] = useState(['steam', 'xbox', 'wikipedia', 'youtube']);
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      {/* Form */}
      {!jobId && (
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
                YouTube provides the most detailed visual analysis but takes longer to process.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!gameName.trim() || sources.length === 0 || startMutation.isPending}
              className="btn-xbox w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Starting Analysis...</span>
                </>
              ) : (
                <>
                  <Gamepad2 className="h-5 w-5" />
                  <span>Analyze Game</span>
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
              <ProgressStep label="YouTube Video" status={progress.youtube || 'pending'} />
            )}
            <ProgressStep label="AI Classification" status={progress.analysis || 'pending'} />
          </div>

          <div className="mt-8 p-4 bg-dark-700/50 rounded-xl border border-dark-600 text-center">
            <p className="text-sm text-dark-300">
              This may take up to 2 minutes if YouTube analysis is enabled.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <ResultView
            result={result}
            onSave={() => saveMutation.mutate()}
            isSaving={saveMutation.isPending}
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
