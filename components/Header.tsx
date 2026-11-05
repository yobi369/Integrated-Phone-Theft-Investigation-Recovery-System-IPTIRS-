
import React, { useState } from 'react';
import { SearchIcon, BellIcon } from './icons/Icons';

interface HeaderProps {
    onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <header className="h-20 bg-brand-secondary/95 backdrop-blur flex items-center justify-between px-6 border-b border-brand-light flex-shrink-0 z-20 shadow-md print:hidden">
      <div className="flex-1 max-w-3xl">
        <form onSubmit={handleSearch}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="text-brand-accent" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ENTER TACTICAL COMMAND (e.g., 'Track IMEI 884...', 'Analyze hotspots in Mombasa')"
                    className="w-full bg-brand-dark border border-brand-light/50 rounded-sm py-3 pl-12 pr-4 text-brand-text placeholder-brand-text-secondary/50 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent font-mono text-sm transition-all shadow-inner"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                    <span className="text-[10px] text-brand-text-secondary border border-brand-light px-1 rounded bg-brand-secondary opacity-50 group-hover:opacity-100 transition-opacity">CMD + K</span>
                </div>
            </div>
        </form>
      </div>
      <div className="flex items-center space-x-6">
        <div className="relative cursor-pointer hover:bg-brand-light/20 p-2 rounded-full transition-colors">
          <BellIcon />
          <span className="absolute top-1 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
        <div className="flex items-center border-l border-brand-light pl-6">
          <div className="text-right mr-3 hidden md:block">
            <p className="text-sm font-bold text-white uppercase tracking-wider">Officer K. Kiprop</p>
            <p className="text-[10px] text-brand-text-secondary font-mono">ID: KE-POL-8821 | SGT</p>
          </div>
          <img
            src="https://picsum.photos/seed/officer/40/40"
            alt="User Avatar"
            className="w-10 h-10 rounded-sm border-2 border-brand-accent/50 p-0.5"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
