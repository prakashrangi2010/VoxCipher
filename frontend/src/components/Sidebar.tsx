import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PhoneCall, 
  Waves, 
  KeyRound, 
  Gauge, 
  ShieldAlert, 
  BarChart3, 
  FlaskConical, 
  FileText, 
  Settings as SettingsIcon 
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Call', path: '/live-call', icon: PhoneCall },
  { name: 'Voice Analysis', path: '/voice-analysis', icon: Waves },
  { name: 'Challenge Center', path: '/challenge-center', icon: KeyRound },
  { name: 'Trust Engine', path: '/trust-engine', icon: Gauge },
  { name: 'Threats', path: '/threats', icon: ShieldAlert },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Attack Laboratory', path: '/attack-lab', icon: FlaskConical },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-800/80 bg-[#070A12]/60 backdrop-blur-md min-h-[calc(100vh-4rem)] p-4 space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2 font-mono">
          SOC NAVIGATION
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Security Posture Widget */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Defense Posture</span>
          <span className="text-emerald-400 font-bold font-mono">OPTIMAL</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full w-[94%]" />
        </div>
        <span className="text-[10px] text-slate-500 font-mono block">
          AASIST + Multi-Band DSP Online
        </span>
      </div>
    </aside>
  );
};
