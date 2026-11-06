
export enum CaseStatus {
  Active = 'Active',
  Pending = 'Pending',
  Recovered = 'Recovered',
  Closed = 'Closed',
}

export interface Case {
  id: string;
  device: string;
  type: 'Phone' | 'Laptop' | 'Tablet';
  owner: string;
  location: string;
  reportedAt: string;
  status: CaseStatus;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Kpi {
  title: string;
  value: string;
  change: string;
  description: string;
}

