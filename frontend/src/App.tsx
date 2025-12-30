import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Gamepad2, LayoutDashboard, History, PlusCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AnalyzePage from './components/AnalyzePage';
import HistoryPage from './components/HistoryPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Gamepad2 className="h-8 w-8 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">GameTagger</h1>
                <span className="text-sm text-gray-500">VGMS Classification</span>
              </div>
              <nav className="flex space-x-1">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </NavLink>
                <NavLink
                  to="/analyze"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Analyze
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </NavLink>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
