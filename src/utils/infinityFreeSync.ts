/**
 * InfinityFree PHP / MySQL API Client Service
 */

export interface InfinityFreeDbStatus {
  connected: boolean;
  host?: string;
  database?: string;
  user?: string;
  existing_tables?: string[];
  missing_tables?: string[];
  is_schema_ready?: boolean;
  error?: string;
  message?: string;
}

/**
 * Checks if the backend PHP / MySQL API on InfinityFree is reachable
 */
export async function checkInfinityFreeConnection(): Promise<InfinityFreeDbStatus> {
  try {
    const res = await fetch('/api/test_db.php', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      return {
        connected: false,
        error: errorJson?.message || `HTTP ${res.status}: Server returned error`
      };
    }

    const json = await res.json();
    return {
      connected: json.success === true,
      host: json.data?.host,
      database: json.data?.database,
      existing_tables: json.data?.existing_tables || [],
      missing_tables: json.data?.missing_tables || [],
      is_schema_ready: json.data?.is_schema_ready,
      message: json.message
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'API endpoint not reachable. App is running in standalone offline/preview mode.'
    };
  }
}

/**
 * Runs 1-Click Database Setup on InfinityFree via PHP
 */
export async function triggerInfinityFreeSetup(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/setup_db.php', {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });
    const json = await res.json();
    return {
      success: json.success === true,
      message: json.message || (json.success ? 'Database initialized successfully!' : 'Setup failed')
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to contact /api/setup_db.php: ' + err.message
    };
  }
}

/**
 * Syncs full application state to InfinityFree MySQL database
 */
export async function syncAllToInfinityFree(payload: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/sync.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return {
      success: json.success === true,
      message: json.message || (json.success ? 'Synchronized successfully!' : 'Sync failed')
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Sync error: ' + err.message
    };
  }
}

/**
 * Pulls all records from InfinityFree MySQL database
 */
export async function fetchAllFromInfinityFree(): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    const res = await fetch('/api/sync.php', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const json = await res.json();
    return {
      success: json.success === true,
      data: json.data,
      message: json.message || 'Retrieved records'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to fetch from /api/sync.php: ' + err.message
    };
  }
}
