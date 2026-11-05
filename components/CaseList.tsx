
import React from 'react';
import { Case, CaseStatus } from '../types';

interface CaseListProps {
  cases: Case[];
}

const getStatusColor = (status: CaseStatus) => {
  switch (status) {
    case CaseStatus.Active:
      return 'bg-red-500/20 text-red-400 border border-red-500/50';
    case CaseStatus.Pending:
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    case CaseStatus.Recovered:
      return 'bg-green-500/20 text-green-400 border border-green-500/50';
    case CaseStatus.Closed:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
    default:
      return 'bg-gray-700 text-gray-300';
  }
};

const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
        case 'High': return 'text-red-500 font-bold animate-pulse';
        case 'Medium': return 'text-yellow-500';
        case 'Low': return 'text-green-500';
    }
}

const CaseList: React.FC<CaseListProps> = ({ cases }) => {
  return (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-lg h-full border border-brand-light">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Asset Registry</h3>
          <span className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-1 rounded border border-brand-accent/30">LIVE DB</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-brand-light">
              <th className="py-2 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Case ID</th>
              <th className="py-2 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Device</th>
              <th className="py-2 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Location</th>
              <th className="py-2 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Time</th>
              <th className="py-2 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Priority</th>
              <th className="py-2 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <tr key={caseItem.id} className="border-b border-brand-light/50 hover:bg-brand-light/20 transition-colors duration-200 group">
                <td className="py-3 px-4 text-brand-accent font-mono text-sm">{caseItem.id}</td>
                <td className="py-3 px-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-brand-text">{caseItem.device}</span>
                        <span className="text-[10px] text-brand-text-secondary uppercase">{caseItem.type}</span>
                    </div>
                </td>
                <td className="py-3 px-4 text-sm text-brand-text-secondary">{caseItem.location}</td>
                <td className="py-3 px-4 text-xs text-brand-text-secondary font-mono">{caseItem.reportedAt}</td>
                <td className={`py-3 px-4 text-xs uppercase tracking-wide ${getPriorityColor(caseItem.priority)}`}>{caseItem.priority}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CaseList;
