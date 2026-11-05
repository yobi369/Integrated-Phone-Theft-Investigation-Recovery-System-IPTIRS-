
import React from 'react';
import { HomeIcon, CaseIcon, MapIcon, AnalyticsIcon, SettingsIcon } from './icons/Icons';

interface SidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'command_center', icon: <HomeIcon />, name: 'Command Center' },
    { id: 'asset_registry', icon: <CaseIcon />, name: 'Asset Registry' },
    { id: 'live_tracking', icon: <MapIcon />, name: 'Live Tracking' },
    { id: 'forensics', icon: <AnalyticsIcon />, name: 'Forensics' },
    { id: 'system_config', icon: <SettingsIcon />, name: 'System Config' },
  ];

  return (
    <div className="w-64 bg-brand-secondary flex flex-col border-r border-brand-light shadow-xl z-20 print:hidden">
      <div className="flex items-center justify-center h-20 border-b border-brand-light bg-brand-dark">
        <div className="flex flex-col items-center">
             <h1 className="text-2xl font-black text-brand-accent tracking-[0.2em]">K-DART</h1>
             <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest">Asset Recovery</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded transition-all duration-200 border-l-4 ${
              activeView === item.id
                ? 'bg-brand-accent/10 text-brand-accent border-brand-accent'
                : 'text-brand-text-secondary border-transparent hover:bg-brand-light/30 hover:text-white hover:border-brand-text-secondary'
            }`}
          >
            {item.icon}
            <span className="ml-4 uppercase tracking-wide">{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-brand-light bg-brand-dark/50">
          <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-green-500 font-mono">SYSTEM: ONLINE</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-[10px] text-brand-text-secondary text-center opacity-50">Authorized Personnel Only</p>
      </div>
    </div>
  );
};

export default Sidebar;
