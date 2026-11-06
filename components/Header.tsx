import React from 'react';

const Header: React.FC = () => (
  <header className="min-h-20 bg-brand-secondary/95 flex items-center justify-between gap-4 px-6 py-4 border-b border-brand-light flex-shrink-0 z-20 shadow-md">
    <div>
      <p className="text-sm font-bold text-white tracking-wider">IPTIRS</p>
      <p className="text-xs text-brand-text-secondary">Integrated Phone Theft Investigation & Recovery System</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-white">Prototype workspace</p>
      <p className="text-xs text-brand-text-secondary">No institution connected</p>
    </div>
  </header>
);

export default Header;
