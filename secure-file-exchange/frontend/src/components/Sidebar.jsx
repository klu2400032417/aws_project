import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UploadCloud, 
  FolderArchive, 
  History, 
  ShieldAlert, 
  Layers, 
  Lock,
  FileCheck
} from 'lucide-react';

export default function Sidebar({ currentTab, setTab, stats, unreadSecurityCount }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'partners',
      label: 'Partners',
      icon: Users,
      badge: stats?.totalPartners ? `${stats.totalPartners}` : null,
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'upload',
      label: 'File Exchange',
      icon: UploadCloud,
      badge: 'Live Ingestion',
      badgeColor: 'bg-sky-950 text-sky-400 border border-sky-800',
    },
    {
      id: 's3explorer',
      label: 'S3 Explorer',
      icon: FolderArchive,
      badge: 'Prefix View',
      badgeColor: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'transfers',
      label: 'Transfer Audit',
      icon: History,
      badge: stats?.totalTransfers ? `${stats.totalTransfers}` : null,
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'security',
      label: 'Security & Quarantine',
      icon: ShieldAlert,
      badge: stats?.quarantinedFiles || stats?.totalSecurityEvents ? `${stats.quarantinedFiles || 0} Quarantined` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800',
    },
    {
      id: 'architecture',
      label: 'Architecture & SFTP',
      icon: Layers,
      badge: 'Blueprint',
      badgeColor: 'bg-amber-950 text-amber-300 border border-amber-800',
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 border-b border-slate-800/80">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Navigation Console
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Partner Policies Enforced</span>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage Prefix Info Card */}
      <div className="p-3 m-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]">
        <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>Storage Prefix Pattern</span>
          <span className="text-[10px] text-emerald-400 font-mono">Partner Scoped</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
          <div className="text-sky-400">partner/{'{id}'}/incoming/</div>
          <div className="text-emerald-400">partner/{'{id}'}/validated/</div>
          <div className="text-rose-400">partner/{'{id}'}/quarantine/</div>
          <div className="text-amber-400">partner/{'{id}'}/outgoing/</div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Validation API</span>
          <span>Relational DB</span>
        </div>
      </div>
    </aside>
  );
}
