
import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Legend
} from 'recharts';
import { fetchData } from '../services/dataService';
import { Insight, FilterState } from '../types';
import FilterBar from './FilterBar';
import D3BarChart from './D3BarChart';
import D3PieChart from './D3PieChart';

const COLORS = {
  primary: '#7367F0',
  secondary: '#A8AAAE',
  success: '#28C76F',
  danger: '#EA5455',
  warning: '#FF9F43',
  info: '#00CFE8',
  dark: '#4B4B4B',
  grey: '#EBE9F1',
  purpleLight: '#E8E7FD',
  barBackground: '#F8F8F8'
};

const DONUT_COLORS = [COLORS.primary, COLORS.warning, COLORS.success, COLORS.info, COLORS.danger, COLORS.secondary];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow-card border border-border-color text-xs min-w-[150px] z-50">
        <p className="font-semibold text-txt-main mb-2 border-b border-gray-100 pb-1">
          {label || payload[0].payload.name || 'Details'}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-txt-muted capitalize">{entry.name}:</span>
            </div>
            <span className="font-bold text-txt-main">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  searchTerm: string;
}

const Dashboard: React.FC<DashboardProps> = ({ searchTerm }) => {
  const [data, setData] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>({
    end_year: '', topic: '', sector: '', region: '', pestle: '', source: '', swot: '', country: '', city: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Merge local filters with the global search term
      const result = await fetchData({ ...filters, search: searchTerm });
      setData(result);
      setLoading(false);
    };
    loadData();
  }, [filters, searchTerm]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFilters({
      end_year: '', topic: '', sector: '', region: '', pestle: '', source: '', swot: '', country: '', city: ''
    });
  };

  // --- Data Processing for Visuals ---

  // 1. Area Chart: Intensity trends over years
  const intensityTrends = Object.values(data.reduce((acc, item) => {
    const year = item.end_year || item.start_year;
    if (year) {
      if (!acc[year]) acc[year] = { year, intensity: 0, count: 0, likelihood: 0 };
      acc[year].intensity += item.intensity || 0;
      acc[year].likelihood += item.likelihood || 0;
      acc[year].count += 1;
    }
    return acc;
  }, {} as Record<string, any>))
  .map((d: any) => ({
    year: d.year,
    Intensity: +(d.intensity / d.count).toFixed(1),
    Likelihood: +(d.likelihood / d.count).toFixed(1)
  }))
  .sort((a, b) => a.year - b.year);

  // 2. Bar Chart: Sector Analysis (Intensity vs Relevance)
  const sectorAnalysis = Object.values(data.reduce((acc, item) => {
    const sector = item.sector || 'Unspecified';
    if (!acc[sector]) acc[sector] = { name: sector, intensity: 0, relevance: 0, count: 0 };
    acc[sector].intensity += item.intensity || 0;
    acc[sector].relevance += item.relevance || 0;
    acc[sector].count += 1;
    return acc;
  }, {} as Record<string, any>))
  .map((d: any) => ({
    name: d.name,
    Intensity: +(d.intensity / d.count).toFixed(1),
    Relevance: +(d.relevance / d.count).toFixed(1)
  }))
  .sort((a, b) => b.Intensity - a.Intensity)
  .slice(0, 10); // Top 10 sectors

  // 3. Scatter Chart: Topic Impact (Intensity x Likelihood x Relevance)
  const topicScatter = Object.values(data.reduce((acc, item) => {
    const topic = item.topic || 'Unspecified';
    if (!acc[topic]) acc[topic] = { name: topic, intensity: 0, likelihood: 0, relevance: 0, count: 0 };
    acc[topic].intensity += item.intensity || 0;
    acc[topic].likelihood += item.likelihood || 0;
    acc[topic].relevance += item.relevance || 0;
    acc[topic].count += 1;
    return acc;
  }, {} as Record<string, any>))
  .map((d: any) => ({
    name: d.name,
    x: +(d.intensity / d.count).toFixed(1),
    y: +(d.likelihood / d.count).toFixed(1),
    z: +(d.relevance / d.count).toFixed(1),
  }))
  .filter(d => d.x > 0 && d.y > 0)
  .slice(0, 20);

  // 4. Donut Chart: Region Distribution
  const regionStats = Object.values(data.reduce((acc, item) => {
    const region = item.region || 'Unknown';
    if (!acc[region]) acc[region] = { name: region, value: 0 };
    acc[region].value += 1;
    return acc;
  }, {} as Record<string, any>))
  .sort((a, b) => b.value - a.value)
  .slice(0, 6);

  // 5. Radar Chart: PESTLE Analysis
  const pestleRadar = Object.values(data.reduce((acc, item) => {
    const pestle = item.pestle || 'Other';
    if (!acc[pestle]) acc[pestle] = { subject: pestle, A: 0, count: 0 };
    acc[pestle].A += item.intensity || 0;
    acc[pestle].count += 1;
    return acc;
  }, {} as Record<string, any>))
  .map((d: any) => ({
    subject: d.subject,
    A: +(d.A / d.count).toFixed(1),
    fullMark: 10
  }))
  .filter(d => d.subject !== 'Other');

  // 6. Horizontal Bar: Top Countries by Intensity
  const countryStats = Object.values(data.reduce((acc, item) => {
    const country = item.country || 'Unknown';
    if (!acc[country]) acc[country] = { name: country, value: 0 };
    acc[country].value += item.intensity || 0;
    return acc;
  }, {} as Record<string, any>))
  .sort((a, b) => b.value - a.value)
  .slice(0, 8);

  // KPI Card Calculations
  const totalInsights = data.length;
  const avgIntensity = totalInsights ? (data.reduce((acc, curr) => acc + (curr.intensity || 0), 0) / totalInsights).toFixed(1) : 0;
  const avgRelevance = totalInsights ? (data.reduce((acc, curr) => acc + (curr.relevance || 0), 0) / totalInsights).toFixed(1) : 0;
  const avgLikelihood = totalInsights ? (data.reduce((acc, curr) => acc + (curr.likelihood || 0), 0) / totalInsights).toFixed(1) : 0;

  return (
    <div className="space-y-6 pb-6">
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />

      {/* 1. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-card shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider">Total Insights</p>
              <h3 className="text-2xl font-bold text-txt-main mt-1">{totalInsights}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-card shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider">Avg Intensity</p>
              <h3 className="text-2xl font-bold text-txt-main mt-1">{avgIntensity}</h3>
            </div>
            <div className="p-2 bg-danger/10 rounded text-danger">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider">Avg Likelihood</p>
              <h3 className="text-2xl font-bold text-txt-main mt-1">{avgLikelihood}</h3>
            </div>
            <div className="p-2 bg-warning/10 rounded text-warning">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path></svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider">Avg Relevance</p>
              <h3 className="text-2xl font-bold text-txt-main mt-1">{avgRelevance}</h3>
            </div>
            <div className="p-2 bg-success/10 rounded text-success">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Intensity over Time */}
        <div className="bg-white p-6 rounded-card shadow-card lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-txt-main">Intensity Trend</h3>
            <p className="text-sm text-txt-muted">Average intensity and likelihood over years</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intensityTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLikelihood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.info} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grey} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: COLORS.secondary, fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: COLORS.secondary, fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="Intensity" stroke={COLORS.primary} strokeWidth={3} fill="url(#colorIntensity)" />
                <Area type="monotone" dataKey="Likelihood" stroke={COLORS.info} strokeWidth={3} fill="url(#colorLikelihood)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart: PESTLE Analysis */}
        <div className="bg-white p-6 rounded-card shadow-card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-txt-main">PESTLE Analysis</h3>
            <p className="text-sm text-txt-muted">Average Intensity by Factor</p>
          </div>
          <div className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pestleRadar}>
                <PolarGrid stroke={COLORS.grey} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.secondary, fontSize: 11 }} />
                <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                <Radar name="Intensity" dataKey="A" stroke={COLORS.primary} strokeWidth={2} fill={COLORS.primary} fillOpacity={0.4} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Sector Analysis */}
        <div className="bg-white p-6 rounded-card shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-txt-main">Sector Performance</h3>
              <p className="text-sm text-txt-muted">Intensity vs Relevance by Sector</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorAnalysis} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grey} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: COLORS.secondary, fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={70} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: COLORS.secondary, fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: COLORS.grey, opacity: 0.1}} />
                <Bar dataKey="Intensity" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Relevance" fill={COLORS.warning} radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Chart: Topic Impact */}
        <div className="bg-white p-6 rounded-card shadow-card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-txt-main">Topic Impact Matrix</h3>
            <p className="text-sm text-txt-muted">X: Intensity, Y: Likelihood, Z: Relevance</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grey} />
                <XAxis type="number" dataKey="x" name="Intensity" stroke={COLORS.secondary} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Intensity', position: 'bottom', offset: 0, fontSize: 12, fill: COLORS.secondary }} />
                <YAxis type="number" dataKey="y" name="Likelihood" stroke={COLORS.secondary} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Likelihood', angle: -90, position: 'left', offset: 10, fontSize: 12, fill: COLORS.secondary }} />
                <ZAxis type="number" dataKey="z" range={[60, 400]} name="Relevance" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Topics" data={topicScatter} fill={COLORS.danger} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Region */}
        <div className="bg-white p-6 rounded-card shadow-card">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-txt-main">Regional Focus</h3>
            <p className="text-sm text-txt-muted">Distribution by Region</p>
          </div>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {regionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-2xl font-bold text-txt-main">{regionStats.length}</p>
              <p className="text-xs text-txt-muted">Regions</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {regionStats.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}></div>
                <span className="text-xs text-txt-muted">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal Bar: Country Impact */}
        <div className="bg-white p-6 rounded-card shadow-card lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-txt-main">Top Countries by Impact</h3>
            <p className="text-sm text-txt-muted">Cumulative Intensity</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryStats} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={COLORS.grey} />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fill: COLORS.secondary, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: COLORS.grey, opacity: 0.1}} />
                <Bar dataKey="value" fill={COLORS.success} radius={[0, 4, 4, 0]} barSize={20}>
                  {countryStats.map((entry, index) => (
                    <Cell key={index} fill={index < 3 ? COLORS.primary : COLORS.purpleLight} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. D3.js Charts Section - As per assignment requirement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* D3 Bar Chart: Intensity by Year */}
        <D3BarChart 
          data={data} 
          title="Intensity by Year (D3.js)"
          subtitle="Interactive bar chart built with D3.js - Hover for details"
        />
        
        {/* D3 Pie Chart: Sector Distribution */}
        <D3PieChart 
          data={data} 
          field="sector"
          title="Sector Distribution (D3.js)"
          subtitle="Count of records per sector"
          isDoughnut={true}
          limit={8}
        />
      </div>
    </div>
  );
};

export default Dashboard;
