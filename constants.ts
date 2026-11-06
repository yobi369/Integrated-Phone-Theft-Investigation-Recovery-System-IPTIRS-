import { Case, CaseStatus, Kpi, AiInsight } from './types';

// Synthetic dashboard values for layout development only.
// Never present these as operational, institutional, or measured statistics.
export const MOCK_KPIS: Kpi[] = [
  { title: 'Demo recovery rate', value: '—', target: 0, change: 'Not measured', changeType: 'increase', description: 'No verified dataset connected' },
  { title: 'Location requests', value: '—', target: 0, change: 'Not connected', changeType: 'increase', description: 'No telecom integration' },
  { title: 'Response time', value: '—', target: 0, change: 'Not measured', changeType: 'increase', description: 'No operational data' },
  { title: 'Assets recovered', value: '—', target: 0, change: 'Not measured', changeType: 'increase', description: 'No verified outcomes' },
];

// Synthetic records used only to preview the interface.
export const MOCK_CASES: Case[] = [
  { id: 'DEMO-001', device: 'Sample smartphone', type: 'Phone', owner: 'Sample user A', location: 'Sample location', reportedAt: 'Demo record', status: CaseStatus.Active, priority: 'High' },
  { id: 'DEMO-002', device: 'Sample laptop', type: 'Laptop', owner: 'Sample organization', location: 'Sample location', reportedAt: 'Demo record', status: CaseStatus.Pending, priority: 'Medium' },
  { id: 'DEMO-003', device: 'Sample smartphone', type: 'Phone', owner: 'Sample user B', location: 'Sample location', reportedAt: 'Demo record', status: CaseStatus.Recovered, priority: 'Low' },
];

// Real AI-generated intelligence is not enabled. Never populate this array with
// fabricated suspects, tracking signals, locations, or investigative alerts.
export const MOCK_AI_INSIGHTS: AiInsight[] = [];
