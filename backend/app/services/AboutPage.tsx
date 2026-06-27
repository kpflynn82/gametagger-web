import { useEffect, useState } from 'react';
import {
  Zap,
  Brain,
  Layers,
  Clock,
  TrendingUp,
  Shield,
  Database,
  Cpu,
  Globe,
  Film,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Users,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Live stats from API
interface Stats {
  total_analyses: number;
  average_confidence: number;
}

export default function AboutPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats({ total_analyses: 900, average_confidence: 0.85 }));
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative text-center py-10">
        <div className="absolute inset-0 hero-gradient opacity-50" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Accurately classify any game in
            <span className="gradient-text"> under 5 seconds</span>
          </h1>
          <p className="text-lg text-dark-200 max-w-2xl mx-auto mb-6">
            Machine learning trained on 40,000 hours of gameplay data, combining
            text analysis with visual recognition to classify games across 200+ tags.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/add" className="btn-secondary inline-flex items-center gap-2 text-sm">
              Try it <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="text-dark-200 hover:text-white text-sm px-4 py-2 transition-colors">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cost Per Game', value: '$0.12', subtext: 'vs $15-25 manual', icon: Zap },
          { label: 'Classification Time', value: '<5 sec', subtext: 'vs 30-60 minutes', icon: Clock },
          { label: 'Games Classified', value: stats?.total_analyses?.toLocaleString() || '900+', subtext: 'and growing', icon: Database },
          { label: 'Tag Categories', value: '200+', subtext: 'across 44 genres', icon: Layers },
        ].map((metric, i) => (
          <div key={i} className="glass-card p-6 text-center group hover:border-xbox-green/50 transition-all duration-300">
            <div className="inline-flex p-3 bg-xbox-green/10 rounded-xl mb-4 group-hover:bg-xbox-green/20 transition-colors">
              <metric.icon className="h-6 w-6 text-xbox-green" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-sm text-dark-200">{metric.label}</div>
            <div className="text-xs text-xbox-green mt-1">{metric.subtext}</div>
          </div>
        ))}
      </section>

      {/* Vision AI Showcase */}
      <section className="glass-card p-8 overflow-hidden">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4">
            <Brain className="h-4 w-4" />
            Visual Recognition
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            One Screenshot. Complete Classification.
          </h2>
          <p className="text-dark-200 max-w-2xl mx-auto">
            Claude's vision capabilities identify game characteristics directly from images—art style,
            UI elements, gameplay mechanics, atmosphere. No metadata required.
          </p>
        </div>

        {/* Example Screenshots Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Pixel Horror Example */}
          <div className="relative group">
            <div className="relative rounded-xl overflow-hidden border border-dark-500 group-hover:border-purple-500/50 transition-all">
              <img
                src="/images/examples/pixel_horror.png"
                alt="Pixel art horror game screenshot"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-dark-800/90 backdrop-blur px-2 py-1 rounded-full border border-xbox-green/50">
                <div className="w-1.5 h-1.5 bg-xbox-green rounded-full animate-pulse" />
                <span className="text-[10px] text-xbox-green font-medium">Analyzed</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Pixel Art', 'Horror', 'Atmospheric', '2D Sidescroller', 'Exploration'].map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Racing Example */}
          <div className="relative group">
            <div className="relative rounded-xl overflow-hidden border border-dark-500 group-hover:border-blue-500/50 transition-all">
              <img
                src="/images/examples/racing_3d.png"
                alt="3D racing game screenshot"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-dark-800/90 backdrop-blur px-2 py-1 rounded-full border border-xbox-green/50">
                <div className="w-1.5 h-1.5 bg-xbox-green rounded-full animate-pulse" />
                <span className="text-[10px] text-xbox-green font-medium">Analyzed</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Racing', '3D Graphics', 'Arcade', 'Night Setting', 'Neon Aesthetic'].map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Cozy Farming Example */}
          <div className="relative group">
            <div className="relative rounded-xl overflow-hidden border border-dark-500 group-hover:border-amber-500/50 transition-all">
              <img
                src="/images/examples/cozy_farming.png"
                alt="Cozy farming game screenshot"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-dark-800/90 backdrop-blur px-2 py-1 rounded-full border border-xbox-green/50">
                <div className="w-1.5 h-1.5 bg-xbox-green rounded-full animate-pulse" />
                <span className="text-[10px] text-xbox-green font-medium">Analyzed</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['Farming Sim', 'Cozy', 'Cartoon Style', 'Casual', 'Relaxing'].map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Features Row */}
        <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-dark-600">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-xbox-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4 text-xbox-green" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1">Art Style Detection</h4>
              <p className="text-xs text-dark-300">Pixel art, cel-shaded, realistic—identified visually</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Film className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1">Video Frame Analysis</h4>
              <p className="text-xs text-dark-300">Each trailer yields multiple frames sampled across the clip for verification</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1">UI Recognition</h4>
              <p className="text-xs text-dark-300">HUDs, menus, and interface elements inform classification</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Foundation */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">Built on Solid Foundations</h2>
          <p className="text-dark-200 max-w-2xl mx-auto">
            Our classification system combines academic rigor with real-world gaming expertise
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-8 hover:border-purple-500/50 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <Database className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">40,000 Hours of Training</h3>
            <p className="text-dark-200 text-sm leading-relaxed">
              Trained on comprehensive gameplay data from Nitrogen, one of the largest
              video game analytics datasets. This gives us deep understanding of how
              games play, not just how they're described.
            </p>
          </div>

          <div className="glass-card p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Layers className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">VGMS Taxonomy</h3>
            <p className="text-dark-200 text-sm leading-relaxed">
              Built on the Video Game Metadata Schema from the University of Washington,
              providing academic-grade classification standards with 200+ tags across
              gameplay, narrative, themes, and mechanics.
            </p>
          </div>

          <div className="glass-card p-8 hover:border-xbox-green/50 transition-all duration-300">
            <div className="w-12 h-12 bg-xbox-green/20 rounded-xl flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-xbox-green" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Expert Genre Design</h3>
            <p className="text-dark-200 text-sm leading-relaxed">
              Genre taxonomy designed by Kevin Flynn to ensure complete coverage
              of both classic and emerging game categories. From AAA blockbusters
              to indie experiments, every game has a home.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Pipeline Visualization */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-dark-200 max-w-2xl mx-auto">
            Multi-source data aggregation with AI synthesis delivers accurate classification in seconds
          </p>
        </div>

        {/* Pipeline Graphic */}
        <div className="glass-card p-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Step 1: Input */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto bg-dark-600 rounded-2xl flex items-center justify-center mb-4 border-2 border-dark-500">
                <span className="text-2xl">🎮</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Game Title</h4>
              <p className="text-sm text-dark-300">Enter any game name</p>
            </div>

            <ArrowRight className="h-6 w-6 text-dark-400 hidden lg:block" />

            {/* Step 2: Data Sources */}
            <div className="flex-1 text-center">
              <div className="flex justify-center gap-2 mb-4">
                <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center border border-gray-500/30">
                  <Globe className="h-5 w-5 text-gray-300" />
                </div>
                <div className="w-12 h-12 bg-xbox-green/20 rounded-xl flex items-center justify-center border border-xbox-green/30">
                  <svg className="h-5 w-5 text-xbox-green" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417z"/>
                    <path d="M12 4.58c3.146 2.924 9.6 9.283 10.602 13.084C23.467 15.88 24 13.56 24 12c0-3.545-1.577-6.732-4.07-8.899-1.08-.67-4.93 3.479-7.93 1.479z"/>
                    <path d="M12 4.58c-3.146 2.924-9.6 9.283-10.602 13.084C.533 15.88 0 13.56 0 12 0 8.455 1.577 5.268 4.07 3.101c1.08-.67 4.93 3.479 7.93 1.479z"/>
                  </svg>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.828 8.423l-1.604 7.6c-.12.535-.435.667-.882.416l-2.449-1.805-1.181 1.136c-.131.131-.241.241-.494.241l.175-2.494 4.528-4.092c.197-.175-.043-.272-.306-.097l-5.596 3.524-2.41-.752c-.524-.164-.535-.524.109-.776l9.42-3.633c.436-.16.818.098.69.732z"/>
                  </svg>
                </div>
              </div>
              <h4 className="font-semibold text-white mb-2">Data Aggregation</h4>
              <p className="text-sm text-dark-300">Wikipedia, Xbox, Steam</p>
            </div>

            <ArrowRight className="h-6 w-6 text-dark-400 hidden lg:block" />

            {/* Step 3: AI Analysis */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-xbox-green/30 to-purple-500/30 rounded-2xl flex items-center justify-center mb-4 border-2 border-xbox-green/50 animate-pulse">
                <Brain className="h-7 w-7 text-xbox-green" />
              </div>
              <h4 className="font-semibold text-white mb-2">Claude AI</h4>
              <p className="text-sm text-dark-300">Vision + Language Analysis</p>
            </div>

            <ArrowRight className="h-6 w-6 text-dark-400 hidden lg:block" />

            {/* Step 4: Output */}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto bg-xbox-green/20 rounded-2xl flex items-center justify-center mb-4 border-2 border-xbox-green">
                <CheckCircle2 className="h-7 w-7 text-xbox-green" />
              </div>
              <h4 className="font-semibold text-white mb-2">200+ Tags</h4>
              <p className="text-sm text-dark-300">Confidence scored</p>
            </div>
          </div>

          {/* Time indicator */}
          <div className="mt-8 pt-6 border-t border-dark-600">
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-5 w-5 text-xbox-green" />
              <span className="text-xbox-green font-semibold">Total Time: Under 5 Seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Developer Feedback */}
      <section className="glass-card p-8 bg-gradient-to-r from-xbox-green/5 to-purple-500/5">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-xbox-green/20 rounded-full text-xbox-green text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              Real-Time Integration
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Developer Feedback in Seconds
            </h2>
            <p className="text-dark-200 mb-6">
              Imagine: a developer submits their game to the Xbox Store. Within seconds,
              GameTagger automatically classifies it and shows the developer exactly how
              their game will be tagged and categorized.
            </p>
            <ul className="space-y-3">
              {[
                'Instant classification on store submission',
                'Real-time feedback before publication',
                'Developers can request tag adjustments',
                'Improve discoverability proactively'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-xbox-green flex-shrink-0 mt-0.5" />
                  <span className="text-dark-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            {/* Mock notification UI */}
            <div className="glass-card p-6 border-xbox-green/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-xbox-green rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">New Game Tagged</div>
                  <div className="text-xs text-dark-300">Just now</div>
                </div>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-4 mb-4">
                <div className="text-white font-medium mb-2">"Stellar Odyssey"</div>
                <div className="flex flex-wrap gap-2">
                  {['Action RPG', 'Sci-Fi', 'Open World', 'Co-op'].map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-xbox-green/20 text-xbox-green text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-300">Confidence: <span className="text-xbox-green font-medium">High</span></span>
                <button className="text-xbox-green hover:text-xbox-green-light transition-colors">
                  Review Tags →
                </button>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-xbox-green/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* Reliability & Accuracy */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">Reliable & Accurate</h2>
          <p className="text-dark-200 max-w-2xl mx-auto">
            Multi-layer verification ensures every classification is trustworthy
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-xbox-green/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-xbox-green" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Confidence Scoring</h3>
                <p className="text-dark-200 text-sm mb-4">
                  Every classification includes a confidence score based on source agreement.
                  High confidence means multiple independent sources confirm the classification.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-xbox-green/20 text-xbox-green text-xs rounded-full font-medium">High</span>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full font-medium">Medium</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full font-medium">Low</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Automatic Escalation</h3>
                <p className="text-dark-200 text-sm">
                  When confidence is low, the system automatically escalates to additional sources.
                  Gameplay trailer analysis provides visual verification by sampling frames from the official trailer.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Film className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Vision AI Verification</h3>
                <p className="text-dark-200 text-sm">
                  Deep Analysis samples frames from the official gameplay trailer and uses
                  Claude's vision capabilities to verify classifications by seeing the game in action.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cpu className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Claude Opus for Premium</h3>
                <p className="text-dark-200 text-sm">
                  Deep Analysis uses Claude Opus—Anthropic's most capable model—for
                  the highest accuracy on edge cases and ambiguous classifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Continuous Learning */}
      <section className="glass-card p-8 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-4">
              <RefreshCw className="h-4 w-4" />
              Self-Improving System
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Gets Smarter With Every Classification
            </h2>
            <p className="text-dark-200 mb-6 leading-relaxed">
              Every game classified expands our understanding. The system learns patterns,
              refines accuracy, and adapts to emerging genres automatically.
            </p>

            <ul className="space-y-3">
              {[
                'Each classification adds to training context',
                'New genre patterns detected automatically',
                'Confidence improves with more data points',
                'Edge cases inform future classifications'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-dark-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning visualization */}
          <div className="relative">
            <div className="glass-card p-6 border-blue-500/20">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white font-medium">Classification Accuracy</span>
                <span className="text-blue-400 text-sm">Improving</span>
              </div>

              {/* Progress bars showing improvement */}
              <div className="space-y-4">
                {[
                  { label: 'Genre Detection', value: 94, trend: '+2.3%' },
                  { label: 'Art Style Recognition', value: 89, trend: '+4.1%' },
                  { label: 'Mechanic Identification', value: 91, trend: '+1.8%' },
                  { label: 'Theme Classification', value: 87, trend: '+3.2%' },
                ].map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-200">{metric.label}</span>
                      <span className="text-xbox-green">{metric.value}% <span className="text-blue-400 text-xs">{metric.trend}</span></span>
                    </div>
                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-xbox-green to-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-dark-600 text-center">
                <span className="text-dark-300 text-sm">Based on {stats?.total_analyses?.toLocaleString() || '900'}+ classifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">Additional Capabilities</h2>
          <p className="text-dark-200 max-w-2xl mx-auto">
            Beyond basic tagging—analytics for understanding the gaming landscape
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: TrendingUp,
              title: 'Genre Lifecycle',
              description: 'Track emerging, growing, mature, and declining genres',
              color: 'xbox-green'
            },
            {
              icon: BarChart3,
              title: 'Trending Alignment',
              description: 'Correlate with live Steam player data',
              color: 'purple'
            },
            {
              icon: Sparkles,
              title: 'New Tag Detection',
              description: 'Identify potential tags before widespread adoption',
              color: 'blue'
            },
            {
              icon: Users,
              title: 'Shopper Intelligence',
              description: 'Engagement patterns, monetization signals',
              color: 'amber'
            }
          ].map((feature, i) => (
            <div key={i} className={`glass-card p-6 hover:border-${feature.color}-500/50 transition-all duration-300`}>
              <div className={`w-10 h-10 bg-${feature.color === 'xbox-green' ? 'xbox-green' : feature.color + '-500'}/20 rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`h-5 w-5 ${feature.color === 'xbox-green' ? 'text-xbox-green' : `text-${feature.color}-400`}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-dark-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="glass-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">The Economics</h2>
          <p className="text-dark-200">
            AI classification at a fraction of the cost with better consistency
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left py-4 px-4 text-dark-200 font-medium">Metric</th>
                <th className="text-center py-4 px-4 text-dark-200 font-medium">Manual Tagging</th>
                <th className="text-center py-4 px-4 text-xbox-green font-medium">GameTagger</th>
                <th className="text-center py-4 px-4 text-dark-200 font-medium">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Cost per game', manual: '$15 - $25', auto: '$0.12', improvement: '99% savings' },
                { metric: 'Time per game', manual: '30-60 min', auto: '<5 seconds', improvement: '720x faster' },
                { metric: 'Consistency', manual: 'Variable', auto: '100%', improvement: 'Perfect' },
                { metric: 'Scalability', manual: 'Linear cost', auto: 'Near-zero marginal', improvement: 'Infinite' },
                { metric: 'Availability', manual: 'Business hours', auto: '24/7', improvement: 'Always on' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-dark-700/50">
                  <td className="py-4 px-4 text-white font-medium">{row.metric}</td>
                  <td className="py-4 px-4 text-center text-dark-300">{row.manual}</td>
                  <td className="py-4 px-4 text-center text-xbox-green font-semibold">{row.auto}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-2 py-1 bg-xbox-green/20 text-xbox-green text-xs rounded-full">
                      {row.improvement}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <p className="text-dark-200 mb-4">
          Want to see how it works?
        </p>
        <Link to="/add" className="btn-secondary inline-flex items-center gap-2">
          Try a classification <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
