/**
 * Supabase Client Wrapper
 * Handles direct interaction with Supabase API.
 * Uses a 'content' JSONB column to store the full initiative object, avoiding strict schema issues.
 */

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.client = null;
        this.tableName = 'initiatives';

        if (url && key && window.supabase) {
            try {
                this.client = window.supabase.createClient(url, key);
                console.log('Supabase Client Initialized');
            } catch (e) {
                console.error('Supabase Init Error:', e);
            }
        }
    }

    isConnected() {
        return !!this.client;
    }

    /**
     * Get all initiatives
     * Unwraps the 'content' JSONB column.
     */
    async getAllInitiatives() {
        if (!this.client) return { error: 'Not connected' };

        const { data, error } = await this.client
            .from(this.tableName)
            .select('*');

        if (error) {
            console.error('Supabase Fetch Error:', error);
            return { data: null, error };
        }

        // Unwrap: If the table uses 'content' column, use it. Otherwise use row as is.
        const initiatives = data.map(row => {
            if (row.content && typeof row.content === 'object') {
                // Ensure ID is synced if missing in content (rare)
                return { ...row.content, id: row.id };
            }
            return row;
        });

        return { data: initiatives, error: null };
    }

    /**
     * Save (Upsert) an initiative
     * Wraps data into 'content' column.
     */
    async saveInitiative(initiative) {
        if (!this.client) return { error: 'Not connected' };

        // Wrapper Payload
        const payload = {
            id: initiative.id, // PK for Supabase
            content: initiative, // JSONB Payload
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.client
            .from(this.tableName)
            .upsert(payload)
            .select();

        if (error) console.error('Supabase Save Error:', error);
        return { data, error };
    }

    /**
     * Delete an initiative
     */
    async deleteInitiative(id) {
        if (!this.client) return { error: 'Not connected' };

        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) console.error('Supabase Delete Error:', error);
        return { error };
    }
}

// Export to window
window.SupabaseDB = SupabaseClient;
