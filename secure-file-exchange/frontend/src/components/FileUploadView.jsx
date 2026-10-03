import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Copy, 
  Check, 
  ArrowRight, 
  FolderCheck, 
  Zap, 
  FileUp,
  RefreshCw,
  Info
} from 'lucide-react';

export default function FileUploadView({ 
  partners, 
  onUploadFile, 
  onRunQuickTest, 
  onSelectTransfer 
}) {
  const [selectedPartnerId, setSelectedPartnerId] = useState(partners[0]?.partnerId || 'PRT-HEALTHCORP');
  const [direction, setDirection] = useState('INCOMING');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const currentPartner = partners.find(p => p.partnerId === selectedPartnerId) || partners[0];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file) => {
    setUploading(true);
    setErrorMsg(null);
    setLastResult(null);

    try {
      const res = await onUploadFile(file, selectedPartnerId, direction);
      setLastResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleQuickTest = async (testType) => {
    setUploading(true);
    setErrorMsg(null);
    setLastResult(null);

    try {
      const res = await onRunQuickTest(testType, selectedPartnerId);
      setLastResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Quick test execution failed');
    } finally {
      setUploading(false);
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VALIDATED':
        return <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> VALIDATED</span>;
      case 'QUARANTINED':
        return <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> QUARANTINED</span>;
      case 'DUPLICATE':
        return <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> DUPLICATE</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Partner File Ingestion & Exchange</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Simulate partner file ingestion into Amazon S3, triggering real-time Lambda cryptographic validation and quarantine classification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Form & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Step 1: Select Partner & Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  1. Select Trading Partner
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                >
                  {partners.map((p) => (
                    <option key={p.partnerId} value={p.partnerId}>
                      {p.name} ({p.partnerId}) - {p.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  2. Transfer Direction
                </label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setDirection('INCOMING')}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                      direction === 'INCOMING'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    INCOMING (Partner → S3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('OUTGOING')}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                      direction === 'OUTGOING'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OUTGOING (S3 → Partner)
                  </button>
                </div>
              </div>
            </div>

            {/* Partner Policy Summary */}
            {currentPartner && (
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    currentPartner.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {currentPartner.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300 font-medium">Target Prefix:</span>{' '}
                  <span className="font-mono text-sky-400 text-[11px]">{currentPartner.s3HomePrefix}{direction.toLowerCase()}/</span>
                </div>
                <div>
                  <span className="text-slate-300 font-medium">Quota:</span>{' '}
                  <span className="font-mono text-slate-200">{currentPartner.maxFileSizeMb} MB</span>
                </div>
                <div>
                  <span className="text-slate-300 font-medium">Allowed:</span>{' '}
                  <span className="font-mono text-emerald-300 text-[11px]">{currentPartner.allowedFileTypes?.join(' ')}</span>
                </div>
              </div>
            )}

            {/* Step 3: Drag and Drop Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                3. Choose or Drop File to Exchange
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}
              >
                <input
                  type="file"
                  id="file-upload-input"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-sky-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Drop partner payload here, or{' '}
                      <label
                        htmlFor="file-upload-input"
                        className="text-sky-400 hover:text-sky-300 cursor-pointer underline font-medium"
                      >
                        browse files
                      </label>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Allowed by policy: CSV, JSON, XML, PDF, PGP, XLSX up to 50MB
                    </p>
                  </div>

                  {uploading && (
                    <div className="w-full max-w-xs space-y-1.5 pt-2">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-sky-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
                      </div>
                      <span className="text-[11px] text-sky-400 font-mono">
                        Computing SHA-256 & executing Lambda security filters...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Validation Result Inspection Card */}
          {lastResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Ingestion & Validation Disposition</h3>
                  <span className="font-mono text-xs text-slate-400">[{lastResult.transferId}]</span>
                </div>
                {getStatusBadge(lastResult.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Filename:</span>
                  <div className="font-mono text-slate-200 font-bold mt-0.5">{lastResult.fileName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Trading Partner:</span>
                  <div className="font-semibold text-white mt-0.5">{lastResult.partnerName} ({lastResult.partnerId})</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Cryptographic SHA-256 Checksum:</span>
                  <div className="flex items-center gap-2 mt-0.5 bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="font-mono text-xs text-sky-400 break-all select-all">
                      {lastResult.sha256Hash}
                    </span>
                    <button
                      onClick={() => copyHash(lastResult.sha256Hash)}
                      className="p-1 text-slate-400 hover:text-white shrink-0"
                      title="Copy SHA-256 hash"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400">Amazon S3 Object Key:</span>
                  <div className="font-mono text-xs text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 mt-0.5 truncate">
                    s3://{lastResult.s3Bucket}/{lastResult.s3Key}
                  </div>
                </div>

                <div className="sm:col-span-2 bg-slate-950/60 p-3 rounded border border-slate-800/80">
                  <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Validation Engine Verdict:</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Execution: {lastResult.validationResult?.processingTimeMs || 45} ms
                    </span>
                  </div>
                  <p className={`text-xs ${
                    lastResult.status === 'VALIDATED' 
                      ? 'text-emerald-300' 
                      : lastResult.status === 'QUARANTINED' 
                      ? 'text-rose-300' 
                      : 'text-amber-300'
                  }`}>
                    {lastResult.validationResult?.reason || 'Verified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => onSelectTransfer(lastResult)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300 transition-colors"
                >
                  View Full Audit Timeline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Demo Test Payloads Matrix */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live Presentation Scenarios</h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                1-Click Tests
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instantly demonstrate key security and policy enforcement capabilities without creating manual files:
            </p>

            <div className="space-y-2.5">
              {/* Scenario 1 */}
              <button
                onClick={() => handleQuickTest('VALID_CLAIMS_CSV')}
                disabled={uploading}
                className="w-full text-left p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-emerald-900/40 hover:border-emerald-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    1. Valid HIPAA Claims (.csv)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">200 OK</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Generates valid healthcare claim batch. Passes MIME & size check, SHA-256 verified, routed to S3 <code className="text-emerald-300">/validated</code>.
                </p>
              </button>

              {/* Scenario 2 */}
              <button
                onClick={() => handleQuickTest('MALICIOUS_EXE')}
                disabled={uploading}
                className="w-full text-left p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-rose-900/40 hover:border-rose-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    2. Malware Executable (.exe)
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono">QUARANTINE</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Injects PE binary header with prohibited <code className="text-rose-300">.exe</code> extension. Triggers Lambda quarantine isolation and CloudWatch CRITICAL alarm.
                </p>
              </button>

              {/* Scenario 3 */}
              <button
                onClick={() => handleQuickTest('DUPLICATE_PAYLOAD')}
                disabled={uploading}
                className="w-full text-left p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-amber-900/40 hover:border-amber-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-amber-400 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    3. SHA-256 Duplicate Collision
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">DUPLICATE</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Re-submits identical claim payload. Queries DynamoDB hash index, catches duplicate cryptographic signature, flags security audit.
                </p>
              </button>

              {/* Scenario 4 */}
              <button
                onClick={() => handleQuickTest('SUSPENDED_PARTNER_ATTEMPT')}
                disabled={uploading}
                className="w-full text-left p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    4. Suspended Partner Attempt
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">REJECTED</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Attempts upload from suspended partner <code className="text-slate-300">PRT-APEX-RETAIL</code> on compliance hold. Session isolated and rejected.
                </p>
              </button>

              {/* Scenario 5 */}
              <button
                onClick={() => handleQuickTest('ENCRYPTED_PGP')}
                disabled={uploading}
                className="w-full text-left p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-sky-900/40 hover:border-sky-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-sky-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    5. Armored PGP Settlement
                  </span>
                  <span className="text-[10px] text-sky-400 font-mono">ENCRYPTED</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tests PGP-encrypted financial clearing payload for <code className="text-sky-300">PRT-FINTECH-GLOBAL</code>. Confirms cryptographic headers.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
