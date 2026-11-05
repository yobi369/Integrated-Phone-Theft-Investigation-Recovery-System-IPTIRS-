
import React from 'react';
import { AiInsight } from '../types';

interface AiInsightsProps {
    insights: AiInsight[];
}

const getInsightTypeStyles = (type: AiInsight['type']) => {
    switch (type) {
        case 'Pattern':
            return {
                icon: '🧠',
                color: 'border-blue-500'
            };
        case 'Prediction':
            return {
                icon: '🔮',
                color: 'border-purple-500'
            };
        case 'Alert':
            return {
                icon: '❗',
                color: 'border-red-500'
            };
    }
};

const AiInsights: React.FC<AiInsightsProps> = ({ insights }) => {
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">AI-Powered Insights</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {insights.map(insight => {
                    const { icon, color } = getInsightTypeStyles(insight.type);
                    return (
                        <div key={insight.id} className={`p-4 bg-brand-dark rounded-lg border-l-4 ${color}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-brand-accent">
                                        <span className="mr-2">{icon}</span>
                                        {insight.title}
                                    </p>
                                    <p className="text-sm text-brand-text mt-1">{insight.content}</p>
                                </div>
                                <span className="text-xs text-brand-text-secondary flex-shrink-0 ml-4">{insight.timestamp}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AiInsights;
