import React from 'react';
import { Shield, Database, Cloud, RefreshCw, Layers, CheckCircle2, AlertTriangle, ExternalLink, Terminal } from 'lucide-react';

export default function Navbar({ systemStatus, onRefresh, onOpenArchitecture, onToggleLogs, showLogs }) {
  const isAws = systemStatus?.awsConnected;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Secure Partner File Exchange
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                ENTERPRISE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Amazon S3 Partitioned Storage</span>
              <span>•</span>
              <span className="text-amber-400/90 font-medium">Learner Lab Sandbox</span>
            </div>
          </div>
        </div>

        {/* Center: Cloud Architecture Badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Region:</span>
            <span className="font-mono text-white">{systemStatus?.region || 'us-east-1'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Bucket:</span>
            <span className="font-mono text-sky-300 truncate max-w-[160px]" title={systemStatus?.s3Bucket}>
              s3://{systemStatus?.s3Bucket || 'partner-exchange-lab'}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs ${
            isAws ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isAws ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`}></span>
            <span>{isAws ? 'AWS Live SDK Connected' : 'High-Fidelity Lab Mode'}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLogs}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors border ${
              showLogs 
                ? 'bg-slate-700 text-sky-300 border-sky-500' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Live CloudWatch EMF Log Stream"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">CloudWatch Logs</span>
          </button>

          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Refresh All Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
