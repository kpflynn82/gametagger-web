import { BrowserRouter, Routes, Route, NavLink, useLocation, Link } from 'react-router-dom';
import {
  Gamepad2,
  LayoutDashboard,
  Library,
  PlusCircle,
  BookOpen,
  Menu,
  X,
  ExternalLink,
  PartyPopper
} from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import Dashboard from './components/Dashboard';
import AnalyzePage from './components/AnalyzePage';
import HistoryPage from './components/HistoryPage';
import TagGlossary from './components/TagGlossary';
import AboutPage from './components/AboutPage';
import BulkImportPage from './components/BulkImportPage';

// Dancing banana gif embedded as base64 to avoid CDN issues
const DANCING_BANANA = 'data:image/gif;base64,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';

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/browse', label: 'Browse Games', icon: Library },
    { path: '/add', label: 'Add New Game', icon: PlusCircle },
    { path: '/glossary', label: 'Tag Glossary', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-dark-800 border-r border-dark-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-xbox-green rounded-xl">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">GameTagger</h1>
                  <p className="text-xs text-dark-200">VGMS Classification</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-dark-200 hover:text-white lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    nav-link
                    ${isActive ? 'nav-link-active' : ''}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-dark-700">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-xbox-green rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">System Online</span>
              </div>
              <p className="text-xs text-dark-200">
                Video Game Metadata System
              </p>
              <a
                href="https://genometagger.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-xbox-green hover:text-xbox-green-light mt-2 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Production Site</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function usePartyMode() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number>(0);

  const party = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.remove();
      cancelAnimationFrame(animationRef.current);
    }

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;

    // Canvas for confetti and fireworks
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'position: absolute; top: 0; left: 0;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    // Dancing banana
    const banana = document.createElement('img');
    banana.src = DANCING_BANANA;
    banana.style.cssText = `
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 150px;
      left: -200px;
      animation: bananaSlide 3s ease-in-out forwards;
    `;
    container.appendChild(banana);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes bananaSlide {
        0% { left: -200px; }
        50% { left: calc(50% - 75px); }
        100% { left: calc(100% + 200px); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
    containerRef.current = container;

    // Particle system
    const colors = ['#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#ffffff'];

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; alpha: number; type: 'confetti' | 'firework' | 'spark';
      rotation: number; rotationSpeed: number;
    }

    const particles: Particle[] = [];

    // Initial confetti burst from top
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    // Firework launcher
    const launchFirework = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = Math.random() * 6 + 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color,
          alpha: 1,
          type: 'spark',
          rotation: 0,
          rotationSpeed: 0,
        });
      }
    };

    // Launch fireworks at intervals
    const fireworkTimes = [200, 600, 1000, 1400, 1800, 2200];
    fireworkTimes.forEach(time => {
      setTimeout(() => {
        launchFirework(
          Math.random() * canvas.width * 0.6 + canvas.width * 0.2,
          Math.random() * canvas.height * 0.4 + canvas.height * 0.1
        );
      }, time);
    });

    const startTime = performance.now();
    const duration = 3500;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        container.remove();
        style.remove();
        containerRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === 'confetti') {
          p.vy += 0.15; // gravity
          p.vx *= 0.99;
          p.rotation += p.rotationSpeed;
        } else {
          p.vy += 0.12;
          p.alpha -= 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.alpha <= 0 || p.y > canvas.height + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  return party;
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  // Party mode - uncomment to enable:
  // const startParty = usePartyMode();
  // const [partyMode, setPartyMode] = useState(false);
  // const handlePartyMode = () => { setPartyMode(true); startParty(); setTimeout(() => setPartyMode(false), 3500); };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/browse': return 'Browse Games';
      case '/add': return 'Add New Game';
      case '/glossary': return 'Tag Glossary';
      case '/about': return 'About GameTagger';
      case '/bulk-import': return 'Bulk Genre Classifier';
      default: return 'GameTagger';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/': return 'Overview of game classification analytics';
      case '/browse': return 'Search and explore tagged games';
      case '/add': return 'Submit a new game for classification';
      case '/glossary': return 'Reference for all classification tags';
      case '/about': return 'AI-powered game classification technology';
      case '/bulk-import': return 'Classify games by primary genre only (admin)';
      default: return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-dark-200 hover:text-white hover:bg-dark-700 rounded-lg transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{getPageTitle()}</h2>
            <p className="text-sm text-dark-300 hidden sm:block">{getPageDescription()}</p>
          </div>
        </div>

        {/* Party button - uncomment to enable:
        <button
          onClick={handlePartyMode}
          disabled={partyMode}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm text-white
            bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500
            hover:from-purple-400 hover:via-pink-400 hover:to-fuchsia-400
            hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30
            active:scale-95
            transition-all duration-200 ease-out
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
            ${partyMode ? 'animate-bounce' : ''}
          `}
        >
          <PartyPopper className="h-4 w-4" />
          <span className="hidden sm:inline">Party Mode</span>
        </button>
        */}
      </div>
    </header>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/browse" element={<HistoryPage />} />
              <Route path="/add" element={<AnalyzePage />} />
              <Route path="/glossary" element={<TagGlossary />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Hidden admin route - not in navigation */}
              <Route path="/bulk-import" element={<BulkImportPage />} />
              {/* Legacy routes redirect */}
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-dark-300">
            <span>GameTagger VGMS - Video Game Metadata System</span>
            <Link to="/about" className="text-xbox-green hover:text-xbox-green-light transition-colors">
              About
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
