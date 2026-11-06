import React, { useState } from 'react';
import { SearchIcon } from './icons/Icons';

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
    <header className="min-h-20 bg-brand-secondary/95 backdrop-blur flex items-center justify-between gap-4 px-6 py-3 border-b border-brand-light flex-shrink-0 z-20 shadow-md print:hidden">
      <div className="flex-1 max-w-3xl">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="text-brand-accent" />
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sample records (demo only)"
              aria-label="Search sample records"
              className="w-full bg-brand-dark border border-brand-light/50 rounded-sm py-3 pl-12 pr-4 text-brand-text placeholder-brand-text-secondary/70 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-sm"
            />
          </div>
        </form>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">IPTIRS Prototype</p>
        <p className="text-xs text-brand-text-secondary">No institutional identity connected</p>
      </div>
    </header>
  );
};

export default Header;
