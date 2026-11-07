import React from 'react';

const Forensics: React.FC = () => (
  <section className="max-w-4xl mx-auto space-y-6">
    <div>
      <h2 className="text-2xl font-black text-white uppercase tracking-wider">Reporting & Analytics</h2>
      <p className="text-sm text-brand-text-secondary mt-2">Operational reporting will be enabled when verified case data is available.</p>
    </div>
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5">
      <h3 className="font-bold text-amber-200">No verified analytics dataset connected</h3>
      <p className="text-sm text-amber-100/90 mt-2 leading-relaxed">
        The previous charts contained invented regional incident counts, recovery rates, and trend claims.
        They have been removed so that sample figures cannot be mistaken for official statistics or forensic findings.
      </p>
    </div>
    <div className="bg-brand-secondary rounded-lg border border-brand-light p-6">
      <h3 className="font-bold text-white mb-3">Planned reporting dimensions</h3>
      <ul className="list-disc pl-5 space-y-2 text-sm text-brand-text-secondary">
        <li>Reports received, verified, referred, and closed by reporting period.</li>
        <li>Case processing times and outstanding workload.</li>
        <li>Recovery outcomes backed by recorded confirmation.</li>
        <li>Evidence completeness and chain-of-custody exceptions.</li>
        <li>Authorized request turnaround and response status.</li>
      </ul>
      <p className="text-xs text-brand-text-secondary border-t border-brand-light mt-4 pt-4">
        Any future report must show its source, date range, definitions, and data-quality limitations.
      </p>
    </div>
  </section>
);

export default Forensics;
