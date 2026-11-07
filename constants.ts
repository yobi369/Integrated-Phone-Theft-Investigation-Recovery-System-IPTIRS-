import { Case, CaseStatus, Kpi } from './types';

// Synthetic dashboard values for layout development only.
// Never present these as operational, institutional, or measured statistics.
export const MOCK_KPIS: Kpi[] = [
  { title: 'Recovery outcomes', value: '—', change: 'Not measured', description: 'No verified dataset connected' },
  { title: 'Authorized requests', value: '—', change: 'Not connected', description: 'No institutional workflow enabled' },
  { title: 'Case processing time', value: '—', change: 'Not measured', description: 'No operational data' },
  { title: 'Verified devices', value: '—', change: 'Not measured', description: 'No verified ownership records' },
];

// Synthetic records used only to preview the interface.
export const MOCK_CASES: Case[] = [
  { id: 'DEMO-001', device: 'Sample smartphone', type: 'Phone', owner: 'Sample user A', location: 'Sample location', reportedAt: 'Demo record', status: CaseStatus.Active, priority: 'High' },
  { id: 'DEMO-002', device: 'Sample laptop', type: 'Laptop', owner: 'Sample organization', location: 'Sample location', reportedAt: 'Demo record', status: CaseStatus.Pending, priority: 'Medium' },
  { id: 'DEMO-003', device: 'Sample smartphone', type: 'Phone', owner: 'Sample user B', location: 'Sample location', reportedAt: 'Demo record', status: CaseStatus.Recovered, priority: 'Low' },
];

