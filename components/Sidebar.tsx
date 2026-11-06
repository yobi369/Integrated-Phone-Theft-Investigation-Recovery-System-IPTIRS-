import React from 'react';
import { HomeIcon, CaseIcon, MapIcon, AnalyticsIcon, SettingsIcon } from './icons/Icons';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'command_center', icon: <HomeIcon />, name: 'Overview' },
  { id: 'asset_registry', icon: <CaseIcon />, name: 'Case Registry' },
  { id: 'live_tracking', icon: <MapIcon />, name: 'Authorized Requests' },
  { id: 'forensics', icon: <AnalyticsIcon />, name: 'Reporting' },
  { id: 'system_config', icon: <SettingsIcon />, name: 'Platform Setup' }
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => (
  <aside className="w-16 md:w-64 shrink-0 bg-brand-secondary flex flex-col border-r border-brand-light shadow-xl z-20 print:hidden">
    <div className="flex items-center justify-center min-h-20 border-b border-brand-light bg-brand-dark px-2">
      <div className="flex flex-col items-center">
        <h1 className="text-xl md:text-2xl font-black text-brand-accent tracking-[0.16em]">IPTIRS</h1>
        <p className="hidden md:block text-[10px] text-brand-text-secondary uppercase tracking-widest">Case Coordination</p>
      </div>
    </div>
    <nav aria-label="Prototype navigation" className="flex-1 px-2 md:px-4 py-6 space-y-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={item.name}
          aria-current={activeView === item.id ? 'page' : undefined}
          title={item.name}
          onClick={() => onViewChange(item.id)}
          className={`w-full flex items-center justify-center md:justify-start px-2 md:px-4 py-3 text-sm font-medium rounded transition-colors border-l-4 ${
            activeView === item.id
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent'
              : 'text-brand-text-secondary border-transparent hover:bg-brand-light/30 hover:text-white hover:border-brand-text-secondary'
          }`}
        >
          <span aria-hidden="true" className="shrink-0">{item.icon}</span>
          <span className="hidden md:inline ml-4 uppercase tracking-wide">{item.name}</span>
        </button>
      ))}
    </nav>
    <div className="p-3 md:p-4 border-t border-brand-light bg-brand-dark/50">
      <div className="flex items-center justify-center md:justify-between mb-2">
        <span className="hidden md:inline text-[10px] text-amber-300 font-mono">DEMO MODE</span>
        <span aria-hidden="true" className="w-2 h-2 bg-amber-400 rounded-full" />
      </div>
      <p className="hidden md:block text-[10px] text-brand-text-secondary text-center">Synthetic data only · No institution connected</p>
    </div>
  </aside>
);

export default Sidebar;
