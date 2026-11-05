
import React from 'react';

const SystemConfig: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
             <div className="border-b border-brand-light pb-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">System Configuration</h2>
                <p className="text-brand-text-secondary text-sm">Clearance Level: Admin (SGT. Kiprop)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Profile */}
                <div className="bg-brand-secondary p-6 rounded-lg border border-brand-light shadow-lg">
                    <h3 className="text-lg font-bold text-brand-accent mb-4 uppercase">Officer Profile</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">Service Number</label>
                            <input type="text" value="KE-POL-8821" disabled className="w-full bg-brand-dark border border-brand-light rounded p-2 text-white opacity-50 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">Station Assignment</label>
                            <select className="w-full bg-brand-dark border border-brand-light rounded p-2 text-white focus:border-brand-accent focus:outline-none">
                                <option>Central Police Station, Nairobi</option>
                                <option>Kilimani Police Station</option>
                                <option>Nyali Police Station, Mombasa</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-brand-secondary p-6 rounded-lg border border-brand-light shadow-lg">
                    <h3 className="text-lg font-bold text-brand-accent mb-4 uppercase">Alert Protocols</h3>
                    <div className="space-y-4">
                         <div className="flex items-center justify-between p-3 bg-brand-dark rounded border border-brand-light">
                             <div>
                                 <p className="text-sm font-bold text-white">High Priority Alerts</p>
                                 <p className="text-xs text-brand-text-secondary">Push notifications for ongoing thefts</p>
                             </div>
                             <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
                                 <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                             </div>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-brand-dark rounded border border-brand-light">
                             <div>
                                 <p className="text-sm font-bold text-white">Silent Alarm Mode</p>
                                 <p className="text-xs text-brand-text-secondary">Suppress audio cues in field ops</p>
                             </div>
                             <div className="w-10 h-5 bg-gray-600 rounded-full relative cursor-pointer">
                                 <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* System Parameters */}
                <div className="bg-brand-secondary p-6 rounded-lg border border-brand-light shadow-lg md:col-span-2">
                    <h3 className="text-lg font-bold text-brand-accent mb-4 uppercase">Operational Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">Data Retention Period (Days)</label>
                             <input type="number" value="90" className="w-full bg-brand-dark border border-brand-light rounded p-2 text-white focus:border-brand-accent focus:outline-none" />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">Signal Triangulation Interval (sec)</label>
                             <input type="number" value="30" className="w-full bg-brand-dark border border-brand-light rounded p-2 text-white focus:border-brand-accent focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">Authorized IMEI Blacklist API Endpoint</label>
                             <input type="text" value="https://api.police.go.ke/v2/imei-registry" className="w-full bg-brand-dark border border-brand-light rounded p-2 text-white focus:border-brand-accent focus:outline-none font-mono text-sm" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="bg-brand-accent hover:bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase tracking-wider transition-colors">
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemConfig;
