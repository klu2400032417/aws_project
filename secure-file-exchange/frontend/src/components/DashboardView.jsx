import React from 'react';
import { 
  Users, 
  FileCheck, 
  ShieldAlert, 
  Copy, 
  Database, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Download, 
  ExternalLink,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function DashboardView({ 
  stats, 
  recentTransfers, 
  onSelectTransfer, 
  onNavigateTab, 
  onRunQuickTest 
}) {
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusColors = {
    VALIDATED: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    QUARANTINED: 'bg-rose-950 text-rose-300 border-rose-800',
    DUPLICATE: 'bg-amber-950 text-amber-300 border-amber-800',
    FAILED: 'bg-slate-800 text-slate-300 border-slate-700',
    INCOMING: 'bg-sky-950 text-sky-300 border-sky-800'
  };

  const pieData = stats?.filesByStatus || [
    { name: 'Validated', value: stats?.successfulTransfers || 0, color: '#10b981' },
    { name: 'Quarantined', value: stats?.quarantinedFiles || 0, color: '#ef4444' },
    { name: 'Duplicate', value: stats?.duplicateFiles || 0, color: '#f59e0b' },
    { name: 'Failed', value: stats?.failedTransfers || 0, color: '#64748b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time partner ingestion metrics, S3 bucket partition activity, and automated Lambda validation telemetry.
          </p>
        </div>

        {/* Live Quick Demo Triggers */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Test:</span>
          </span>
          <button
            onClick={() => onRunQuickTest('VALID_CLAIMS_CSV')}
            className="px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 text-xs font-medium border border-emerald-700 transition-colors"
            title="Upload Valid Claims CSV"
          >
            + Valid CSV
          </button>
          <button
            onClick={() => onRunQuickTest('MALICIOUS_EXE')}
            className="px-2.5 py-1 rounded bg-rose-900/40 hover:bg-rose-800/50 text-rose-300 text-xs font-medium border border-rose-700 transition-colors"
            title="Test Prohibited Executable (.exe)"
          >
            + Malware .exe
          </button>
          <button
            onClick={() => onRunQuickTest('DUPLICATE_PAYLOAD')}
            className="px-2.5 py-1 rounded bg-amber-900/40 hover:bg-amber-800/50 text-amber-300 text-xs font-medium border border-amber-700 transition-colors"
            title="Test SHA-256 Duplicate Collision"
          >
            + Duplicate
          </button>
        </div>
      </div>

      {/* 6 Key Enterprise Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Card 1: Partners */}
        <div 
          onClick={() => onNavigateTab('partners')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-sky-500/5 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Partners</span>
            <Users className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats?.totalPartners ?? 0}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{stats?.activePartners ?? 0} Active</span>
            <span>•</span>
            <span className="text-rose-400">{stats?.suspendedPartners ?? 0} Suspended</span>
          </div>
        </div>

        {/* Card 2: Total Transfers */}
        <div 
          onClick={() => onNavigateTab('transfers')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-sky-500/5 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Transfers</span>
            <TrendingUp className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats?.totalTransfers ?? 0}</div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Pass Rate:</span>
            <span className="text-emerald-400 font-semibold">{stats?.successRatePercent ?? 100}%</span>
          </div>
        </div>

        {/* Card 3: Validated S3 */}
        <div 
          onClick={() => onNavigateTab('s3explorer')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/5 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Validated Files</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{stats?.successfulTransfers ?? 0}</div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            S3: /validated/ prefix
          </div>
        </div>

        {/* Card 4: Quarantined Violations */}
        <div 
          onClick={() => onNavigateTab('security')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-rose-500/5 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Quarantined</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{stats?.quarantinedFiles ?? 0}</div>
          <div className="mt-1 text-[11px] text-rose-400/80">
            Isolated in S3
          </div>
        </div>

        {/* Card 5: Duplicate Payloads */}
        <div 
          onClick={() => onNavigateTab('security')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-amber-500/5 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Duplicates</span>
            <Copy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{stats?.duplicateFiles ?? 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            SHA-256 Collision Filter
          </div>
        </div>

        {/* Card 6: Total Volume */}
        <div 
          onClick={() => onNavigateTab('s3explorer')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/5 group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Data Volume</span>
            <Database className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white font-mono truncate">
            {formatBytes(stats?.totalBytesTransferred)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            S3 Standard Storage
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">File Transfer Throughput & Quarantine Rates</h2>
              <p className="text-xs text-slate-400">Real-time CloudWatch metric aggregation by hourly interval</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Transferred
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Violations
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.transfersByHour || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="transfersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="violationsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="transfers" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#transfersGrad)" name="Transfers" />
                <Area type="monotone" dataKey="violations" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#violationsGrad)" name="Quarantines" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Donut Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Validation Disposition</h2>
            <p className="text-xs text-slate-400">File distribution across S3 partition lifecycle</p>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#38bdf8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <span className="text-xs text-slate-400">Total</span>
              <div className="text-xl font-bold text-white font-mono">{stats?.totalTransfers || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400">{item.name}:</span>
                <span className="font-semibold text-slate-200 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent File Transfers Audit Stream Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent File Transfers & Ingestion Stream</h2>
            <p className="text-xs text-slate-400">DynamoDB tracked file transactions and Lambda verification status</p>
          </div>
          <button
            onClick={() => onNavigateTab('transfers')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
          >
            <span>View Complete Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Transfer ID</th>
                <th className="py-3 px-4 font-semibold">Partner</th>
                <th className="py-3 px-4 font-semibold">Filename</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">SHA-256 Checksum</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Ingestion Path</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentTransfers?.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No transfers logged yet. Use the Quick Test buttons above to ingest sample files.
                  </td>
                </tr>
              ) : (
                recentTransfers.map((tx) => (
                  <tr key={tx.transferId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-sky-400">
                      {tx.transferId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{tx.partnerName || tx.partnerId}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.partnerId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {tx.fileName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatBytes(tx.fileSize)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {tx.sha256Hash ? `${tx.sha256Hash.substring(0, 10)}...` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[tx.status] || statusColors.FAILED}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[180px]" title={tx.s3Key}>
                      {tx.s3Key || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectTransfer(tx)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
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
  );
}
