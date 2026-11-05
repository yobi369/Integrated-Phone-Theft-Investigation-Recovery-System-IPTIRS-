
import { Case, CaseStatus, Kpi, AiInsight } from './types';

export const MOCK_KPIS: Kpi[] = [
  {
    title: 'Recovery Rate',
    value: '91.4%',
    target: 85,
    change: '+4.2%',
    changeType: 'increase',
    description: 'Nairobi Region',
  },
  {
    title: 'Signal Triangulation',
    value: '12m',
    target: 80, // inverted concept for UI, represents accuracy
    change: '-3m',
    changeType: 'increase', // effectively better
    description: 'Avg Accuracy Radius',
  },
  {
    title: 'Unit Response Time',
    value: '14 min',
    target: 60,
    change: '-2 min',
    changeType: 'increase',
    description: 'Urban Zones',
  },
  {
    title: 'Asset Value Secured',
    value: 'KSh 4.2M',
    target: 50,
    change: '+12%',
    changeType: 'increase',
    description: 'This Week',
  },
];

export const MOCK_CASES: Case[] = [
  {
    id: 'KNB-2994-A',
    device: 'iPhone 15 Pro Max',
    type: 'Phone',
    owner: 'G. Kamau',
    location: 'Westlands, Nairobi',
    reportedAt: '45 mins ago',
    status: CaseStatus.Active,
    priority: 'High',
  },
  {
    id: 'KNB-2993-C',
    device: 'MacBook Pro M3',
    type: 'Laptop',
    owner: 'TechSolutions Ltd',
    location: 'Kilimani, Nairobi',
    reportedAt: '3 hours ago',
    status: CaseStatus.Active,
    priority: 'High',
  },
  {
    id: 'KMSA-1042',
    device: 'Samsung S24 Ultra',
    type: 'Phone',
    owner: 'A. Otieno',
    location: 'Nyali, Mombasa',
    reportedAt: '1 day ago',
    status: CaseStatus.Pending,
    priority: 'Medium',
  },
    {
    id: 'KNB-2990',
    device: 'Dell XPS 15',
    type: 'Laptop',
    owner: 'University of Nairobi',
    location: 'CBD, Nairobi',
    reportedAt: '2 days ago',
    status: CaseStatus.Pending,
    priority: 'Medium',
  },
  {
    id: 'KSM-0551',
    device: 'Google Pixel 8',
    type: 'Phone',
    owner: 'L. Wanjiku',
    location: 'Milimani, Kisumu',
    reportedAt: '5 days ago',
    status: CaseStatus.Recovered,
    priority: 'Low',
  },
];

export const MOCK_AI_INSIGHTS: AiInsight[] = [
    {
        id: 'INTEL-01',
        title: 'IMEI Cloning Ring',
        content: 'Pattern match detected: 15 devices reported in River Road area share similar IMEI spoofing signatures. Recommend undercover surveillance.',
        timestamp: 'LIVE',
        type: 'Alert'
    },
    {
        id: 'INTEL-02',
        title: 'Hotspot Prediction',
        content: 'Historical data indicates 85% probability of increased laptop theft in CBD cafes between 12:00 - 14:00 today.',
        timestamp: '15 mins ago',
        type: 'Prediction'
    },
    {
        id: 'INTEL-03',
        title: 'Cross-Border Movement',
        content: 'Tracking ID KNB-2993-C indicates movement towards Namanga border. Alert border patrol units immediately.',
        timestamp: '1 hour ago',
        type: 'Pattern'
    },
    {
        id: 'INTEL-04',
        title: 'Signal Intercept',
        content: 'Unregistered GSM relay detected in Eastleigh Sector 3. Potential fencing operation base.',
        timestamp: '3 hours ago',
        type: 'Pattern'
    }
];
