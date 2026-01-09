import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-body-bg font-sans text-txt-main">
      <Navbar onSearch={setSearchTerm} />
      <main className="p-6 pt-0">
        <Dashboard searchTerm={searchTerm} />
      </main>
    </div>
  );
}

export default App;
