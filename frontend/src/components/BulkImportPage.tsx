import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Upload, FileText, Play, Download, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  startBatchClassify,
  getBatchStatus,
  downloadBatchResults,
  listBatchJobs,
} from '../services/api';

// Estimated cost per game with Claude Haiku
const COST_PER_GAME = 0.005;
const SECONDS_PER_GAME = 2;

export default function BulkImportPage() {
  const [gameNames, setGameNames] = useState('');
  const [parsedGames, setParsedGames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse game names from textarea
  useEffect(() => {
    const lines = gameNames
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    setParsedGames(lines);
  }, [gameNames]);

  // Fetch batch jobs list
  const { data: batchJobsData, refetch: refetchJobs } = useQuery({
    queryKey: ['batchJobs'],
    queryFn: listBatchJobs,
    refetchInterval: 10000, // Refresh every 10s
  });

  const batchJobs = batchJobsData?.jobs || [];

  // Start batch mutation
  const startBatchMutation = useMutation({
    mutationFn: startBatchClassify,
    onSuccess: () => {
      setGameNames('');
      setParsedGames([]);
      refetchJobs();
    },
  });

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Check if CSV (has commas) or plain text
      if (file.name.endsWith('.csv') || text.includes(',')) {
        // Parse CSV - assume first column is game name
        const lines = text.split('\n');
        const games: string[] = [];

        for (const line of lines) {
          const columns = line.split(',');
          const gameName = columns[0]?.replace(/^["']|["']$/g, '').trim();
          if (gameName && gameName.toLowerCase() !== 'game_name' && gameName.toLowerCase() !== 'game' && gameName.toLowerCase() !== 'name') {
            games.push(gameName);
          }
        }

        setGameNames(games.join('\n'));
      } else {
        // Plain text - one game per line
        setGameNames(text);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Calculate estimates
  const estimatedTime = Math.ceil(parsedGames.length * SECONDS_PER_GAME / 60);
  const estimatedCost = (parsedGames.length * COST_PER_GAME).toFixed(2);

  // Handle start classification
  const handleStart = () => {
    if (parsedGames.length === 0) return;
    startBatchMutation.mutate(parsedGames);
  };

  // Handle download
  const handleDownload = async (batchId: string) => {
    try {
      const blob = await downloadBatchResults(batchId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_${batchId.slice(0, 8)}_results.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Separate active and completed jobs
  const activeJobs = batchJobs.filter(j => j.status === 'pending' || j.status === 'processing');
  const completedJobs = batchJobs.filter(j => j.status === 'completed' || j.status === 'failed');

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bulk Genre Classifier</h1>
        <p className="text-dark-200 mt-1">
          Classify games by primary genre only (admin tool)
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">
              Paste game names (one per line)
            </label>
            <textarea
              value={gameNames}
              onChange={(e) => setGameNames(e.target.value)}
              placeholder="The Legend of Zelda: Breath of the Wild&#10;Elden Ring&#10;Hollow Knight&#10;Stardew Valley&#10;..."
              className="input-xbox h-48 font-mono text-sm"
            />
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-dark-600"></div>
            <span className="text-dark-300 text-sm">OR</span>
            <div className="flex-1 border-t border-dark-600"></div>
          </div>

          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-dark-500 rounded-xl cursor-pointer hover:border-xbox-green hover:bg-dark-700/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-dark-300" />
              <span className="text-dark-200">
                Drop a CSV or TXT file here, or click to browse
              </span>
            </label>
          </div>

          {/* Preview & Estimates */}
          {parsedGames.length > 0 && (
            <div className="bg-dark-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-dark-100">Games to classify:</span>
                <span className="text-xbox-green font-bold text-lg">{parsedGames.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-200">Estimated time:</span>
                <span className="text-dark-100">~{estimatedTime} minutes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-200">Estimated cost:</span>
                <span className="text-dark-100">~${estimatedCost}</span>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={parsedGames.length === 0 || startBatchMutation.isPending}
            className="btn-xbox w-full flex items-center justify-center gap-2"
          >
            {startBatchMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Start Classification
              </>
            )}
          </button>

          {startBatchMutation.error && (
            <div className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {startBatchMutation.error.message}
            </div>
          )}
        </div>
      </div>

      {/* Active Batches */}
      {activeJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-xbox-green" />
            Active Batches
          </h2>

          {activeJobs.map(job => (
            <BatchProgressCard key={job.batch_id} batchId={job.batch_id} onComplete={refetchJobs} />
          ))}
        </div>
      )}

      {/* Completed Batches */}
      {completedJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Completed Batches
          </h2>

          <div className="space-y-3">
            {completedJobs.map(job => (
              <div
                key={job.batch_id}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${job.status === 'completed' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {job.status === 'completed' ? (
                      <FileText className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {job.total_games} games
                    </p>
                    <p className="text-dark-300 text-sm">
                      {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Processing...'}
                    </p>
                  </div>
                </div>

                {job.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(job.batch_id)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {batchJobs.length === 0 && parsedGames.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FileText className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No batches yet</h3>
          <p className="text-dark-200">
            Paste game names above or upload a file to get started
          </p>
        </div>
      )}
    </div>
  );
}

// Progress card for active batches
function BatchProgressCard({ batchId, onComplete }: { batchId: string; onComplete: () => void }) {
  const { data: status } = useQuery({
    queryKey: ['batchStatus', batchId],
    queryFn: () => getBatchStatus(batchId),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: true,
  });

  // Call onComplete when status changes to completed
  useEffect(() => {
    if (status?.status === 'completed' || status?.status === 'failed') {
      onComplete();
    }
  }, [status?.status, onComplete]);

  if (!status) {
    return (
      <div className="glass-card p-4">
        <Loader2 className="h-5 w-5 animate-spin text-xbox-green" />
      </div>
    );
  }

  const progress = status.progress_percent;
  const remaining = Math.ceil((status.total_games - status.processed_games) * SECONDS_PER_GAME / 60);

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-xbox-green" />
          <span className="text-white font-medium">
            Processing {status.processed_games}/{status.total_games}
          </span>
        </div>
        <span className="text-xbox-green font-bold">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-xbox-green transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-dark-300">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Started {new Date(status.created_at).toLocaleTimeString()}
        </span>
        <span>~{remaining} min remaining</span>
      </div>
    </div>
  );
}
