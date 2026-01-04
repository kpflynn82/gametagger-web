// API client for GameTagger backend

// Use Railway backend in production, local proxy in development
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://gametagger-web-production.up.railway.app/api';

export interface TagRequest {
  game_name: string;
  sources?: string[];
}

export interface JobCreatedResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobProgress {
  steam?: string;
  xbox?: string;
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
  [key: string]: unknown;  // For boolean tags
}

export interface AnalysisSummary {
  id: number;
  game_name: string;
  detected_game?: string;
  confidence?: string;
  primary_genre?: string;
  sources_used: string[];
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

// API functions
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
