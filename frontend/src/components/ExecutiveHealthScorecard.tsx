import { Activity, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreCardData {
  label: string;
  score: number;
  maxScore: number;
  trend: number;
  trendLabel: string;
  status: 'good' | 'warning' | 'critical';
  insight: string;
}

interface ExecutiveHealthScorecardProps {
  totalGames: number;
  highConfidencePercent: number;
  gamesThisWeek: number;
  trendingAlignment: number;
  className?: string;
}

function getStatus(score: number): 'good' | 'warning' | 'critical' {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'critical';
}

const STATUS_CONFIG = {
  good: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    icon: CheckCircle,
  },
  warning: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle,
  },
  critical: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: XCircle,
  },
};

function ScoreCard({ data }: { data: ScoreCardData }) {
  const config = STATUS_CONFIG[data.status];
  const StatusIcon = config.icon;
  const percentage = Math.round((data.score / data.maxScore) * 100);

  return (
    <div className={`p-5 rounded-xl border ${config.bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-dark-200">{data.label}</span>
        <StatusIcon className={`h-5 w-5 ${config.color}`} />
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-white">{percentage}</span>
        <span className="text-lg text-dark-400 pb-1">/100</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-dark-600 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            data.status === 'good'
              ? 'bg-green-500'
              : data.status === 'warning'
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 mb-2">
        {data.trend > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-400" />
        ) : data.trend < 0 ? (
          <TrendingDown className="h-4 w-4 text-red-400" />
        ) : (
          <Minus className="h-4 w-4 text-dark-400" />
        )}
        <span className={`text-sm ${data.trend > 0 ? 'text-green-400' : data.trend < 0 ? 'text-red-400' : 'text-dark-400'}`}>
          {data.trend > 0 ? '+' : ''}{data.trend}% {data.trendLabel}
        </span>
      </div>

      {/* Insight */}
      <p className="text-xs text-dark-300 line-clamp-2">{data.insight}</p>
    </div>
  );
}

export default function ExecutiveHealthScorecard({
  totalGames,
  highConfidencePercent,
  gamesThisWeek,
  trendingAlignment,
  className = '',
}: ExecutiveHealthScorecardProps) {
  // Calculate scores (0-100 scale)
  const coverageScore = Math.min(100, Math.round((totalGames / 500) * 100)); // Target: 500 games
  const qualityScore = Math.round(highConfidencePercent * 100);
  const freshnessScore = Math.min(100, Math.round((gamesThisWeek / 20) * 100)); // Target: 20 games/week
  const alignmentScore = Math.round(trendingAlignment * 100);

  const scores: ScoreCardData[] = [
    {
      label: 'Catalog Coverage',
      score: coverageScore,
      maxScore: 100,
      trend: 12,
      trendLabel: 'vs last quarter',
      status: getStatus(coverageScore),
      insight: `${totalGames} games classified. ${coverageScore >= 70 ? 'Strong coverage across genres.' : 'Expand catalog to improve coverage.'}`,
    },
    {
      label: 'Classification Quality',
      score: qualityScore,
      maxScore: 100,
      trend: 5,
      trendLabel: 'vs last month',
      status: getStatus(qualityScore),
      insight: `${qualityScore}% high-confidence classifications. ${qualityScore >= 70 ? 'Reliable for production use.' : 'Consider deep analysis for uncertain games.'}`,
    },
    {
      label: 'Catalog Freshness',
      score: freshnessScore,
      maxScore: 100,
      trend: gamesThisWeek > 10 ? 15 : -5,
      trendLabel: 'weekly velocity',
      status: getStatus(freshnessScore),
      insight: `${gamesThisWeek} games added this week. ${freshnessScore >= 70 ? 'Active catalog updates.' : 'Increase tagging velocity.'}`,
    },
    {
      label: 'Trending Alignment',
      score: alignmentScore,
      maxScore: 100,
      trend: 8,
      trendLabel: 'market match',
      status: getStatus(alignmentScore),
      insight: `${alignmentScore}% of trending games in catalog. ${alignmentScore >= 70 ? 'Well-positioned for market demand.' : 'Tag more trending titles.'}`,
    },
  ];

  // Calculate overall score
  const overallScore = Math.round(
    (coverageScore + qualityScore + freshnessScore + alignmentScore) / 4
  );
  const overallStatus = getStatus(overallScore);
  const overallConfig = STATUS_CONFIG[overallStatus];

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-xbox-green/10 rounded-lg border border-xbox-green/20">
            <Activity className="h-5 w-5 text-xbox-green" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Executive Health Scorecard</h3>
            <p className="text-sm text-dark-300">Catalog health at a glance</p>
          </div>
        </div>

        {/* Overall Score */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${overallConfig.bgColor}`}>
          <div className="text-right">
            <p className="text-xs text-dark-400">Overall Score</p>
            <p className={`text-2xl font-bold ${overallConfig.color}`}>{overallScore}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallConfig.bgColor}`}>
            <overallConfig.icon className={`h-6 w-6 ${overallConfig.color}`} />
          </div>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scores.map((score) => (
          <ScoreCard key={score.label} data={score} />
        ))}
      </div>

      {/* Summary Insight */}
      <div className={`mt-6 p-4 rounded-xl border ${overallConfig.bgColor}`}>
        <p className="text-sm">
          <span className={`font-semibold ${overallConfig.color}`}>Summary: </span>
          <span className="text-white">
            {overallStatus === 'good'
              ? 'Catalog is healthy with strong coverage and quality. Continue current tagging velocity.'
              : overallStatus === 'warning'
              ? 'Some areas need attention. Focus on increasing catalog freshness and trending alignment.'
              : 'Critical improvements needed. Prioritize high-volume tagging and quality improvements.'}
          </span>
        </p>
      </div>
    </div>
  );
}
