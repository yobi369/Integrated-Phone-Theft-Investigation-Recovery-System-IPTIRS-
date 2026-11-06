import React, { lazy, Suspense, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const Dashboard = lazy(() => import('./components/Dashboard'));
const AssetRegistry = lazy(() => import('./components/AssetRegistry'));
const LiveTracking = lazy(() => import('./components/LiveTracking'));
const Forensics = lazy(() => import('./components/Forensics'));
const SystemConfig = lazy(() => import('./components/SystemConfig'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('command_center');

  const renderContent = () => {
    switch (currentView) {
      case 'command_center':
        return <Dashboard />;
      case 'asset_registry':
        return <AssetRegistry />;
      case 'live_tracking':
        return <LiveTracking />;
      case 'forensics':
        return <Forensics />;
      case 'system_config':
        return <SystemConfig />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      <Sidebar activeView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-dark p-4 md:p-6 relative">
          <div role="status" className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3">
            <p className="text-sm font-bold text-amber-200">DEVELOPMENT PROTOTYPE — NOT AN OPERATIONAL GOVERNMENT OR TELECOM SYSTEM</p>
            <p className="text-xs text-amber-100/90 mt-1">
              Sample records are synthetic. No live device tracking, police database, operator integration,
              or verified case analytics are connected. Do not enter real personal or investigative data.
            </p>
          </div>
          <Suspense fallback={<div role="status" className="rounded-lg border border-brand-light bg-brand-secondary p-6 text-sm text-brand-text-secondary">Loading prototype view…</div>}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
