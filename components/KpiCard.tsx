
import React from 'react';
import { Kpi } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface KpiCardProps {
  kpi: Kpi;
}

const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => {
  const isIncrease = kpi.changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-400' : 'text-red-400';
  const data = [{ name: kpi.title, value: kpi.target, fill: '#3b82f6' }];
  
  const isTargetInverted = kpi.title.includes('Resolution'); // lower is better
  const displayedTarget = isTargetInverted ? (100 - kpi.target) : kpi.target;
  const dataInverted = [{ name: kpi.title, value: displayedTarget, fill: '#3b82f6' }];


  return (
    <div className="bg-brand-secondary p-5 rounded-lg shadow-lg flex justify-between items-center transform hover:scale-105 transition-transform duration-300">
      <div className="flex-1">
        <p className="text-brand-text-secondary text-sm font-medium">{kpi.title}</p>
        <p className="text-3xl font-bold text-white my-1">{kpi.value}</p>
        <div className="flex items-center text-sm">
          <span className={`${changeColor} font-semibold`}>{kpi.change}</span>
          <span className="text-brand-text-secondary ml-2">{kpi.description}</span>
        </div>
      </div>
      <div className="w-20 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            innerRadius="70%" 
            outerRadius="100%" 
            data={isTargetInverted ? dataInverted : data}
            startAngle={90} 
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#4a5568' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default KpiCard;
