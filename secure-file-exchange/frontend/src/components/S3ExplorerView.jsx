import React, { useState } from 'react';
import { 
  FolderArchive, 
  Folder, 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check,
  Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function S3ExplorerView({ 
  s3Objects, 
  partners, 
  onRefresh, 
  onDeleteObject 
}) {
  const [selectedPartner, setSelectedPartner] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedObject, setSelectedObject] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filtered = s3Objects.filter(obj => {
    if (selectedPartner !== 'ALL' && obj.partnerId !== selectedPartner) return false;
    if (selectedCategory !== 'ALL' && obj.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        obj.key.toLowerCase().includes(q) ||
        obj.fileName.toLowerCase().includes(q) ||
        obj.sha256Hash?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'validated':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      case 'quarantine':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'incoming':
        return 'text-sky-400 bg-sky-950/80 border-sky-800';
      case 'outgoing':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
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
          <h1 className="text-xl font-bold text-white tracking-tight">Amazon S3 Storage Hierarchy</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hierarchical partner prefix browser enforcing IAM least-privilege scoping across incoming, validated, quarantine, and outgoing objects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>s3://secure-partner-file-exchange-lab/</span>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Refresh bucket objects"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* S3 Partition Model Visualizer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-amber-400" />
          <span>S3 Prefix Isolation Architecture:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-sky-800/40">
            <div className="font-mono text-sky-400 font-bold flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              <span>/incoming/</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Target of SFTP upload. Triggers S3 ObjectCreated event notification to Lambda validator.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-800/40">
            <div className="font-mono text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>/validated/</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sanitized, virus-clean files with confirmed SHA-256 integrity, ready for downstream processing.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-rose-800/40">
            <div className="font-mono text-rose-400 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>/quarantine/</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Isolated payloads that triggered policy violations, malicious extension blocks, or duplicates.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-800/40">
            <div className="font-mono text-amber-400 font-bold flex items-center gap-1">
              <Folder className="w-3.5 h-3.5" />
              <span>/outgoing/</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Outbound reports, invoices, and EDI payloads staged for partner retrieval via SFTP.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search S3 key, filename, or SHA-256..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center text-xs">
          {/* Partner Selector */}
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Partners</option>
            {partners.map((p) => (
              <option key={p.partnerId} value={p.partnerId}>
                {p.partnerId}
              </option>
            ))}
          </select>

          {/* Category Selector */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            {['ALL', 'validated', 'quarantine', 'outgoing', 'incoming'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* S3 Objects Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Object Key</th>
                <th className="py-3 px-4 font-semibold">Partner</th>
                <th className="py-3 px-4 font-semibold">Prefix</th>
                <th className="py-3 px-4 font-semibold">Size</th>
                <th className="py-3 px-4 font-semibold">Storage Class</th>
                <th className="py-3 px-4 font-semibold">SHA-256 Digest</th>
                <th className="py-3 px-4 font-semibold">Last Modified</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No S3 objects found matching active filters.
                  </td>
                </tr>
              ) : (
                filtered.map((obj) => (
                  <tr 
                    key={obj.key} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedObject(obj)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-sky-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs" title={obj.key}>{obj.fileName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {obj.partnerId}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCategoryColor(obj.category)}`}>
                        /{obj.category}/
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatBytes(obj.size)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {obj.storageClass || 'STANDARD'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {obj.sha256Hash ? `${obj.sha256Hash.substring(0, 10)}...` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {obj.lastModified?.substring(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={api.getDownloadUrl(obj.key)}
                          download
                          className="p-1 rounded hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                          title="Download S3 Object"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onDeleteObject(obj.key)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete S3 Object"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* S3 Object Inspector Modal */}
      {selectedObject && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">S3 Object Attributes</h2>
              </div>
              <button
                onClick={() => setSelectedObject(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Full S3 URI:</span>
                <div className="font-mono text-sky-400 bg-slate-950 p-2 rounded border border-slate-800 mt-1 break-all select-all">
                  s3://{selectedObject.bucket}/{selectedObject.key}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">Partner ID:</span>
                  <div className="font-bold text-white mt-0.5">{selectedObject.partnerId}</div>
                </div>
                <div>
                  <span className="text-slate-400">Partition Prefix:</span>
                  <div className="font-mono text-emerald-400 mt-0.5">/{selectedObject.category}/</div>
                </div>
                <div>
                  <span className="text-slate-400">Payload Size:</span>
                  <div className="font-mono text-slate-200 mt-0.5">{formatBytes(selectedObject.size)}</div>
                </div>
                <div>
                  <span className="text-slate-400">S3 ETag:</span>
                  <div className="font-mono text-slate-300 mt-0.5">{selectedObject.eTag || 'STANDARD-ETAG'}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Cryptographic SHA-256 Digest:</span>
                <div className="flex items-center gap-2 mt-1 bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="font-mono text-xs text-slate-300 break-all select-all">
                    {selectedObject.sha256Hash || 'N/A'}
                  </span>
                  {selectedObject.sha256Hash && (
                    <button
                      onClick={() => copyHash(selectedObject.sha256Hash)}
                      className="p-1 text-slate-400 hover:text-white shrink-0"
                      title="Copy SHA-256"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <a
                href={api.getDownloadUrl(selectedObject.key)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download S3 Object</span>
              </a>
              <button
                onClick={() => setSelectedObject(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
