import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AssetRegistry from './components/AssetRegistry';
import LiveTracking from './components/LiveTracking';
import Forensics from './components/Forensics';
import SystemConfig from './components/SystemConfig';

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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
