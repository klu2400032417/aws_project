import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Folder, 
  FileText, 
  Search, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Lock,
  AlertCircle
} from 'lucide-react';

export default function PartnersView({ 
  partners, 
  onRefresh, 
  onCreatePartner, 
  onToggleStatus 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    partnerId: '',
    name: '',
    company: '',
    contactEmail: '',
    accessLevel: 'READ_WRITE',
    maxFileSizeMb: 25,
    allowedFileTypes: '.csv, .json, .xml, .pdf',
    ipWhitelist: '198.51.100.0/24',
    pgpKeyFingerprint: '4A8B-29DF-C71E-9041'
  });

  const filtered = partners.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.partnerId.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.contactEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const allowed = formData.allowedFileTypes
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .map(s => s.startsWith('.') ? s : `.${s}`);

    await onCreatePartner({
      ...formData,
      allowedFileTypes: allowed,
      maxFileSizeMb: Number(formData.maxFileSizeMb)
    });
    setShowCreateModal(false);
    setFormData({
      partnerId: '',
      name: '',
      company: '',
      contactEmail: '',
      accessLevel: 'READ_WRITE',
      maxFileSizeMb: 25,
      allowedFileTypes: '.csv, .json, .xml, .pdf',
      ipWhitelist: '198.51.100.0/24',
      pgpKeyFingerprint: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Partner Directory & IAM Access</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized trading partners, S3 home directory partitions, file type whitelist, and access quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Partner</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Refresh partners"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, email or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((partner) => {
          const isActive = partner.status === 'ACTIVE';
          return (
            <div
              key={partner.partnerId}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{partner.partnerId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isActive 
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                        : 'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}>
                      {partner.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {partner.accessLevel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{partner.name}</h3>
                  <div className="text-xs text-slate-400">{partner.company} • {partner.contactEmail}</div>
                </div>

                <button
                  onClick={() => onToggleStatus(partner.partnerId, isActive ? 'SUSPENDED' : 'ACTIVE')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                    isActive
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80'
                  }`}
                  title={isActive ? 'Suspend partner access' : 'Activate partner'}
                >
                  {isActive ? 'Suspend' : 'Activate'}
                </button>
              </div>

              {/* S3 Partition Info */}
              <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>S3 Dedicated Prefix:</span>
                  </span>
                  <span className="font-mono text-sky-400 text-[11px]">{partner.s3HomePrefix}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>SFTP Username (Production):</span>
                  </span>
                  <span className="font-mono text-slate-300 text-[11px]">{partner.sftpUsername || 'sftp-' + partner.partnerId.toLowerCase()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Allowed File Types:</span>
                  </span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
                    {partner.allowedFileTypes?.map((ext, idx) => (
                      <span key={idx} className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-300 font-medium">Quota / Payload Ceiling:</span>
                  <span className="font-mono text-slate-300">{partner.maxFileSizeMb} MB Max</span>
                </div>

                {partner.ipWhitelist && (
                  <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                    <span className="text-slate-400 text-[11px]">IP CIDR Whitelist:</span>
                    <span className="font-mono text-[11px] text-slate-300">{partner.ipWhitelist}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Total Transfers: <strong className="text-slate-300 font-mono">{partner.totalTransfers || 0}</strong></span>
                <span>Updated: {partner.updatedAt?.substring(0, 10) || 'Recently'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Partner */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Register Trading Partner</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Partner Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRT-ACME-CORP"
                    value={formData.partnerId}
                    onChange={(e) => setFormData({ ...formData, partnerId: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Partner Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Legal Entity / Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Global Logistics LLC"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Integration Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="partner-ops@acme.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Access Level</label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="READ_WRITE">READ_WRITE (Bi-directional)</option>
                    <option value="READ_ONLY">READ_ONLY (Download Only)</option>
                    <option value="ENCRYPTED_ONLY">ENCRYPTED_ONLY (PGP Enforced)</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Max File Quota (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxFileSizeMb}
                    onChange={(e) => setFormData({ ...formData, maxFileSizeMb: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Allowed File Extensions (Comma separated)</label>
                <input
                  type="text"
                  placeholder=".csv, .json, .xml, .pdf, .pgp"
                  value={formData.allowedFileTypes}
                  onChange={(e) => setFormData({ ...formData, allowedFileTypes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">IP CIDR Whitelist</label>
                  <input
                    type="text"
                    placeholder="198.51.100.0/24"
                    value={formData.ipWhitelist}
                    onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">PGP Key Fingerprint (Optional)</label>
                  <input
                    type="text"
                    placeholder="99AF-12CD-8812-4401"
                    value={formData.pgpKeyFingerprint}
                    onChange={(e) => setFormData({ ...formData, pgpKeyFingerprint: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md shadow-sky-600/30"
                >
                  Create Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
