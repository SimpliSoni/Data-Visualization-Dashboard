import React from 'react';

interface NavbarProps {
  onSearch: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md h-[70px] shadow-nav mb-6 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-6 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-txt-main hidden sm:block">Data Visualization Dashboard</h1>
        </div>
        <div className="relative flex-1 max-w-md ml-auto">
          <svg className="w-5 h-5 text-txt-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search insights (title, topic, region...)" 
            onChange={(e) => onSearch(e.target.value)}
            className="bg-gray-50 border border-border-color rounded-lg outline-none pl-10 pr-4 py-2 text-sm text-txt-main w-full placeholder-txt-muted focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
