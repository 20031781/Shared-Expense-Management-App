export * from './models';

export interface SyncQueueItem {
  id: string;
  entityType: 'expense' | 'list' | 'member' | 'reimbursement';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  synced: boolean;
}
