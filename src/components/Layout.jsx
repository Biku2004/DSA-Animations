import React, { useState } from 'react';
import { Menu, X, Moon, Sun, Code2, BarChart3, Home } from 'lucide-react';
import PrefixSum from '../pages/PrefixSum';
import SlidingWindow from '../pages/SlidingWindow';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');

  

  const animations = [
    {
      id: 'prefix-sum',
      name: 'Prefix Sum',
      icon: BarChart3,
      description: 'Learn about prefix sum tradeoffs',
      component: PrefixSum,
    },
    {
      id: 'sliding-window',
      name: 'Sliding Window',
      icon: Code2,
      description: 'Visualize the sliding window technique',
      component: SlidingWindow,
    },
  ];

  const renderContent = () => {
    if (currentPage === 'home') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              DSA Animations
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12">
              Interactive visualizations to help you understand Data Structures and Algorithms
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {animations.map((anim) => {
                const Icon = anim.icon;
                return (
                  <button
                    key={anim.id}
                    onClick={() => setCurrentPage(anim.id)}
                    className="group p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 group-hover:bg-blue-500 dark:group-hover:bg-blue-500 transition-colors">
                        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {anim.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {anim.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const selectedAnim = animations.find((a) => a.id === currentPage);
    if (selectedAnim) {
      const Component = selectedAnim.component;
      return <Component />;
    }

    return null;
  };

  return (
    <div id="app-root" className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex flex-col shadow-lg`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              DSA Viz
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={() => {
              toggleDarkMode();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {darkMode ? (
              <>
                <Sun className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-slate-700" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setCurrentPage('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
              currentPage === 'home'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <div className="pt-4 pb-2 px-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Animations
            </h3>
          </div>

          {animations.map((anim) => {
            const Icon = anim.icon;
            return (
              <button
                key={anim.id}
                onClick={() => setCurrentPage(anim.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  currentPage === anim.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{anim.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
          Built with React & Tailwind
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {currentPage === 'home'
                ? 'Home'
                : animations.find((a) => a.id === currentPage)?.name}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Layout;
