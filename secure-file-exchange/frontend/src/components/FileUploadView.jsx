import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FolderCheck,
  ShieldAlert,
  UploadCloud
} from 'lucide-react';

export default function FileUploadView({
  partners,
  onUploadFile,
  onSelectTransfer,
  onNavigateTab
}) {
  const inputRef = useRef(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [direction, setDirection] = useState('INCOMING');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const currentPartner = partners.find((partner) => partner.partnerId === selectedPartnerId) || partners[0];

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    setSelectedFile(event.dataTransfer.files?.[0] || null);
    setErrorMsg('');
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
    setErrorMsg('');
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!currentPartner || !selectedFile) return;

    setUploading(true);
    setErrorMsg('');
    setLastResult(null);
    try {
      const result = await onUploadFile(selectedFile, currentPartner.partnerId, direction);
      setLastResult(result);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setErrorMsg(error.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const copyHash = async (hash) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VALIDATED':
        return <span className="inline-flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />{status}</span>;
      case 'QUARANTINED':
        return <span className="inline-flex items-center gap-1 rounded border border-rose-800 bg-rose-950 px-2.5 py-1 text-xs font-bold text-rose-300"><ShieldAlert className="h-3.5 w-3.5" />{status}</span>;
      case 'DUPLICATE':
        return <span className="inline-flex items-center gap-1 rounded border border-amber-800 bg-amber-950 px-2.5 py-1 text-xs font-bold text-amber-300"><AlertTriangle className="h-3.5 w-3.5" />{status}</span>;
      default:
        return <span className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Partner File Ingestion & Exchange</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Upload a file for a registered partner. The backend validates the user-provided file and stores its transfer and audit records.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        {partners.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-center">
            <p className="text-sm font-semibold text-white">No partners registered</p>
            <p className="mt-1 text-xs text-slate-400">Create a partner before uploading a file.</p>
            <button
              type="button"
              onClick={() => onNavigateTab('partners')}
              className="mt-4 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500"
            >
              Register Partner
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="upload-partner" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Trading Partner
                </label>
                <select
                  id="upload-partner"
                  value={currentPartner?.partnerId || ''}
                  onChange={(event) => setSelectedPartnerId(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-sky-500 focus:outline-none"
                >
                  {partners.map((partner) => (
                    <option key={partner.partnerId} value={partner.partnerId}>
                      {partner.name} ({partner.partnerId}) - {partner.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="upload-direction" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Transfer Direction
                </label>
                <select
                  id="upload-direction"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="INCOMING">INCOMING (Partner to S3)</option>
                  <option value="OUTGOING">OUTGOING (S3 to Partner)</option>
                </select>
              </div>
            </div>

            {currentPartner && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
                <span>Status: <strong className="text-slate-200">{currentPartner.status}</strong></span>
                <span>Maximum: <strong className="text-slate-200">{currentPartner.maxFileSizeMb} MB</strong></span>
                <span>Allowed: <strong className="font-mono text-emerald-300">{currentPartner.allowedFileTypes?.join(', ')}</strong></span>
                <span>Target: <strong className="font-mono text-sky-400">{currentPartner.s3HomePrefix}{direction.toLowerCase()}/</strong></span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Choose or drop a file</label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  dragActive ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <UploadCloud className="mx-auto h-9 w-9 text-sky-400" />
                <p className="mt-3 text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Drop a file here or choose one'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedFile
                    ? `${selectedFile.size.toLocaleString()} bytes`
                    : `Allowed by partner policy: ${currentPartner?.allowedFileTypes?.join(', ') || 'not configured'}`}
                </p>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                  className="mt-4 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {errorMsg && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/20 transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Uploading and validating...' : 'Upload File'}
              </button>
            </div>
          </>
        )}
      </form>

      {lastResult && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderCheck className="h-5 w-5 text-sky-400" />
              <h2 className="text-sm font-bold text-white">Validation Result</h2>
              <span className="font-mono text-xs text-slate-400">[{lastResult.transferId}]</span>
            </div>
            {getStatusBadge(lastResult.status)}
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
            <div>
              <span className="text-slate-400">Filename</span>
              <div className="mt-0.5 font-mono font-bold text-slate-200">{lastResult.fileName}</div>
            </div>
            <div>
              <span className="text-slate-400">Partner</span>
              <div className="mt-0.5 font-semibold text-white">{lastResult.partnerName} ({lastResult.partnerId})</div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400">SHA-256</span>
              <div className="mt-0.5 flex items-center gap-2 rounded border border-slate-800 bg-slate-950 p-2">
                <span className="break-all font-mono text-sky-400">{lastResult.sha256Hash}</span>
                <button type="button" onClick={() => copyHash(lastResult.sha256Hash)} className="shrink-0 p-1 text-slate-400 hover:text-white" title="Copy SHA-256">
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400">Stored object</span>
              <div className="mt-0.5 break-all rounded border border-slate-800 bg-slate-950 p-2 font-mono text-emerald-400">
                {lastResult.s3Bucket && `s3://${lastResult.s3Bucket}/`}{lastResult.s3Key}
              </div>
            </div>
            <div className="sm:col-span-2 rounded border border-slate-800/80 bg-slate-950/60 p-3">
              <span className="font-semibold text-slate-300">Validation disposition</span>
              <p className="mt-1 text-xs text-slate-300">{lastResult.validationResult?.reason}</p>
              {lastResult.validationResult?.securityFlags?.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Checks: {lastResult.validationResult.securityFlags.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => onSelectTransfer(lastResult)}
              className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-slate-700"
            >
              View Audit Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
