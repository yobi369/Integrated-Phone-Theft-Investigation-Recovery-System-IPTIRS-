import React from 'react';
import { Kpi } from '../types';

interface KpiCardProps {
  kpi: Kpi;
}

const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => (
  <section className="bg-brand-secondary p-5 rounded-lg shadow-lg border border-brand-light min-w-0">
    <p className="text-brand-text-secondary text-sm font-medium">{kpi.title}</p>
    <p className="text-3xl font-bold text-white my-2">{kpi.value}</p>
    <p className="text-sm font-semibold text-amber-200">{kpi.change}</p>
    <p className="text-xs text-brand-text-secondary mt-2">{kpi.description}</p>
  </section>
);

export default KpiCard;
