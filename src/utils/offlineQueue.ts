import { Harvest, harvestService } from '../services/api';

interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'farmer_app_offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedOperation[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
    
    // Auto-sync when app starts if online
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('Connection restored - syncing offline queue');
      this.isOnline = true;
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost - enabling offline mode');
      this.isOnline = false;
    });
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add operation to queue
  queueOperation(type: QueuedOperation['type'], data: any): string {
    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(operation);
    this.saveQueue();

    console.log(`Queued ${type} operation:`, operation);

    // Try to sync if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncQueue();
    }

    return operation.id;
  }

  // Sync all queued operations
  async syncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Syncing ${this.queue.length} queued operations...`);

    const successfulOperations: string[] = [];

    for (const operation of this.queue) {
      try {
        await this.executeOperation(operation);
        successfulOperations.push(operation.id);
        console.log(`Successfully synced operation ${operation.id}`);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        operation.retryCount++;
        
        // Remove operation if max retries reached
        if (operation.retryCount >= MAX_RETRIES) {
          console.warn(`Max retries reached for operation ${operation.id}, removing from queue`);
          successfulOperations.push(operation.id);
        }
      }
    }

    // Remove successful operations from queue
    this.queue = this.queue.filter(op => !successfulOperations.includes(op.id));
    this.saveQueue();

    this.syncInProgress = false;
    
    if (successfulOperations.length > 0) {
      console.log(`Successfully synced ${successfulOperations.length} operations`);
    }
  }

  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE':
        await harvestService.createHarvest(operation.data);
        break;
      case 'UPDATE':
        await harvestService.updateHarvest(operation.data.id, operation.data.updates);
        break;
      case 'DELETE':
        await harvestService.deleteHarvest(operation.data.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Get queue status
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      syncInProgress: this.syncInProgress,
    };
  }

  // Clear queue (for testing/debugging)
  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  // Add harvest to offline queue
  async queueHarvest(harvest: Omit<Harvest, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.queueOperation('CREATE', harvest);
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueueManager();

// Helper function to check if device is online
export const isOnline = (): boolean => navigator.onLine;

// Helper function to get queue status
export const getOfflineStatus = () => offlineQueue.getQueueStatus();