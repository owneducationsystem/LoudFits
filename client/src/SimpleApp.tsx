import React from 'react';

const SimpleApp = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Loudfits - Simplified App</h1>
      <p className="mb-4">
        This is a simplified version of the app to help diagnose issues. If you can see this page,
        it means the basic rendering is working.
      </p>
      <div className="bg-[#582A34] text-white p-4 rounded mb-4">
        <h2 className="text-xl font-bold mb-2">System Status</h2>
        <p>React is working properly</p>
      </div>
      <button 
        className="bg-[#582A34] text-white px-4 py-2 rounded"
        onClick={() => window.location.href = '/'}
      >
        Go to Main App
      </button>
    </div>
  );
};

export default SimpleApp;