import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Eye, 
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';

export default function TransferHistoryView({ 
  transfers, 
  partners, 
  onRefresh, 
  onSelectTransfer 
}) {
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filtered = transfers.filter(tx => {
    if (partnerFilter !== 'ALL' && tx.partnerId !== partnerFilter) return false;
    if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
    if (directionFilter !== 'ALL' && tx.direction !== directionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        tx.transferId.toLowerCase().includes(q) ||
        tx.fileName.toLowerCase().includes(q) ||
        tx.partnerName?.toLowerCase().includes(q) ||
        tx.sha256Hash?.toLowerCase().includes(q) ||
        tx.s3Key?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VALIDATED':
        return <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold text-[10px]">VALIDATED</span>;
      case 'QUARANTINED':
        return <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold text-[10px]">QUARANTINED</span>;
      case 'DUPLICATE':
        return <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold text-[10px]">DUPLICATE</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold text-[10px]">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Transfer History & DynamoDB Audit Catalog</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable transaction records indexed in Amazon DynamoDB with cryptographic validation forensics.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 self-start sm:self-center"
          title="Refresh audit history"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transfer ID, filename, hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Partner Selector */}
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Partners</option>
            {partners.map((p) => (
              <option key={p.partnerId} value={p.partnerId}>
                {p.partnerId}
              </option>
            ))}
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Directions</option>
            <option value="INCOMING">INCOMING Only</option>
            <option value="OUTGOING">OUTGOING Only</option>
          </select>

          {/* Status Buttons */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            {['ALL', 'VALIDATED', 'QUARANTINED', 'DUPLICATE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Transfer ID</th>
                <th className="py-3 px-4 font-semibold">Partner</th>
                <th className="py-3 px-4 font-semibold">File Details</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">SHA-256 Digest</th>
                <th className="py-3 px-4 font-semibold">Direction</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr 
                    key={tx.transferId} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectTransfer(tx)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-sky-400">
                      {tx.transferId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{tx.partnerName || tx.partnerId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.partnerId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-200 font-semibold">{tx.fileName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{tx.s3Key}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatBytes(tx.fileSize)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {tx.sha256Hash ? `${tx.sha256Hash.substring(0, 10)}...` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        tx.direction === 'INCOMING' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {tx.createdAt?.substring(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.s3Key && (
                          <a
                            href={api.getDownloadUrl(tx.s3Key)}
                            download
                            className="p-1 rounded hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                            title="Download stored payload"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onSelectTransfer(tx)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Details
                        </button>
                      </div>
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
