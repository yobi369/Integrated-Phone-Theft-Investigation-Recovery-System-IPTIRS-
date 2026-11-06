
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

export interface AiInsight {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  type: 'Pattern' | 'Prediction' | 'Alert';
}

// New types for Gemini Interaction
export interface TacticalResponse {
  analysis: string;
  target_coordinates?: {
    lat: number;
    lng: number;
    location_name: string;
  };
  signal_strength?: number;
  recommended_action: string;
  identified_suspects?: string[];
}
