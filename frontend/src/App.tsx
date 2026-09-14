import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LiveCall } from './pages/LiveCall';
import { VoiceAnalysis } from './pages/VoiceAnalysis';
import { ChallengeCenter } from './pages/ChallengeCenter';
import { TrustEnginePage } from './pages/TrustEnginePage';
import { Threats } from './pages/Threats';
import { Analytics } from './pages/Analytics';
import { AttackLab } from './pages/AttackLab';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live-call" element={<LiveCall />} />
              <Route path="/voice-analysis" element={<VoiceAnalysis />} />
              <Route path="/challenge-center" element={<ChallengeCenter />} />
              <Route path="/trust-engine" element={<TrustEnginePage />} />
              <Route path="/threats" element={<Threats />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/attack-lab" element={<AttackLab />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:id" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
