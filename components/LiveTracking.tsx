import React from 'react';

const LiveTracking: React.FC = () => (
  <section className="max-w-4xl mx-auto space-y-6">
    <div>
      <h2 className="text-2xl font-black text-white uppercase tracking-wider">Location & Operator Requests</h2>
      <p className="text-brand-text-secondary text-sm mt-2">
        Controlled workflow for recording properly authorized requests and responses.
      </p>
    </div>

    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5">
      <p className="font-bold text-amber-200">No live device tracking is connected</p>
      <p className="text-sm text-amber-100/90 mt-2 leading-relaxed">
        This prototype has no access to mobile-network location services, cell-site records,
        subscriber databases, or device telemetry. It cannot locate or track a phone.
        The previous map markers were generated from sample case locations and did not
        represent a device's position.
      </p>
    </div>

    <div className="bg-brand-secondary rounded-lg border border-brand-light p-6 space-y-3">
      <h3 className="text-lg font-bold text-white">Planned authorized-request workflow</h3>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-brand-text-secondary">
        <li>Link the request to a verified case and requesting organization.</li>
        <li>Record the specific purpose, scope, legal authority reference, and validity period.</li>
        <li>Capture independent approval by an authorized reviewer.</li>
        <li>Submit only through an approved operator channel after partner onboarding.</li>
        <li>Record the operator's decision and response reference with a complete audit trail.</li>
      </ol>
      <p className="text-xs text-brand-text-secondary border-t border-brand-light pt-3">
        No location or subscriber data is requested or disclosed by this screen.
      </p>
    </div>
  </section>
);

export default LiveTracking;
