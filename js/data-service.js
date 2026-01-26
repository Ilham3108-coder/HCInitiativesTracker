/**
 * Data Service Layer
 * Centralizes data access for Projects/Initiatives.
 * Manages Sync between LocalStorage and Supabase Cloud.
 */

class DataService {
    constructor() {
        this.STORAGE_KEY = 'initiatives';
        const url = localStorage.getItem('supabase_url');
        const key = localStorage.getItem('supabase_key');

        if (window.SupabaseDB && url && key) {
            this.supabase = new window.SupabaseDB(url, key);
        } else {
            this.supabase = { isConnected: () => false };
        }
    }

    /**
     * Get all initiatives
     * Tries Cloud first if connected, falls back to Local.
     * Updates Local cache on successful Cloud fetch.
     */
    async getAllInitiatives() {
        let localData = this.getLocalData(); // Always have local ready

        if (this.supabase.isConnected()) {
            console.log('DataService: Fetching from Cloud...');
            const { data, error } = await this.supabase.getAllInitiatives();

            if (!error && data && data.length > 0) {
                console.log(`DataService: Cloud sync successful (${data.length} items)`);
                // Update Local Cache
                this.saveLocalData(data);
                return data;
            } else {
                console.warn('DataService: Cloud fetch failed or empty, using Local cache.', error);
            }
        }

        return localData;
    }

    /**
     * Save/Update an initiative
     * @param {Object} initiative 
     */
    async saveInitiative(initiative) {
        // 1. Save Local (Optimistic UI)
        const all = this.getLocalData();
        const idx = all.findIndex(i => i.id == initiative.id);

        if (idx >= 0) all[idx] = initiative;
        else all.push(initiative);

        this.saveLocalData(all);

        // 2. Sync to Cloud
        if (this.supabase.isConnected()) {
            // Don't await - let it happen in background? 
            // Better to await so we can show error if sync fails?
            // For checking "Save" button state, async is better.
            this.supabase.saveInitiative(initiative).then(({ error }) => {
                if (error) console.error('DataService: Cloud save failed', error);
                else console.log('DataService: Cloud save synced');
            });
        }
    }

    /**
     * Delete an initiative
     * @param {String|Number} id 
     */
    async deleteInitiative(id) {
        // 1. Delete Local
        const all = this.getLocalData();
        const filtered = all.filter(i => i.id != id);
        this.saveLocalData(filtered);

        // 2. Sync Cloud
        if (this.supabase.isConnected()) {
            this.supabase.deleteInitiative(id);
        }
    }

    // --- Helpers ---

    getLocalData() {
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            if (!Array.isArray(data)) return [];
            // Filter out nulls or empty objects to ensure fallback triggers
            return data.filter(i => i && i.name);
        } catch (e) {
            return [];
        }
    }

    saveLocalData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Set Supabase Config
     */
    configureCloud(url, key) {
        if (!url || !key) return;
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        // Reload page to init Supabase client
        window.location.reload();
    }

    disconnectCloud() {
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_key');
        window.location.reload();
    }
}

// Global Instance
window.dataService = new DataService();
