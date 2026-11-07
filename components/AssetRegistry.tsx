import React, { useState } from 'react';
import { MOCK_CASES } from '../constants';
import { CaseStatus } from '../types';

const AssetRegistry: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCases = MOCK_CASES.filter(c => {
    const matchesFilter = filter === 'All' || c.status === filter;
    const matchesSearch = c.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.owner.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.Active: return 'bg-red-500/20 text-red-400 border-red-500/50';
      case CaseStatus.Pending: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case CaseStatus.Recovered: return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wider">Device & Case Registry Preview</h2>
          <p className="text-brand-text-secondary text-sm mt-2">Synthetic records only. This screen is not connected to a database.</p>
        </div>
        <span className="text-xs bg-amber-500/10 text-amber-200 px-3 py-2 rounded border border-amber-500/30">DEMO DATA — READ ONLY</span>
      </div>

      <div className="bg-brand-secondary p-4 rounded-lg border border-brand-light flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <label className="sr-only" htmlFor="registry-search">Search sample records</label>
          <input
            id="registry-search"
            type="search"
            placeholder="Search sample ID, device, or sample owner..."
            className="w-full bg-brand-dark border border-brand-light rounded py-2 px-4 text-white focus:border-brand-accent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="registry-status">Filter sample records by status</label>
        <select
          id="registry-status"
          className="w-full md:w-auto bg-brand-dark border border-brand-light rounded py-2 px-4 text-white focus:border-brand-accent focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Recovered">Recovered</option>
        </select>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-dark/50">
              <tr>
                <th className="py-3 px-6 text-xs font-bold text-brand-text-secondary uppercase">Sample case ID</th>
                <th className="py-3 px-6 text-xs font-bold text-brand-text-secondary uppercase">Sample device</th>
                <th className="py-3 px-6 text-xs font-bold text-brand-text-secondary uppercase">Sample owner</th>
                <th className="py-3 px-6 text-xs font-bold text-brand-text-secondary uppercase">Sample location</th>
                <th className="py-3 px-6 text-xs font-bold text-brand-text-secondary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light/30">
              {filteredCases.map((c) => (
                <tr key={c.id}>
                  <td className="py-4 px-6 text-brand-accent font-mono text-sm">{c.id}</td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-white">{c.device}</div>
                    <div className="text-xs text-brand-text-secondary">{c.type}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-brand-text">{c.owner}</td>
                  <td className="py-4 px-6 text-sm text-brand-text-secondary">{c.location}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCases.length === 0 && (
          <div className="p-8 text-center text-brand-text-secondary">No sample records match these filters.</div>
        )}
      </div>
      <p className="text-xs text-brand-text-secondary">Create, edit, export, and operational case actions are intentionally unavailable until authenticated server-side workflows are implemented.</p>
    </div>
  );
};

export default AssetRegistry;
