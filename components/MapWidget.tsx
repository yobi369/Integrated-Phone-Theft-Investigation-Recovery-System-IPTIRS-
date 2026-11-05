
import React from 'react';

interface MapWidgetProps {
  activeCoordinates?: {
    lat: number;
    lng: number;
    location_name: string;
  };
  className?: string;
}

// Using a reliable high-res aerial city night shot to simulate spy satellite view
const MAP_IMAGE_URL = "https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

const MapWidget: React.FC<MapWidgetProps> = ({ activeCoordinates, className = "h-[400px]" }) => {
  return (
    <div className={`bg-brand-secondary rounded-lg shadow-lg flex flex-col overflow-hidden relative border border-brand-light group min-h-[400px] ${className}`}>
      <div className="absolute inset-0 z-0 bg-gray-900">
        <img 
            src={MAP_IMAGE_URL}
            alt="Satellite Feed" 
            className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700 ease-in-out scale-110 group-hover:scale-100" 
        />
        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary via-transparent to-transparent opacity-50"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between p-4 pointer-events-none">
          <div className="flex justify-between items-start">
             <div className="bg-brand-dark/90 backdrop-blur-md px-4 py-2 rounded-sm border-l-4 border-brand-accent shadow-lg">
                 <h3 className="text-sm font-black text-white tracking-[0.2em] mb-1">LIVE SAT-FEED</h3>
                 <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] text-brand-text-secondary font-mono">SECTOR: {activeCoordinates ? activeCoordinates.location_name.toUpperCase() : 'NAIROBI-METRO'}</p>
                 </div>
             </div>
             <div className="flex flex-col items-end space-y-1">
                 <div className="flex items-center space-x-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                     <div className="text-[10px] text-red-400 font-mono font-bold">REC</div>
                 </div>
                 <div className="text-[9px] text-brand-text-secondary font-mono">ENC: AES-256</div>
             </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
             {/* Dynamic Target Marker if AI provided coordinates */}
             {activeCoordinates ? (
                <div className="relative flex items-center justify-center">
                    <div className="w-32 h-32 border border-brand-accent/30 rounded-full animate-[ping_3s_ease-in-out_infinite] absolute"></div>
                    <div className="w-48 h-48 border border-brand-accent/10 rounded-full animate-[ping_4s_ease-in-out_infinite] absolute"></div>
                    
                    {/* Crosshair */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute inset-0 border-2 border-red-500/80 rounded-sm"></div>
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-red-500"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-red-500"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-red-500"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-red-500"></div>
                        
                        <div className="w-1 h-3 bg-red-500 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                        <div className="w-1 h-3 bg-red-500 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
                        <div className="w-3 h-1 bg-red-500 absolute left-0 top-1/2 transform -translate-y-1/2"></div>
                        <div className="w-3 h-1 bg-red-500 absolute right-0 top-1/2 transform -translate-y-1/2"></div>
                        <div className="w-1 h-1 bg-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                    </div>

                    <div className="absolute top-14 bg-brand-dark/90 text-red-400 text-[10px] font-mono px-3 py-1 rounded border border-red-500/50 whitespace-nowrap shadow-lg flex flex-col items-center">
                        <span className="font-bold tracking-wider">TARGET LOCKED</span>
                        <span className="text-white text-[9px]">{activeCoordinates.lat.toFixed(4)}, {activeCoordinates.lng.toFixed(4)}</span>
                    </div>
                </div>
             ) : (
                <div className="opacity-50">
                     {/* Idle Crosshairs */}
                     <svg className="w-16 h-16 text-brand-accent/50 animate-spin-slow" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                         <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1" />
                         <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1" />
                     </svg>
                </div>
             )}
          </div>

          <div className="flex justify-between items-end">
              <div className="font-mono text-[10px] text-brand-accent bg-brand-dark/90 backdrop-blur px-2 py-1 rounded border border-brand-accent/20 shadow-lg">
                  <div className="flex flex-col">
                      <span>LAT: {activeCoordinates ? activeCoordinates.lat.toFixed(6) : '-1.292100'} S</span>
                      <span>LNG: {activeCoordinates ? activeCoordinates.lng.toFixed(6) : '36.821900'} E</span>
                      <span className="text-brand-text-secondary mt-1">ALT: 1,680m ASL</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MapWidget;
