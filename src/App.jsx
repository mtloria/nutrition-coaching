import React, { useState } from 'react';
import Dashboard from './main.jsx';
import WeeklyReport from './WeeklyReport.jsx';
import './styles.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="app">
      <nav className="main-nav no-print">
        <div className="nav-container">
          <h1 className="nav-title">Nutrition Coaching</h1>
          <div className="nav-buttons">
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${currentView === 'report' ? 'active' : ''}`}
              onClick={() => setCurrentView('report')}
            >
              Weekly Report
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'report' && <WeeklyReport />}
      </main>
    </div>
  );
}

export default App;
