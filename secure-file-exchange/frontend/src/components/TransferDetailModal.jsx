import React, { useState } from 'react';
import { 
  History, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Copy, 
  Check, 
  Database, 
  FolderCheck, 
  Cpu, 
  Cloud, 
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function TransferDetailModal({ transfer, onClose }) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!transfer) return null;

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VALIDATED':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      case 'QUARANTINED':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'DUPLICATE':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">{transfer.transferId}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{transfer.partnerName} ({transfer.partnerId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Transfer Lifecycle Flow Diagram */}
        <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>AWS Event-Driven Pipeline Lifecycle</span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Learner Lab Active Flow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {/* Step 1: Ingestion */}
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-sky-400 font-bold block mb-1">1. INGRESS</span>
                <div className="font-semibold text-white text-[11px] truncate">
                  {transfer.direction === 'INCOMING' ? 'Partner SFTP / API' : 'Outbound Dispatch'}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                {transfer.incomingS3Key ? 's3: /incoming/' : 'Direct'}
              </div>
            </div>

            {/* Step 2: Lambda Validation */}
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold block mb-1">2. LAMBDA SCAN</span>
                <div className="font-semibold text-white text-[11px]">
                  SHA-256 & Policy
                </div>
              </div>
              <div className="text-[10px] text-emerald-400 mt-2 font-mono">
                {transfer.validationResult?.processingTimeMs || 50} ms
              </div>
            </div>

            {/* Step 3: S3 Placement */}
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold block mb-1">3. S3 STORAGE</span>
                <div className="font-semibold text-white text-[11px] truncate">
                  /{transfer.status.toLowerCase()}/
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                IAM Scoped
              </div>
            </div>

            {/* Step 4: DynamoDB & CloudWatch */}
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-purple-400 font-bold block mb-1">4. AUDIT & EMF</span>
                <div className="font-semibold text-white text-[11px]">
                  DynamoDB + CW
                </div>
              </div>
              <div className="text-[10px] text-cyan-400 mt-2 font-mono">
                EMF Logged
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Filename:</span>
            <div className="font-mono text-white font-semibold mt-0.5">{transfer.fileName}</div>
          </div>
          <div>
            <span className="text-slate-400">Direction:</span>
            <div className="font-semibold text-white mt-0.5">{transfer.direction}</div>
          </div>
          <div>
            <span className="text-slate-400">File Size:</span>
            <div className="font-mono text-slate-200 mt-0.5">{(transfer.fileSize / 1024).toFixed(2)} KB ({transfer.fileSize} bytes)</div>
          </div>
          <div>
            <span className="text-slate-400">MIME Content Type:</span>
            <div className="font-mono text-slate-300 mt-0.5">{transfer.mimeType || 'application/octet-stream'}</div>
          </div>
          <div>
            <span className="text-slate-400">Created Timestamp:</span>
            <div className="font-mono text-slate-300 mt-0.5">{transfer.createdAt}</div>
          </div>
          <div>
            <span className="text-slate-400">Validation Completed:</span>
            <div className="font-mono text-slate-300 mt-0.5">{transfer.completedAt || transfer.createdAt}</div>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-400">Cryptographic SHA-256 Checksum:</span>
            <div className="flex items-center gap-2 mt-1 bg-slate-950 p-2 rounded border border-slate-800">
              <span className="font-mono text-xs text-sky-400 break-all select-all">
                {transfer.sha256Hash || 'N/A'}
              </span>
              {transfer.sha256Hash && (
                <button
                  onClick={() => copyHash(transfer.sha256Hash)}
                  className="p-1 text-slate-400 hover:text-white shrink-0"
                  title="Copy SHA-256"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-400">Destination Amazon S3 Key:</span>
            <div className="font-mono text-xs text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 mt-1 truncate select-all">
              s3://{transfer.s3Bucket}/{transfer.s3Key}
            </div>
          </div>

          <div className="sm:col-span-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-slate-300 mb-1">Validation Verdict & Audit Log:</div>
            <p className={`text-xs ${
              transfer.status === 'VALIDATED' 
                ? 'text-emerald-300' 
                : transfer.status === 'QUARANTINED' 
                ? 'text-rose-300' 
                : 'text-amber-300'
            }`}>
              {transfer.validationResult?.reason || 'Verified successfully by security scan.'}
            </p>
          </div>

          <div className="sm:col-span-2 bg-amber-950/20 p-2.5 rounded border border-amber-800/40 text-[11px] text-amber-300/90 flex items-start gap-2">
            <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Production Mapping Note:</strong> In production enterprise deployment, this transfer would be ingested through the AWS Transfer Family SFTP endpoint authenticating the partner SSH key, mapping to the S3 incoming prefix.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-end border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
