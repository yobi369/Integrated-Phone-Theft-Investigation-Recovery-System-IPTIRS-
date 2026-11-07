import React from 'react';

interface MapWidgetProps {
  className?: string;
}

const MapWidget: React.FC<MapWidgetProps> = ({ className = "h-[260px]" }) => (
  <section className={`bg-brand-secondary rounded-lg border border-brand-light p-5 flex flex-col justify-center min-h-[220px] ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 rounded-full bg-amber-400" />
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Map integration not connected</h3>
    </div>
    <p className="text-sm text-brand-text-secondary leading-relaxed">
      No live location feed, satellite imagery, or device coordinates are available in this prototype.
      A future map may display only verified, authorized location records with source, timestamp,
      accuracy, and access authorization clearly identified.
    </p>
  </section>
);

export default MapWidget;
