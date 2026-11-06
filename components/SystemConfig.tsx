import React from 'react';

const SystemConfig: React.FC = () => (
  <section className="max-w-4xl mx-auto space-y-6">
    <div className="border-b border-brand-light pb-4">
      <h2 className="text-2xl font-black text-white uppercase tracking-wider">Platform Configuration</h2>
      <p className="text-brand-text-secondary text-sm mt-2">Prototype configuration — identity, integrations, and policy controls are not yet connected.</p>
    </div>

    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5">
      <h3 className="font-bold text-amber-200">Institutional controls are not active</h3>
      <p className="text-sm text-amber-100/90 mt-2">
        This screen does not authenticate an officer, verify a clearance level, change retention settings,
        or connect to any government or operator endpoint. Do not enter credentials, personal data,
        API keys, or real case information here.
      </p>
    </div>

    <div className="bg-brand-secondary p-6 rounded-lg border border-brand-light space-y-3">
      <h3 className="text-lg font-bold text-white">Controls required before a pilot</h3>
      <ul className="list-disc pl-5 space-y-2 text-sm text-brand-text-secondary">
        <li>Institution-approved identity provider, MFA, and role provisioning.</li>
        <li>Organization-level access policies and separation of duties.</li>
        <li>Approved retention schedule, legal holds, and deletion workflow.</li>
        <li>Partner-specific integration configuration managed outside the browser.</li>
        <li>Audit logging, key management, backup, and incident-response controls.</li>
      </ul>
    </div>
  </section>
);

export default SystemConfig;
