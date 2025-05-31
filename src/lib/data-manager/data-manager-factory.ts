import { UnifiedDataManager } from './unified-data-manager';

/**
 * Data Manager Factory - Replaces problematic singleton pattern
 * 
 * PROBLEM WITH OLD SINGLETON:
 * - Single instance becomes corrupted on reset
 * - No proper cleanup mechanism  
 * - Race conditions during re-initialization
 * - Global state corruption
 * 
 * NEW APPROACH:
 * - Factory creates fresh instances
 * - Proper cleanup and disposal
 * - Instance isolation
 * - Deterministic re-initialization
 */

interface DataManagerInstance {
  manager: UnifiedDataManager;
  isActive: boolean;
  createdAt: number;
  instanceId: string;
}

class DataManagerFactory {
  private instances = new Map<string, DataManagerInstance>();
  private currentInstanceId: string | null = null;

  /**
   * Create a new data manager instance
   */
  async createInstance(password: string, instanceId?: string): Promise<UnifiedDataManager> {
    const id = instanceId || `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🏭 Creating new DataManager instance: ${id}`);
    
    // Create fresh instance
    const manager = new UnifiedDataManager(password);
    
    // Store instance metadata
    const instance: DataManagerInstance = {
      manager,
      isActive: false,
      createdAt: Date.now(),
      instanceId: id
    };
    
    this.instances.set(id, instance);
    
    try {
      // Initialize the instance
      await manager.initialize();
      instance.isActive = true;
      this.currentInstanceId = id;
      
      console.log(`✅ DataManager instance ${id} initialized successfully`);
      return manager;
      
    } catch (error) {
      console.error(`❌ Failed to initialize DataManager instance ${id}:`, error);
      // Clean up failed instance
      this.instances.delete(id);
      throw error;
    }
  }

  /**
   * Get the current active instance
   */
  getCurrentInstance(): UnifiedDataManager | null {
    if (!this.currentInstanceId) return null;
    
    const instance = this.instances.get(this.currentInstanceId);
    if (!instance || !instance.isActive) return null;
    
    return instance.manager;
  }

  /**
   * Properly dispose of an instance
   */
  async disposeInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    
    console.log(`🗑️ Disposing DataManager instance: ${instanceId}`);
    
    try {
      // Mark as inactive first
      instance.isActive = false;
      
      // If this was the current instance, clear it
      if (this.currentInstanceId === instanceId) {
        this.currentInstanceId = null;
      }
      
      // Cleanup any resources
      // Note: UnifiedDataManager doesn't have a dispose method yet, but we should add one
      if (typeof instance.manager.dispose === 'function') {
        await instance.manager.dispose();
      }
      
      // Remove from instances
      this.instances.delete(instanceId);
      
      console.log(`✅ DataManager instance ${instanceId} disposed successfully`);
      
    } catch (error) {
      console.error(`❌ Error disposing DataManager instance ${instanceId}:`, error);
      // Still remove it from our tracking
      this.instances.delete(instanceId);
    }
  }

  /**
   * Dispose all instances (nuclear cleanup)
   */
  async disposeAllInstances(): Promise<void> {
    console.log(`🧹 Disposing all DataManager instances (${this.instances.size} total)`);
    
    const disposePromises = Array.from(this.instances.keys()).map(id => 
      this.disposeInstance(id)
    );
    
    await Promise.all(disposePromises);
    
    this.currentInstanceId = null;
    console.log(`✅ All DataManager instances disposed`);
  }

  /**
   * Create a new instance and dispose the old one atomically
   */
  async replaceCurrentInstance(password: string): Promise<UnifiedDataManager> {
    console.log(`🔄 Replacing current DataManager instance`);
    
    // Get old instance ID before creating new one
    const oldInstanceId = this.currentInstanceId;
    
    try {
      // Create new instance first
      const newManager = await this.createInstance(password);
      
      // Dispose old instance after new one is ready
      if (oldInstanceId) {
        await this.disposeInstance(oldInstanceId);
      }
      
      console.log(`✅ DataManager instance replaced successfully`);
      return newManager;
      
    } catch (error) {
      console.error(`❌ Failed to replace DataManager instance:`, error);
      throw error;
    }
  }

  /**
   * Get diagnostic information about instances
   */
  getDiagnostics() {
    return {
      totalInstances: this.instances.size,
      currentInstanceId: this.currentInstanceId,
      instances: Array.from(this.instances.entries()).map(([id, instance]) => ({
        id,
        isActive: instance.isActive,
        createdAt: new Date(instance.createdAt).toISOString(),
        ageMs: Date.now() - instance.createdAt
      }))
    };
  }
}

// Export singleton factory (this is safe because factory manages instances)
export const dataManagerFactory = new DataManagerFactory();

/**
 * Get or create data manager instance
 * This replaces the old getDataManager singleton function
 */
export async function getDataManager(password: string, forceNew = false): Promise<UnifiedDataManager> {
  const currentInstance = dataManagerFactory.getCurrentInstance();
  
  if (currentInstance && !forceNew) {
    return currentInstance;
  }
  
  if (forceNew && currentInstance) {
    // Replace current instance
    return dataManagerFactory.replaceCurrentInstance(password);
  }
  
  // Create new instance
  return dataManagerFactory.createInstance(password);
}

/**
 * Clear all data and create fresh instance
 * This replaces the problematic clearAllData operation
 */
export async function resetDataManager(password: string): Promise<UnifiedDataManager> {
  console.log(`🔄 Resetting DataManager - full cleanup and recreation`);
  
  try {
    // Get current instance to clear database
    const currentInstance = dataManagerFactory.getCurrentInstance();
    
    if (currentInstance) {
      console.log('🗑️ Clearing database data before factory reset...');
      // Actually clear the database data using the current instance
      await currentInstance.clearAllData();
      console.log('✅ Database data cleared successfully');
    }
    
    // Dispose all existing instances
    await dataManagerFactory.disposeAllInstances();
    
    // Create fresh instance
    const newManager = await dataManagerFactory.createInstance(password);
    
    console.log(`✅ DataManager reset completed successfully`);
    return newManager;
    
  } catch (error) {
    console.error(`❌ DataManager reset failed:`, error);
    throw error;
  }
}

/**
 * Get factory diagnostics for debugging
 */
export function getDataManagerDiagnostics() {
  return dataManagerFactory.getDiagnostics();
} 