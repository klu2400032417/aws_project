import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TransferFamilyNoticeBanner from './components/TransferFamilyNoticeBanner';
import DashboardView from './components/DashboardView';
import PartnersView from './components/PartnersView';
import FileUploadView from './components/FileUploadView';
import S3ExplorerView from './components/S3ExplorerView';
import TransferHistoryView from './components/TransferHistoryView';
import SecurityView from './components/SecurityView';
import ArchitectureView from './components/ArchitectureView';
import CloudWatchLogsWidget from './components/CloudWatchLogsWidget';
import TransferDetailModal from './components/TransferDetailModal';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [partnersError, setPartnersError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [s3Objects, setS3Objects] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [cloudWatchLogs, setCloudWatchLogs] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showLogsWidget, setShowLogsWidget] = useState(false);

  // Fetch all live data
  const loadData = useCallback(async () => {
    try {
      const [status, stats, recent, parts, objs, txs, sec, logs] = await Promise.allSettled([
        api.getSystemStatus(),
        api.getDashboardStats(),
        api.getRecentTransfers(),
        api.getPartners(),
        api.getS3Objects(),
        api.getTransfers(),
        api.getSecurityEvents(),
        api.getCloudWatchLogs(50)
      ]);

      if (status.status === 'fulfilled') setSystemStatus(status.value);
      if (stats.status === 'fulfilled') setDashboardStats(stats.value);
      if (recent.status === 'fulfilled') setRecentTransfers(recent.value);
      if (parts.status === 'fulfilled') {
        setPartners(parts.value);
        setPartnersError('');
      } else {
        setPartnersError('Unable to load partners from the backend. Please try refreshing.');
      }
      if (objs.status === 'fulfilled') setS3Objects(objs.value);
      if (txs.status === 'fulfilled') setTransfers(txs.value);
      if (sec.status === 'fulfilled') setSecurityEvents(sec.value);
      if (logs.status === 'fulfilled') setCloudWatchLogs(logs.value);
      const failedSources = [
        ['system status', status],
        ['dashboard statistics', stats],
        ['recent transfers', recent],
        ['partners', parts],
        ['storage objects', objs],
        ['transfers', txs],
        ['security events', sec],
        ['CloudWatch logs', logs]
      ].filter(([, result]) => result.status === 'rejected').map(([name]) => name);
      setLoadError(failedSources.length
        ? `Unable to load: ${failedSources.join(', ')}. Refresh or check backend/AWS availability.`
        : '');
    } catch (err) {
      console.error('Error loading data:', err);
      setLoadError('Unable to load backend data. Refresh or check backend/AWS availability.');
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 12 seconds
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handlers
  const handleUploadFile = async (file, partnerId, direction) => {
    const res = await api.uploadFile(file, partnerId, direction);
    await loadData();
    return res;
  };

  const handleTogglePartnerStatus = async (partnerId, newStatus) => {
    await api.updatePartnerStatus(partnerId, newStatus);
    await loadData();
  };

  const handleCreatePartner = async (partnerData) => {
    await api.createPartner(partnerData);
    await loadData();
  };

  const handleDeleteS3Object = async (s3Key) => {
    if (window.confirm(`Are you sure you want to delete S3 object: ${s3Key}?`)) {
      await api.deleteS3Object(s3Key);
      await loadData();
    }
  };

  const handleResolveSecurityEvent = async (eventId) => {
    await api.resolveSecurityEvent(eventId);
    await loadData();
  };

  const quarantinedTransfers = transfers.filter(t => t.status === 'QUARANTINED');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        systemStatus={systemStatus}
        onRefresh={loadData}
        onOpenArchitecture={() => setCurrentTab('architecture')}
        onToggleLogs={() => setShowLogsWidget(!showLogsWidget)}
        showLogs={showLogsWidget}
      />

      {/* Prominent Transfer Family Notice Banner */}
      <TransferFamilyNoticeBanner
        onOpenArchitecture={() => setCurrentTab('architecture')}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setTab={setCurrentTab}
          stats={dashboardStats}
        />

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/60">
          <div className="max-w-7xl mx-auto">
            {loadError && (
              <div role="alert" className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
                {loadError}
              </div>
            )}
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={dashboardStats}
                recentTransfers={recentTransfers}
                onSelectTransfer={setSelectedTransfer}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'partners' && (
              <PartnersView
                partners={partners}
                error={partnersError}
                onRefresh={loadData}
                onCreatePartner={handleCreatePartner}
                onToggleStatus={handleTogglePartnerStatus}
              />
            )}

            {currentTab === 'upload' && (
              <FileUploadView
                partners={partners}
                onUploadFile={handleUploadFile}
                onSelectTransfer={setSelectedTransfer}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 's3explorer' && (
              <S3ExplorerView
                s3Objects={s3Objects}
                partners={partners}
                bucketName={systemStatus?.s3Bucket}
                onRefresh={loadData}
                onDeleteObject={handleDeleteS3Object}
              />
            )}

            {currentTab === 'transfers' && (
              <TransferHistoryView
                transfers={transfers}
                partners={partners}
                onRefresh={loadData}
                onSelectTransfer={setSelectedTransfer}
              />
            )}

            {currentTab === 'security' && (
              <SecurityView
                securityEvents={securityEvents}
                quarantinedTransfers={quarantinedTransfers}
                onRefresh={loadData}
                onResolveEvent={handleResolveSecurityEvent}
                onSelectTransfer={setSelectedTransfer}
              />
            )}

            {currentTab === 'architecture' && (
              <ArchitectureView />
            )}
          </div>
        </main>
      </div>

      {/* Bottom Collapsible CloudWatch Logs Console */}
      {showLogsWidget && (
        <CloudWatchLogsWidget
          logs={cloudWatchLogs}
          onClose={() => setShowLogsWidget(false)}
          onRefresh={loadData}
        />
      )}

      {/* Transfer Inspector Modal */}
      {selectedTransfer && (
        <TransferDetailModal
          transfer={selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
        />
      )}
    </div>
  );
}
