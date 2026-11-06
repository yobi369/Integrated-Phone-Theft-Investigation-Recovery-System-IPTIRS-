import React from 'react';
import { MOCK_KPIS, MOCK_CASES } from '../constants';
import KpiCard from './KpiCard';
import CaseList from './CaseList';

const Dashboard: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-black text-white uppercase tracking-wider">Case Coordination Overview</h2>
      <p className="text-sm text-brand-text-secondary mt-2">Interface preview using synthetic records. No operational metrics are available.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {MOCK_KPIS.map(kpi => <KpiCard key={kpi.title} kpi={kpi} />)}
    </div>
    <div className="bg-brand-secondary border border-brand-light rounded-lg p-4">
      <h3 className="font-bold text-white mb-2">Demo case records</h3>
      <p className="text-xs text-brand-text-secondary mb-4">All entries below are fictional examples for interface testing, not real reports or investigations.</p>
      <CaseList cases={MOCK_CASES} />
    </div>
  </div>
);

export default Dashboard;
