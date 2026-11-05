
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AssetRegistry from './components/AssetRegistry';
import LiveTracking from './components/LiveTracking';
import Forensics from './components/Forensics';
import SystemConfig from './components/SystemConfig';
import { AiInsight, TacticalResponse } from './types';
import { processNaturalLanguageQuery } from './services/geminiService';
import { MOCK_AI_INSIGHTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('command_center');
  const [tacticalData, setTacticalData] = useState<TacticalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiInsights] = useState<AiInsight[]>(MOCK_AI_INSIGHTS);

  const handleSearch = async (query: string) => {
    // Switch to command center when searching so user sees results
    if (currentView !== 'command_center') {
      setCurrentView('command_center');
    }
    
    if (!query) {
      setTacticalData(null);
      return;
    }
    setIsLoading(true);
    try {
      const result = await processNaturalLanguageQuery(query);
      setTacticalData(result);
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'command_center':
        return <Dashboard tacticalData={tacticalData} isLoading={isLoading} aiInsights={aiInsights} />;
      case 'asset_registry':
        return <AssetRegistry />;
      case 'live_tracking':
        return <LiveTracking />;
      case 'forensics':
        return <Forensics />;
      case 'system_config':
        return <SystemConfig />;
      default:
        return <Dashboard tacticalData={tacticalData} isLoading={isLoading} aiInsights={aiInsights} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-dark text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      <Sidebar activeView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none z-0"></div>
        <Header onSearch={handleSearch} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-dark p-6 z-10 relative flex flex-col">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
