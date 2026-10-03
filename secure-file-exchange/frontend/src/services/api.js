// REST API Service for Secure Partner File Exchange Platform

const API_BASE = '/api';

export const api = {
  // System & Status
  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getCloudWatchLogs(limit = 60) {
    const res = await fetch(`${API_BASE}/system/cloudwatch-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch CloudWatch logs');
    return res.json();
  },

  async getArchitectureInfo() {
    const res = await fetch(`${API_BASE}/system/architecture-info`);
    if (!res.ok) throw new Error('Failed to fetch architecture info');
    return res.json();
  },

  // Dashboard
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getRecentTransfers() {
    const res = await fetch(`${API_BASE}/dashboard/recent`);
    if (!res.ok) throw new Error('Failed to fetch recent transfers');
    return res.json();
  },

  // Partners
  async getPartners() {
    const res = await fetch(`${API_BASE}/partners`);
    if (!res.ok) throw new Error('Failed to fetch partners');
    return res.json();
  },

  async getPartner(partnerId) {
    const res = await fetch(`${API_BASE}/partners/${partnerId}`);
    if (!res.ok) throw new Error('Failed to fetch partner');
    return res.json();
  },

  async createPartner(partnerData) {
    const res = await fetch(`${API_BASE}/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partnerData),
    });
    if (!res.ok) throw new Error('Failed to create partner');
    return res.json();
  },

  async updatePartnerStatus(partnerId, status) {
    const res = await fetch(`${API_BASE}/partners/${partnerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update partner status');
    return res.json();
  },

  // File Upload & Exchange
  async uploadFile(file, partnerId, direction = 'INCOMING') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('partnerId', partnerId);
    formData.append('direction', direction);

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async runQuickTest(testType, partnerId) {
    const res = await fetch(`${API_BASE}/files/quick-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testType, partnerId }),
    });
    if (!res.ok) throw new Error('Quick test payload execution failed');
    return res.json();
  },

  // S3 Explorer
  async getS3Objects(partnerId, category) {
    let url = `${API_BASE}/files/s3-explorer?`;
    if (partnerId) url += `partnerId=${encodeURIComponent(partnerId)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch S3 objects');
    return res.json();
  },

  getDownloadUrl(s3Key) {
    return `${API_BASE}/files/download?key=${encodeURIComponent(s3Key)}`;
  },

  async deleteS3Object(s3Key) {
    const res = await fetch(`${API_BASE}/files?key=${encodeURIComponent(s3Key)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete S3 file');
    return res.json();
  },

  // Transfers History
  async getTransfers(params = {}) {
    const query = new URLSearchParams();
    if (params.partnerId) query.append('partnerId', params.partnerId);
    if (params.status) query.append('status', params.status);
    if (params.direction) query.append('direction', params.direction);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/transfers?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transfers');
    return res.json();
  },

  async getTransferDetails(transferId) {
    const res = await fetch(`${API_BASE}/transfers/${transferId}`);
    if (!res.ok) throw new Error('Failed to fetch transfer details');
    return res.json();
  },

  // Security & Quarantine
  async getSecurityEvents(severity) {
    let url = `${API_BASE}/security/events`;
    if (severity) url += `?severity=${encodeURIComponent(severity)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch security events');
    return res.json();
  },

  async getQuarantinedFiles() {
    const res = await fetch(`${API_BASE}/security/quarantined`);
    if (!res.ok) throw new Error('Failed to fetch quarantined files');
    return res.json();
  },

  async resolveSecurityEvent(eventId) {
    const res = await fetch(`${API_BASE}/security/events/${eventId}/resolve`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to resolve security event');
    return res.json();
  }
};
