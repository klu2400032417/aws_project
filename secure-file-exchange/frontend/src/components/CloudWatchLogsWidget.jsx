import React, { useState } from 'react';
import { Terminal, RefreshCw, X, Shield, Activity, Filter, Copy, Check } from 'lucide-react';

export default function CloudWatchLogsWidget({ logs, onClose, onRefresh }) {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  });

  const handleCopy = (logStr, index) => {
    navigator.clipboard.writeText(logStr);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-950 border-t border-slate-800 p-4 font-mono text-xs shadow-2xl relative">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white text-xs">Amazon CloudWatch Live Metric & Audit Stream</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            EMF 1.0.0
          </span>
          <span className="text-[10px] text-slate-500">Namespace: SecureFileExchange/Production</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px]">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-[11px]"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO Only</option>
              <option value="WARN">WARN (Quarantined/Violations)</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refresh stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close log console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1 select-text">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 py-4 text-center">No logs matching filter. Trigger an exchange to generate CloudWatch EMF metrics.</div>
        ) : (
          filteredLogs.map((item, idx) => (
            <div
              key={idx}
              className={`p-2 rounded border text-[11px] leading-relaxed flex items-start justify-between gap-2 ${
                item.level === 'WARN'
                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                  : 'bg-slate-900/80 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="space-y-1 overflow-x-auto w-full">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500">{item.timestamp?.substring(11, 19)}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    item.level === 'WARN' ? 'bg-rose-900 text-rose-200' : 'bg-sky-900 text-sky-200'
                  }`}>
                    {item.level}
                  </span>
                  <span className="text-slate-400 font-semibold">{item.eventType}</span>
                  {item.partnerId && (
                    <span className="text-amber-400">[{item.partnerId}]</span>
                  )}
                </div>
                <div className="text-slate-200 font-sans text-xs">{item.message}</div>
                {item.dimensions && (
                  <div className="text-[10px] text-slate-400">
                    Dimensions: {JSON.stringify(item.dimensions)}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleCopy(JSON.stringify(item, null, 2), idx)}
                className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                title="Copy log entry JSON"
              >
                {copiedId === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
