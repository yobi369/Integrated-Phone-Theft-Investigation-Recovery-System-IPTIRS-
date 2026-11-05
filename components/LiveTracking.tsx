
import React, { useState } from 'react';
import MapWidget from './MapWidget';
import { MOCK_CASES } from '../constants';
import { CaseStatus } from '../types';

const LiveTracking: React.FC = () => {
    // Default to the first active case
    const activeCases = MOCK_CASES.filter(c => c.status === CaseStatus.Active || c.priority === 'High');
    const [selectedCaseId, setSelectedCaseId] = useState<string>(activeCases[0]?.id || '');

    const selectedCase = activeCases.find(c => c.id === selectedCaseId);

    // Simulate coordinates based on location string (simple mock mapping)
    const getCoordinates = (location: string) => {
        if (location.includes('Westlands')) return { lat: -1.2631, lng: 36.8028, location_name: location };
        if (location.includes('Kilimani')) return { lat: -1.2921, lng: 36.7865, location_name: location };
        if (location.includes('Mombasa')) return { lat: -4.0435, lng: 39.6682, location_name: location };
        if (location.includes('CBD')) return { lat: -1.2864, lng: 36.8172, location_name: location };
        return { lat: -1.2921, lng: 36.8219, location_name: location }; // Default Nairobi
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 min-h-[600px]">
            <div className="w-full md:w-80 bg-brand-secondary rounded-lg border border-brand-light flex flex-col overflow-hidden shadow-xl shrink-0">
                <div className="p-4 bg-brand-dark/50 border-b border-brand-light">
                    <h3 className="font-bold text-white uppercase tracking-wider flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                        Active Signals ({activeCases.length})
                    </h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {activeCases.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => setSelectedCaseId(c.id)}
                            className={`p-3 rounded cursor-pointer border transition-all ${
                                selectedCaseId === c.id 
                                ? 'bg-brand-accent/20 border-brand-accent shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                : 'bg-brand-dark/30 border-transparent hover:bg-brand-light/20 hover:border-brand-light'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-mono text-xs text-brand-accent">{c.id}</span>
                                <span className="text-[10px] text-red-400 font-bold uppercase">{c.priority} Priority</span>
                            </div>
                            <h4 className="font-bold text-white text-sm">{c.device}</h4>
                            <p className="text-xs text-brand-text-secondary mt-1 flex items-center">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1"></span>
                                {c.location}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col rounded-lg overflow-hidden shadow-2xl border border-brand-light">
                <div className="bg-brand-secondary p-3 border-b border-brand-light flex justify-between items-center z-10 relative">
                     <h2 className="text-sm font-bold text-brand-text-secondary uppercase flex items-center">
                        <span className="mr-2">📡</span>
                        Target Zone: <span className="text-white ml-2">{selectedCase?.location || 'NAIROBI'}</span>
                     </h2>
                     <div className="flex space-x-4 text-xs font-mono text-brand-text-secondary">
                         <span className="flex items-center"><span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span>LIVE</span>
                         <span>ZOOM: 124%</span>
                         <span>FILTER: INFRARED</span>
                     </div>
                </div>
                {/* 
                  Passing flex-1 to MapWidget ensures it fills the column. 
                  Added min-h to MapWidget internal div to prevent collapse if flex fails. 
                */}
                <MapWidget 
                    activeCoordinates={selectedCase ? getCoordinates(selectedCase.location) : undefined} 
                    className="flex-1 rounded-none border-none"
                />
            </div>
        </div>
    );
};

export default LiveTracking;
