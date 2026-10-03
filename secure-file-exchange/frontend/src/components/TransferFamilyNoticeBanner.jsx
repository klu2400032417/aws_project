import React, { useState } from 'react';
import { AlertCircle, ChevronRight, X, ShieldAlert, Layers } from 'lucide-react';

export default function TransferFamilyNoticeBanner({ onOpenArchitecture }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-semibold">Learner Lab Notice:</span>
          <span>AWS Transfer Family labeled as Planned Production Integration (Direct S3 + Lambda + DynamoDB active).</span>
        </div>
        <button
          onClick={() => setDismissed(false)}
          className="text-amber-400 hover:text-amber-200 underline text-xs"
        >
          Expand Notice
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-b border-amber-600/40 px-4 py-3 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AWS Learner Lab Environment
              </span>
              <span className="text-xs font-medium text-slate-400">
                Production Concept vs Achieved Architecture
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed">
              <strong className="text-amber-300 font-semibold">AWS Transfer Family Constraint:</strong> Real SFTP server endpoints are restricted in AWS Learner Lab. This platform directly implements the production core: 
              <span className="text-sky-300 font-mono text-[11px] mx-1">S3 (partner/{'{id}'}/prefix)</span> → 
              <span className="text-emerald-300 font-mono text-[11px] mx-1">Lambda Validation (SHA-256 / Quarantine)</span> → 
              <span className="text-purple-300 font-mono text-[11px] mx-1">DynamoDB Audit</span> → 
              <span className="text-cyan-300 font-mono text-[11px] mx-1">CloudWatch EMF</span>. Transfer Family is honestly documented as the intended production ingress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/40 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View Architecture Blueprint</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Minimize advisory"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
