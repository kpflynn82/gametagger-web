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
import { useState, useRef, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AnalyzePage from './components/AnalyzePage';
import HistoryPage from './components/HistoryPage';
import TagGlossary from './components/TagGlossary';
import AboutPage from './components/AboutPage';
import BulkImportPage from './components/BulkImportPage';

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

// --- Party Mode (temporary demo feature) ---
function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);

  const fire = useCallback(() => {
    // Clean up any existing canvas
    if (canvasRef.current) {
      canvasRef.current.remove();
      cancelAnimationFrame(animationRef.current);
    }

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308',
      '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ffffff',
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      shape: number;
    }

    const particles: Particle[] = Array.from({ length: 150 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 100,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * -18 - 4,
      size: Math.random() * 8 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
      shape: Math.floor(Math.random() * 3), // 0=rect, 1=circle, 2=triangle
    }));

    const startTime = performance.now();
    const duration = 3000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        canvas.remove();
        canvasRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += 0.4; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  return fire;
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();

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

  const fireConfetti = useConfetti();
  const [partyMode, setPartyMode] = useState(false);

  const handlePartyMode = () => {
    setPartyMode(true);
    fireConfetti();
    setTimeout(() => setPartyMode(false), 3000);
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
          <span>Party Mode</span>
        </button>
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
