// Data Synchronization and Conflict Resolution System
class DataSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.conflictQueue = [];
    this.lastSyncTime = this.getLastSyncTime();
    this.syncInProgress = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    
    this.init();
  }

  init() {
    this.setupNetworkListeners();
    this.setupPeriodicSync();
    this.setupBackgroundSync();
    this.loadPendingOperations();
    
    // Auto-sync when coming online
    if (this.isOnline) {
      this.performSync();
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showConnectionStatus('online');
      this.performSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showConnectionStatus('offline');
    });
  }

  setupPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performSync();
      }
    }, 5 * 60 * 1000);
  }

  setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register background sync
        return registration.sync.register('background-sync');
      }).catch(error => {
        console.log('Background sync not supported:', error);
      });
    }
  }

  loadPendingOperations() {
    this.syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    this.conflictQueue = JSON.parse(localStorage.getItem('conflict_queue') || '[]');
  }

  savePendingOperations() {
    localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    localStorage.setItem('conflict_queue', JSON.stringify(this.conflictQueue));
  }

  // Public API for adding operations to sync queue
  addToSyncQueue(operation) {
    const syncOperation = {
      id: this.generateOperationId(),
      type: operation.type,
      entity: operation.entity,
      data: operation.data,
      action: operation.action, // 'create', 'update', 'delete'
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      attempts: 0,
      status: 'pending'
    };

    this.syncQueue.push(syncOperation);
    this.savePendingOperations();

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.performSync();
    }

    return syncOperation.id;
  }

  async performSync() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.showSyncStatus('syncing');

    try {
      // Step 1: Pull latest data from server
      await this.pullDataFromServer();

      // Step 2: Resolve conflicts
      await this.resolveConflicts();

      // Step 3: Push local changes to server
      await this.pushDataToServer();

      // Step 4: Update last sync time
      this.updateLastSyncTime();

      this.showSyncStatus('completed');
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.showSyncStatus('failed');
    } finally {
      this.syncInProgress = false;
    }
  }

  async pullDataFromServer() {
    const entities = ['samples', 'lab-results', 'users', 'microorganisms', 'drugs'];
    
    for (const entity of entities) {
      try {
        const serverData = await this.fetchServerData(entity);
        const localData = this.getLocalData(entity);
        
        // Compare and identify conflicts
        const conflicts = this.identifyConflicts(entity, localData, serverData);
        
        if (conflicts.length > 0) {
          this.conflictQueue.push(...conflicts);
        }
        
        // Update local data with non-conflicting server changes
        this.updateLocalDataFromServer(entity, serverData, conflicts);
        
      } catch (error) {
        console.error(`Failed to pull ${entity} data:`, error);
      }
    }
  }

  async fetchServerData(entity) {
    const response = await fetch(`/api/${entity}?since=${this.lastSyncTime}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clsi_auth_token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${entity} data: ${response.statusText}`);
    }

    return await response.json();
  }

  getLocalData(entity) {
    const localData = localStorage.getItem(`local_${entity}`);
    return localData ? JSON.parse(localData) : [];
  }

  identifyConflicts(entity, localData, serverData) {
    const conflicts = [];
    
    serverData.forEach(serverItem => {
      const localItem = localData.find(item => item.id === serverItem.id);
      
      if (localItem && this.hasConflict(localItem, serverItem)) {
        conflicts.push({
          id: this.generateConflictId(),
          entity: entity,
          localData: localItem,
          serverData: serverItem,
          conflictType: this.determineConflictType(localItem, serverItem),
          timestamp: Date.now(),
          status: 'pending'
        });
      }
    });

    return conflicts;
  }

  hasConflict(localItem, serverItem) {
    // Check if both items have been modified since last sync
    const localModified = new Date(localItem.updatedAt || localItem.createdAt);
    const serverModified = new Date(serverItem.updatedAt || serverItem.createdAt);
    const lastSync = new Date(this.lastSyncTime);

    return localModified > lastSync && serverModified > lastSync;
  }

  determineConflictType(localItem, serverItem) {
    const localTime = new Date(localItem.updatedAt || localItem.createdAt);
    const serverTime = new Date(serverItem.updatedAt || serverItem.createdAt);

    if (localTime > serverTime) {
      return 'local_newer';
    } else if (serverTime > localTime) {
      return 'server_newer';
    } else {
      return 'simultaneous';
    }
  }

  updateLocalDataFromServer(entity, serverData, conflicts) {
    const conflictIds = conflicts.map(c => c.localData.id);
    const localData = this.getLocalData(entity);
    
    // Update non-conflicting items
    serverData.forEach(serverItem => {
      if (!conflictIds.includes(serverItem.id)) {
        const existingIndex = localData.findIndex(item => item.id === serverItem.id);
        
        if (existingIndex >= 0) {
          localData[existingIndex] = { ...serverItem, _synced: true };
        } else {
          localData.push({ ...serverItem, _synced: true });
        }
      }
    });

    localStorage.setItem(`local_${entity}`, JSON.stringify(localData));
  }

  async resolveConflicts() {
    const pendingConflicts = this.conflictQueue.filter(c => c.status === 'pending');
    
    for (const conflict of pendingConflicts) {
      try {
        const resolution = await this.resolveConflict(conflict);
        conflict.resolution = resolution;
        conflict.status = 'resolved';
        conflict.resolvedAt = Date.now();
        
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        conflict.status = 'failed';
        conflict.error = error.message;
      }
    }

    this.savePendingOperations();
  }

  async resolveConflict(conflict) {
    // Automatic conflict resolution strategies
    switch (conflict.conflictType) {
      case 'local_newer':
        return this.resolveWithLocalData(conflict);
      
      case 'server_newer':
        return this.resolveWithServerData(conflict);
      
      case 'simultaneous':
        return this.resolveSimultaneousConflict(conflict);
      
      default:
        throw new Error('Unknown conflict type');
    }
  }

  resolveWithLocalData(conflict) {
    // Use local data as the source of truth
    const resolution = {
      strategy: 'use_local',
      data: conflict.localData,
      reason: 'Local data is newer'
    };

    // Update local storage
    this.updateLocalEntity(conflict.entity, conflict.localData);
    
    // Add to sync queue to push to server
    this.addToSyncQueue({
      type: 'conflict_resolution',
      entity: conflict.entity,
      data: conflict.localData,
      action: 'update'
    });

    return resolution;
  }

  resolveWithServerData(conflict) {
    // Use server data as the source of truth
    const resolution = {
      strategy: 'use_server',
      data: conflict.serverData,
      reason: 'Server data is newer'
    };

    // Update local storage
    this.updateLocalEntity(conflict.entity, conflict.serverData);

    return resolution;
  }

  async resolveSimultaneousConflict(conflict) {
    // For simultaneous conflicts, try to merge data intelligently
    const mergedData = this.mergeConflictingData(conflict.localData, conflict.serverData);
    
    const resolution = {
      strategy: 'merge',
      data: mergedData,
      reason: 'Merged conflicting changes'
    };

    // Update local storage
    this.updateLocalEntity(conflict.entity, mergedData);
    
    // Add to sync queue to push merged data to server
    this.addToSyncQueue({
      type: 'conflict_resolution',
      entity: conflict.entity,
      data: mergedData,
      action: 'update'
    });

    return resolution;
  }

  mergeConflictingData(localData, serverData) {
    // Intelligent merging based on entity type
    const merged = { ...serverData }; // Start with server data as base

    // Merge specific fields based on business logic
    switch (localData.type || localData.entity) {
      case 'sample':
        return this.mergeSampleData(localData, serverData);
      
      case 'lab-result':
        return this.mergeLabResultData(localData, serverData);
      
      case 'user':
        return this.mergeUserData(localData, serverData);
      
      default:
        // Generic merge: prefer local data for user-editable fields
        const userEditableFields = ['notes', 'comments', 'status', 'priority'];
        userEditableFields.forEach(field => {
          if (localData[field] !== undefined) {
            merged[field] = localData[field];
          }
        });
        
        merged.updatedAt = new Date().toISOString();
        return merged;
    }
  }

  mergeSampleData(localData, serverData) {
    return {
      ...serverData,
      // Prefer local user inputs
      notes: localData.notes || serverData.notes,
      priority: localData.priority || serverData.priority,
      status: this.mergeStatus(localData.status, serverData.status),
      // Merge timestamps
      updatedAt: new Date().toISOString(),
      _conflictResolved: true
    };
  }

  mergeLabResultData(localData, serverData) {
    return {
      ...serverData,
      // Prefer local validation status
      validationStatus: localData.validationStatus || serverData.validationStatus,
      validatedBy: localData.validatedBy || serverData.validatedBy,
      comments: localData.comments || serverData.comments,
      // Merge results if both exist
      results: this.mergeResults(localData.results, serverData.results),
      updatedAt: new Date().toISOString(),
      _conflictResolved: true
    };
  }

  mergeUserData(localData, serverData) {
    return {
      ...serverData,
      // Prefer server data for security-related fields
      // Prefer local data for user preferences
      preferences: { ...serverData.preferences, ...localData.preferences },
      lastLoginAt: Math.max(
        new Date(localData.lastLoginAt || 0).getTime(),
        new Date(serverData.lastLoginAt || 0).getTime()
      ),
      updatedAt: new Date().toISOString(),
      _conflictResolved: true
    };
  }

  mergeStatus(localStatus, serverStatus) {
    // Status priority: completed > processing > received > pending
    const statusPriority = {
      'completed': 4,
      'processing': 3,
      'received': 2,
      'pending': 1
    };

    const localPriority = statusPriority[localStatus] || 0;
    const serverPriority = statusPriority[serverStatus] || 0;

    return localPriority >= serverPriority ? localStatus : serverStatus;
  }

  mergeResults(localResults, serverResults) {
    if (!localResults && !serverResults) return [];
    if (!localResults) return serverResults;
    if (!serverResults) return localResults;

    // Merge results by test ID, preferring local manual validations
    const merged = [...serverResults];
    
    localResults.forEach(localResult => {
      const existingIndex = merged.findIndex(r => r.testId === localResult.testId);
      
      if (existingIndex >= 0) {
        // Prefer local result if it has manual validation
        if (localResult.manuallyValidated) {
          merged[existingIndex] = localResult;
        }
      } else {
        merged.push(localResult);
      }
    });

    return merged;
  }

  updateLocalEntity(entity, data) {
    const localData = this.getLocalData(entity);
    const existingIndex = localData.findIndex(item => item.id === data.id);
    
    if (existingIndex >= 0) {
      localData[existingIndex] = { ...data, _synced: true };
    } else {
      localData.push({ ...data, _synced: true });
    }

    localStorage.setItem(`local_${entity}`, JSON.stringify(localData));
  }

  async pushDataToServer() {
    const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
    
    for (const operation of pendingOperations) {
      try {
        await this.pushOperationToServer(operation);
        operation.status = 'completed';
        operation.completedAt = Date.now();
        
      } catch (error) {
        console.error('Failed to push operation:', error);
        operation.attempts++;
        operation.lastError = error.message;
        
        if (operation.attempts >= this.retryAttempts) {
          operation.status = 'failed';
        } else {
          // Retry with exponential backoff
          setTimeout(() => {
            this.pushOperationToServer(operation);
          }, this.retryDelay * Math.pow(2, operation.attempts));
        }
      }
    }

    // Remove completed operations
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'completed');
    this.savePendingOperations();
  }

  async pushOperationToServer(operation) {
    const url = `/api/${operation.entity}${operation.action === 'update' ? `/${operation.data.id}` : ''}`;
    const method = this.getHttpMethod(operation.action);

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('clsi_auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: operation.action !== 'delete' ? JSON.stringify(operation.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  getHttpMethod(action) {
    switch (action) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  // Utility methods
  generateOperationId() {
    return 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateConflictId() {
    return 'conflict_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getCurrentUserId() {
    const userData = JSON.parse(localStorage.getItem('clsi_user_data') || '{}');
    return userData.id || 'unknown';
  }

  getLastSyncTime() {
    return localStorage.getItem('last_sync_time') || new Date(0).toISOString();
  }

  updateLastSyncTime() {
    const now = new Date().toISOString();
    localStorage.setItem('last_sync_time', now);
    this.lastSyncTime = now;
  }

  // UI feedback methods
  showConnectionStatus(status) {
    const indicator = document.getElementById('connectionStatus');
    if (indicator) {
      indicator.textContent = status === 'online' ? 'Online' : 'Offline';
      indicator.className = `connection-status ${status}`;
    }

    if (window.mobileBase && window.mobileBase.showToast) {
      const message = status === 'online' ? 'Connection restored' : 'Working offline';
      window.mobileBase.showToast(message, status === 'online' ? 'success' : 'info');
    }
  }

  showSyncStatus(status) {
    const indicator = document.getElementById('syncStatus');
    if (indicator) {
      const statusText = {
        'syncing': 'Syncing...',
        'completed': 'Synced',
        'failed': 'Sync failed'
      };
      
      indicator.textContent = statusText[status] || status;
      indicator.className = `sync-status ${status}`;
    }

    if (window.mobileBase && window.mobileBase.showToast && status !== 'syncing') {
      const message = status === 'completed' ? 'Data synchronized' : 'Sync failed';
      window.mobileBase.showToast(message, status === 'completed' ? 'success' : 'error');
    }
  }

  // Public API
  async forcSync() {
    if (!this.syncInProgress) {
      await this.performSync();
    }
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.syncQueue.filter(op => op.status === 'pending').length,
      pendingConflicts: this.conflictQueue.filter(c => c.status === 'pending').length,
      lastSyncTime: this.lastSyncTime
    };
  }

  getConflicts() {
    return this.conflictQueue.filter(c => c.status === 'pending');
  }

  async resolveConflictManually(conflictId, resolution) {
    const conflict = this.conflictQueue.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    conflict.resolution = resolution;
    conflict.status = 'resolved';
    conflict.resolvedAt = Date.now();
    conflict.resolvedBy = this.getCurrentUserId();

    // Apply resolution
    this.updateLocalEntity(conflict.entity, resolution.data);
    
    if (resolution.pushToServer) {
      this.addToSyncQueue({
        type: 'manual_conflict_resolution',
        entity: conflict.entity,
        data: resolution.data,
        action: 'update'
      });
    }

    this.savePendingOperations();
  }

  clearSyncHistory() {
    this.syncQueue = [];
    this.conflictQueue = [];
    this.savePendingOperations();
    localStorage.removeItem('last_sync_time');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  window.dataSyncManager = new DataSyncManager();
});

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSyncManager;
}