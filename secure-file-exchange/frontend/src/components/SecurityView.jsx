import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  Search, 
  FileWarning, 
  Download, 
  Lock, 
  Check, 
  FolderLock,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function SecurityView({ 
  securityEvents, 
  quarantinedTransfers, 
  onRefresh, 
  onResolveEvent,
  onSelectTransfer 
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'quarantine'
  const [search, setSearch] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const criticalCount = securityEvents.filter(e => e.severity === 'CRITICAL').length;
  const highCount = securityEvents.filter(e => e.severity === 'HIGH').length;
  const warningCount = securityEvents.filter(e => e.severity === 'WARNING').length;

  const filteredEvents = securityEvents.filter(e => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.eventId?.toLowerCase().includes(q) ||
        e.fileName?.toLowerCase().includes(q) ||
        e.partnerId?.toLowerCase().includes(q) ||
        e.eventType?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px] animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 font-bold text-[10px]">HIGH</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px]">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold text-[10px]">INFO</span>;
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security & Quarantine Forensics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated threat mitigation, prohibited file quarantine isolation, and cryptographic duplicate collision tracking.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 self-start sm:self-center"
          title="Refresh security feeds"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Security Threat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critical Threats</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{criticalCount}</div>
            <span className="text-[11px] text-slate-500">Malware & Executable blocks</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Suspicious Activity</span>
            <div className="text-2xl font-bold text-orange-400 font-mono mt-1">{highCount}</div>
            <span className="text-[11px] text-slate-500">Suspended / Unauthorized attempts</span>
          </div>
          <div className="p-3 rounded-xl bg-orange-950/60 text-orange-400 border border-orange-900">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Duplicate Payloads</span>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{warningCount}</div>
            <span className="text-[11px] text-slate-500">SHA-256 Collision Rejections</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900">
            <Copy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Isolated in S3</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">{quarantinedTransfers?.length || 0}</div>
            <span className="text-[11px] text-rose-400 font-mono">/quarantine/ partition</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-sky-400 border border-slate-700">
            <FolderLock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs: Security Incidents vs Quarantined Payloads */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'incidents'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security Incidents Log ({securityEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'quarantine'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderLock className="w-4 h-4" />
          <span>Isolated Quarantine Files ({quarantinedTransfers?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Security Incidents Table */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search event ID, filename, partner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
                {['ALL', 'CRITICAL', 'HIGH', 'WARNING'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      severityFilter === sev
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Incident ID</th>
                    <th className="py-3 px-4 font-semibold">Severity</th>
                    <th className="py-3 px-4 font-semibold">Event Type</th>
                    <th className="py-3 px-4 font-semibold">Partner</th>
                    <th className="py-3 px-4 font-semibold">Offending Payload</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Action Enforced</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-500">
                        No security incidents found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.eventId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-sky-400">
                          {evt.eventId}
                        </td>
                        <td className="py-3 px-4">
                          {getSeverityBadge(evt.severity)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-200">
                          {evt.eventType}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{evt.partnerName || evt.partnerId}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{evt.clientIp}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 truncate max-w-[140px]" title={evt.fileName}>
                          {evt.fileName || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={evt.description}>
                          {evt.description}
                        </td>
                        <td className="py-3 px-4 text-emerald-400 text-[11px]">
                          {evt.actionTaken}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {evt.timestamp?.substring(11, 19)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {evt.resolved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                            </span>
                          ) : (
                            <button
                              onClick={() => onResolveEvent(evt.eventId)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors border border-slate-700"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quarantined Payloads */}
      {activeTab === 'quarantine' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Isolated Quarantined S3 Objects</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Objects moved directly to <code className="text-rose-400 font-mono">partner/{'{id}'}/quarantine/</code> by Lambda isolation policies.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Transfer ID</th>
                    <th className="py-3 px-4 font-semibold">Partner</th>
                    <th className="py-3 px-4 font-semibold">Quarantined File</th>
                    <th className="py-3 px-4 font-semibold">Isolation Reason</th>
                    <th className="py-3 px-4 font-semibold">SHA-256 Digest</th>
                    <th className="py-3 px-4 font-semibold">S3 Quarantine Key</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {quarantinedTransfers?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        No quarantined files found. All incoming transfers are clean.
                      </td>
                    </tr>
                  ) : (
                    quarantinedTransfers.map((tx) => (
                      <tr key={tx.transferId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-rose-400">
                          {tx.transferId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {tx.partnerName || tx.partnerId}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {tx.fileName}
                        </td>
                        <td className="py-3 px-4 text-rose-300 font-medium max-w-xs">
                          {tx.validationResult?.reason || 'Quarantined by policy'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          {tx.sha256Hash ? `${tx.sha256Hash.substring(0, 10)}...` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                          {tx.s3Key}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectTransfer(tx)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-[11px] font-medium transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
