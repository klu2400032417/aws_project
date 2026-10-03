package com.aws.partner.fileexchange.model;

import java.util.List;
import java.util.Map;

public class DashboardStats {
    private long totalPartners;
    private long activePartners;
    private long suspendedPartners;
    private long totalTransfers;
    private long successfulTransfers; // VALIDATED
    private long quarantinedFiles;    // QUARANTINED
    private long duplicateFiles;      // DUPLICATE
    private long failedTransfers;     // FAILED
    private long totalSecurityEvents;
    private long totalBytesTransferred;
    private double successRatePercent;
    private List<Map<String, Object>> transfersByHour;
    private List<Map<String, Object>> filesByStatus;
    private List<Map<String, Object>> partnerVolume;

    public DashboardStats() {}

    public long getTotalPartners() { return totalPartners; }
    public void setTotalPartners(long totalPartners) { this.totalPartners = totalPartners; }

    public long getActivePartners() { return activePartners; }
    public void setActivePartners(long activePartners) { this.activePartners = activePartners; }

    public long getSuspendedPartners() { return suspendedPartners; }
    public void setSuspendedPartners(long suspendedPartners) { this.suspendedPartners = suspendedPartners; }

    public long getTotalTransfers() { return totalTransfers; }
    public void setTotalTransfers(long totalTransfers) { this.totalTransfers = totalTransfers; }

    public long getSuccessfulTransfers() { return successfulTransfers; }
    public void setSuccessfulTransfers(long successfulTransfers) { this.successfulTransfers = successfulTransfers; }

    public long getQuarantinedFiles() { return quarantinedFiles; }
    public void setQuarantinedFiles(long quarantinedFiles) { this.quarantinedFiles = quarantinedFiles; }

    public long getDuplicateFiles() { return duplicateFiles; }
    public void setDuplicateFiles(long duplicateFiles) { this.duplicateFiles = duplicateFiles; }

    public long getFailedTransfers() { return failedTransfers; }
    public void setFailedTransfers(long failedTransfers) { this.failedTransfers = failedTransfers; }

    public long getTotalSecurityEvents() { return totalSecurityEvents; }
    public void setTotalSecurityEvents(long totalSecurityEvents) { this.totalSecurityEvents = totalSecurityEvents; }

    public long getTotalBytesTransferred() { return totalBytesTransferred; }
    public void setTotalBytesTransferred(long totalBytesTransferred) { this.totalBytesTransferred = totalBytesTransferred; }

    public double getSuccessRatePercent() { return successRatePercent; }
    public void setSuccessRatePercent(double successRatePercent) { this.successRatePercent = successRatePercent; }

    public List<Map<String, Object>> getTransfersByHour() { return transfersByHour; }
    public void setTransfersByHour(List<Map<String, Object>> transfersByHour) { this.transfersByHour = transfersByHour; }

    public List<Map<String, Object>> getFilesByStatus() { return filesByStatus; }
    public void setFilesByStatus(List<Map<String, Object>> filesByStatus) { this.filesByStatus = filesByStatus; }

    public List<Map<String, Object>> getPartnerVolume() { return partnerVolume; }
    public void setPartnerVolume(List<Map<String, Object>> partnerVolume) { this.partnerVolume = partnerVolume; }
}
