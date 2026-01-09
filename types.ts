
export interface RawInsight {
  end_year: string | number;
  intensity: string | number;
  sector: string;
  topic: string;
  insight: string;
  url: string;
  region: string;
  start_year: string | number;
  impact: string | number;
  added: string;
  published: string;
  country: string;
  relevance: string | number;
  pestle: string;
  source: string;
  title: string;
  likelihood: string | number;
}

export interface Insight {
  _id?: string;
  end_year: number | null;
  intensity: number | null;
  sector: string;
  topic: string;
  insight: string;
  url: string;
  region: string;
  start_year: number | null;
  impact: number | null;
  added: string;
  published: string;
  country: string;
  relevance: number | null;
  pestle: string;
  source: string;
  title: string;
  likelihood: number | null;
}

export interface FilterState {
  end_year: string;
  topic: string;
  sector: string;
  region: string;
  pestle: string;
  source: string;
  swot: string;
  country: string;
  city: string;
  search?: string;
}

export interface FilterOptions {
  end_year: (string | number)[];
  topic: string[];
  sector: string[];
  region: string[];
  pestle: string[];
  source: string[];
  swot: string[];
  country: string[];
  city: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
}
