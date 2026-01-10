import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Gamepad2,
  LayoutDashboard,
  Library,
  PlusCircle,
  BookOpen,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import Dashboard from './components/Dashboard';
import AnalyzePage from './components/AnalyzePage';
import HistoryPage from './components/HistoryPage';
import TagGlossary from './components/TagGlossary';

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

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/browse': return 'Browse Games';
      case '/add': return 'Add New Game';
      case '/glossary': return 'Tag Glossary';
      default: return 'GameTagger';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/': return 'Overview of game classification analytics';
      case '/browse': return 'Search and explore tagged games';
      case '/add': return 'Submit a new game for classification';
      case '/glossary': return 'Reference for all classification tags';
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

        {/* Xbox Branding */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-dark-800/50 rounded-lg border border-dark-600/50">
            <span className="text-xs text-dark-300">Powered by</span>
            <span className="text-sm font-semibold text-xbox-green">Xbox</span>
          </div>
        </div>
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
              {/* Legacy routes redirect */}
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-dark-300">
            <span>GameTagger VGMS - Video Game Metadata System</span>
            <span>Built for Xbox Game Studios</span>
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
