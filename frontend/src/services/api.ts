// API client for GameTagger backend

// Use Railway backend in production, local proxy in development
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isLocalhost
  ? '/api'
  : 'https://gametagger-web-production.up.railway.app/api';

export interface TagRequest {
  game_name: string;
  sources?: string[];
  quality?: 'standard' | 'deep';
}

export interface JobCreatedResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobProgress {
  steam?: string;
  xbox?: string;
  wikipedia?: string;
  youtube?: string;
  analysis?: string;
}

export interface JobStatus {
  job_id: string;
  game_name: string;
  status: string;
  progress: JobProgress;
  error_message?: string;
  result?: GameAnalysis;
  created_at: string;
  estimated_remaining_seconds?: number;
}

export interface GameAnalysis {
  game_name: string;
  detected_game?: string;
  confidence?: string;
  primary_genre?: string;
  analysis_notes?: string;
  sources_used?: string[];
  source_urls?: Record<string, string>;  // URLs for each source (steam, xbox, wikipedia, youtube)
  tags?: Record<string, boolean>;  // Structured tags object
  [key: string]: unknown;  // For backward compatibility with flat boolean tags
}

export interface AnalysisSummary {
  id: number;
  game_name: string;
  detected_game?: string;
  confidence?: string;
  primary_genre?: string;
  sources_used: string[];
  quality?: 'standard' | 'deep';
  created_at: string;
  tag_count: number;
  // Nitrogen tag counts
  engagement_count: number;
  monetization_count: number;
  protagonist_count: number;
}

export interface HistoryResponse {
  items: AnalysisSummary[];
  total: number;
  page: number;
  pages: number;
}

export interface TagDistribution {
  tag_name: string;
  count: number;
  percentage: number;
}

export interface StatsResponse {
  total_analyses: number;
  analyses_this_week: number;
  average_confidence: number;
  source_success_rates: Record<string, number>;
  tag_distribution: Record<string, TagDistribution[]>;
  top_genres: Array<{ name: string; count: number; percentage: number }>;
  recent_analyses: AnalysisSummary[];
}

// Game suggestion types
export interface GameCandidate {
  source: string;  // "steam", "xbox", "wikipedia"
  source_id?: string;
  title: string;
  description?: string;
  year?: number;
}

export interface SuggestResponse {
  query: string;
  candidates: GameCandidate[];
  is_direct_match: boolean;
  suggested_title?: string;
}

// API functions
export async function suggestGames(query: string): Promise<SuggestResponse> {
  const response = await fetch(`${API_BASE}/suggest?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Failed to suggest games: ${response.statusText}`);
  }
  return response.json();
}

export async function startTagging(request: TagRequest): Promise<JobCreatedResponse> {
  const response = await fetch(`${API_BASE}/tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to start tagging: ${response.statusText}`);
  }
  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.statusText}`);
  }
  return response.json();
}

export async function saveJobResult(jobId: string): Promise<{ status: string; analysis_id: number }> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/save`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to save result: ${response.statusText}`);
  }
  return response.json();
}

export async function getHistory(params: {
  page?: number;
  limit?: number;
  search?: string;
  confidence?: string;
  tags?: string;
}): Promise<HistoryResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.confidence) searchParams.set('confidence', params.confidence);
  if (params.tags) searchParams.set('tags', params.tags);

  const response = await fetch(`${API_BASE}/history?${searchParams}`);
  if (!response.ok) {
    throw new Error(`Failed to get history: ${response.statusText}`);
  }
  return response.json();
}

export async function getAnalysis(id: number): Promise<GameAnalysis> {
  const response = await fetch(`${API_BASE}/analysis/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to get analysis: ${response.statusText}`);
  }
  return response.json();
}

export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    throw new Error(`Failed to get stats: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteAnalysis(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/analysis/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete analysis: ${response.statusText}`);
  }
}

export interface AnalysisUpdate {
  detected_game?: string;
  primary_genre?: string;
  confidence?: string;
  analysis_notes?: string;
}

export async function updateAnalysis(id: number, update: AnalysisUpdate): Promise<GameAnalysis> {
  const response = await fetch(`${API_BASE}/analysis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!response.ok) {
    throw new Error(`Failed to update analysis: ${response.statusText}`);
  }
  return response.json();
}

export interface PopularGamesResponse {
  items: AnalysisSummary[];
}

export async function getPopularGames(limit: number = 10): Promise<PopularGamesResponse> {
  const response = await fetch(`${API_BASE}/popular-games?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to get popular games: ${response.statusText}`);
  }
  return response.json();
}

// Trending data types
export interface HotGenre {
  genre: string;
  players: number;
  game_count: number;
  top_game: string | null;
}

export interface TrendingGame {
  name: string;
  app_id: string;
  players: number;
  genre: string;
  in_database: boolean;
}

export interface TrendingResponse {
  hot_genres: HotGenre[];
  trending_games: TrendingGame[];
  updated_at: string;
  total_players?: number;
  games_fetched?: number;
  error?: string;
}

export async function getTrending(): Promise<TrendingResponse> {
  const response = await fetch(`${API_BASE}/trending`);
  if (!response.ok) {
    throw new Error(`Failed to get trending data: ${response.statusText}`);
  }
  return response.json();
}

// Genre stats types
export interface GenreHistoryPoint {
  month: string;
  popularity: number;
}

export interface GenreStat {
  genre: string;
  count: number;
  popularity: number;
  games: string[];
  high_confidence: number;
  color: string;
  stage: 'emerging' | 'growth' | 'mature' | 'declining';
  trend: number;
  history: GenreHistoryPoint[];
}

export interface GenreStatsResponse {
  genres: GenreStat[];
  total_genres: number;
  total_games: number;
}

export async function getGenreStats(): Promise<GenreStatsResponse> {
  const response = await fetch(`${API_BASE}/genre-stats`);
  if (!response.ok) {
    throw new Error(`Failed to get genre stats: ${response.statusText}`);
  }
  return response.json();
}

// Batch classification types
export interface BatchJobResponse {
  batch_id: string;
  status: string;
  total_games: number;
  message: string;
}

export interface BatchStatusResponse {
  batch_id: string;
  status: string;
  total_games: number;
  processed_games: number;
  progress_percent: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface BatchResultItem {
  game_name: string;
  detected_game?: string;
  primary_genre?: string;
  confidence?: string;
  error?: string;
}

export interface BatchResultsResponse {
  batch_id: string;
  status: string;
  total_games: number;
  results: BatchResultItem[];
}

export interface BatchJobSummary {
  batch_id: string;
  status: string;
  total_games: number;
  processed_games: number;
  created_at: string;
  completed_at?: string;
}

// Batch classification API functions
export async function startBatchClassify(games: string[]): Promise<BatchJobResponse> {
  const response = await fetch(`${API_BASE}/batch/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ games }),
  });
  if (!response.ok) {
    throw new Error(`Failed to start batch: ${response.statusText}`);
  }
  return response.json();
}

export async function getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
  const response = await fetch(`${API_BASE}/batch/${batchId}`);
  if (!response.ok) {
    throw new Error(`Failed to get batch status: ${response.statusText}`);
  }
  return response.json();
}

export async function getBatchResults(batchId: string): Promise<BatchResultsResponse> {
  const response = await fetch(`${API_BASE}/batch/${batchId}/results`);
  if (!response.ok) {
    throw new Error(`Failed to get batch results: ${response.statusText}`);
  }
  return response.json();
}

export async function downloadBatchResults(batchId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/batch/${batchId}/download`);
  if (!response.ok) {
    throw new Error(`Failed to download results: ${response.statusText}`);
  }
  return response.blob();
}

export async function listBatchJobs(): Promise<{ jobs: BatchJobSummary[] }> {
  const response = await fetch(`${API_BASE}/batch/`);
  if (!response.ok) {
    throw new Error(`Failed to list batch jobs: ${response.statusText}`);
  }
  return response.json();
}
