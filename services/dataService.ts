import { rawData } from '../data/rawData';
import { Insight, FilterState, RawInsight, FilterOptions, ApiResponse } from '../types';

// Configuration
const USE_BACKEND_API = true; // Backend is running with MongoDB
const API_BASE_URL = 'http://localhost:5000/api';

const buildQueryString = (filters: FilterState): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value.trim() !== '') params.append(key, value);
  });
  return params.toString();
};

const fetchFromAPI = async (filters: FilterState): Promise<Insight[]> => {
  const queryString = buildQueryString(filters);
  const url = `${API_BASE_URL}/data${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const result: ApiResponse<Insight[]> = await response.json();
    if (!result.success) throw new Error(result.message || 'API error');
    return result.data;
  } catch (error) {
    console.warn('API failed, using local data:', error);
    return fetchFromLocal(filters);
  }
};

const fetchFiltersFromAPI = async (): Promise<FilterOptions> => {
  try {
    const response = await fetch(`${API_BASE_URL}/filters`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const result = await response.json();
    return result.filters;
  } catch {
    return getLocalFilterOptions();
  }
};

const cleanData = (data: RawInsight[]): Insight[] => {
  return data.map((item) => ({
    ...item,
    end_year: item.end_year === "" ? null : Number(item.end_year),
    start_year: item.start_year === "" ? null : Number(item.start_year),
    intensity: item.intensity === "" ? null : Number(item.intensity),
    impact: item.impact === "" ? null : Number(item.impact),
    relevance: item.relevance === "" ? null : Number(item.relevance),
    likelihood: item.likelihood === "" ? null : Number(item.likelihood),
    sector: String(item.sector || ""),
    topic: String(item.topic || ""),
    region: String(item.region || ""),
    pestle: String(item.pestle || ""),
    source: String(item.source || ""),
    country: String(item.country || ""),
    title: String(item.title || ""),
    insight: String(item.insight || "")
  }));
};

const db = cleanData(rawData);

const fetchFromLocal = async (filters: FilterState): Promise<Insight[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = db.filter((item) => {
        let isValid = true;
        if (filters.end_year && item.end_year !== Number(filters.end_year)) isValid = false;
        if (filters.topic && item.topic !== filters.topic) isValid = false;
        if (filters.sector && item.sector !== filters.sector) isValid = false;
        if (filters.region && item.region !== filters.region) isValid = false;
        if (filters.pestle && item.pestle !== filters.pestle) isValid = false;
        if (filters.source && item.source !== filters.source) isValid = false;
        if (filters.country && item.country !== filters.country) isValid = false;

        if (isValid && filters.search) {
          const query = filters.search.toLowerCase();
          const matchesSearch = 
            item.title.toLowerCase().includes(query) ||
            item.insight.toLowerCase().includes(query) ||
            item.sector.toLowerCase().includes(query) ||
            item.topic.toLowerCase().includes(query) ||
            item.region.toLowerCase().includes(query) ||
            item.country.toLowerCase().includes(query) ||
            item.source.toLowerCase().includes(query);
          if (!matchesSearch) isValid = false;
        }
        return isValid;
      });
      resolve(result);
    }, 100);
  });
};

const getLocalFilterOptions = (): FilterOptions => {
  const getUnique = <T>(field: keyof Insight): T[] => {
    const unique = new Set(db.map(item => item[field]).filter(val => val !== null && val !== ""));
    return Array.from(unique).sort() as T[];
  };

  return {
    end_year: getUnique('end_year'),
    topic: getUnique('topic'),
    sector: getUnique('sector'),
    region: getUnique('region'),
    pestle: getUnique('pestle'),
    source: getUnique('source'),
    swot: [],
    country: getUnique('country'),
    city: []
  };
};

export const fetchData = async (filters: FilterState): Promise<Insight[]> => {
  return USE_BACKEND_API ? fetchFromAPI(filters) : fetchFromLocal(filters);
};

export const getFilterOptions = async (): Promise<FilterOptions> => {
  return USE_BACKEND_API ? fetchFiltersFromAPI() : getLocalFilterOptions();
};

export const getUniqueValues = (field: keyof Insight): (string | number)[] => {
  const unique = new Set(db.map(item => item[field]).filter(val => val !== null && val !== ""));
  return Array.from(unique).sort() as (string | number)[];
};

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};