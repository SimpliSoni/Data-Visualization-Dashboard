import React from 'react';
import { FilterState } from '../types';
import { getUniqueValues } from '../services/dataService';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  // Filter out 'search' key as it's not a dropdown filter
  const renderSelect = (name: keyof Omit<FilterState, 'search'>, label: string, options: (string | number)[]) => (
    <div className="flex-1 min-w-[120px]">
      <label className="block text-xs font-medium text-txt-muted mb-1.5">{label}</label>
      <div className="relative">
        <select
          name={name}
          value={filters[name] || ''}
          onChange={onFilterChange}
          className="w-full bg-white border border-border-color text-txt-main text-sm rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary block p-2.5 appearance-none transition-all truncate pr-8"
        >
          <option value="">All {label}s</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-txt-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );

  // Get filter options - using local data helper for now
  const yearOptions = getUniqueValues('end_year');
  const topicOptions = getUniqueValues('topic');
  const sectorOptions = getUniqueValues('sector');
  const regionOptions = getUniqueValues('region');
  const pestleOptions = getUniqueValues('pestle');
  const sourceOptions = getUniqueValues('source');
  const countryOptions = getUniqueValues('country');

  return (
    <div className="bg-card-bg p-5 rounded-card shadow-card mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-txt-main uppercase tracking-wide">Filters</h3>
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-danger/10 text-danger text-sm font-medium rounded-md hover:bg-danger hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Reset Filters
          </button>
        </div>
        
        {/* Main filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full">
          {renderSelect('end_year', 'Year', yearOptions)}
          {renderSelect('topic', 'Topic', topicOptions)}
          {renderSelect('sector', 'Sector', sectorOptions)}
          {renderSelect('region', 'Region', regionOptions)}
          {renderSelect('pestle', 'PESTLE', pestleOptions)}
          {renderSelect('source', 'Source', sourceOptions)}
          {renderSelect('country', 'Country', countryOptions)}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;