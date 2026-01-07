// js/notifications.js
// Notification System Manager - Centralized Version

class NotificationManager {
    constructor() {
        this.STORAGE_KEY = 'admin_notifications'; // System notifications
        this.READ_KEY = 'readNotifications'; // Read status for dynamic notifications
        this.MAX_NOTIFICATIONS = 50;
        this.init();
    }

    init() {
        // Initialize on load to update badges
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateBadges());
        } else {
            this.updateBadges();
        }

        // Listen for updates
        window.addEventListener('initiatives-updated', () => this.updateBadges());
        window.addEventListener('storage', (e) => {
            if (e.key === 'initiatives' || e.key === this.READ_KEY || e.key === this.STORAGE_KEY) {
                this.updateBadges();
            }
        });
    }

    // Get System notifications (Admin manually added)
    getSystemNotifications() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    }

    // Add a new system notification
    add(type, message, user) {
        const notifications = this.getSystemNotifications();

        const newNotification = {
            id: Date.now(),
            type: type, // 'info', 'warning', 'success', 'error'
            message: message,
            user: user, // username
            timestamp: new Date().toISOString(),
            read: false // System notifications have internal read state (legacy)
        };

        notifications.unshift(newNotification);

        if (notifications.length > this.MAX_NOTIFICATIONS) {
            notifications.pop();
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        window.dispatchEvent(new Event('notifications-updated')); // Notify others
        this.updateBadges(); // Update local badges

        console.log('🔔 Notification added:', message);
    }

    // Broadcast notification to all users
    broadcastToAllUsers(type, message, excludeUser = null) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const regularUsers = users.filter(u =>
            u.role === 'user' && u.username !== excludeUser
        );

        // For system notifications, we currently just log it or add to admin view
        // In a real backend, this would fan-out. Here, we just add to the shared admin log
        // intended for "System" messages. 
        // Note: The previous implementation just added multiple copies which is fine for now.
        regularUsers.forEach(user => {
            this.add(type, `${message} (For: ${user.username})`, user.username);
        });

        console.log(`📢 Broadcast notification to ${regularUsers.length} users:`, message);
    }

    // --- Dynamic Notifications (Initiatives) ---

    // Generate notifications based on current initiatives state
    generateAllNotifications() {
        const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
        const notifications = [];
        const today = new Date();

        // Get current user context safely
        const currentUser = localStorage.getItem('currentUser');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === currentUser);
        const role = user?.role || 'user';
        const userEntity = user?.entity || 'All';

        // Filter initiatives based on access control
        let visibleInitiatives = initiatives;
        if (role !== 'administrator' && role !== 'admin') {
            if (userEntity !== 'All') {
                visibleInitiatives = initiatives.filter(i => i.entity === userEntity);
            }
        }

        visibleInitiatives.forEach(initiative => {
            // 1. Overdue
            if (initiative.dueDate && initiative.status !== 'Done') {
                const dueDate = new Date(initiative.dueDate);
                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilDue < 0) {
                    notifications.push({
                        id: `overdue-${initiative.id}`,
                        type: 'overdue',
                        title: `Overdue: ${initiative.name}`,
                        message: `This initiative is ${Math.abs(daysUntilDue)} days overdue. Immediate action required.`,
                        time: initiative.dueDate,
                        initiative: initiative.name,
                        initiativeId: initiative.id,
                        priority: 'critical',
                        icon: 'clock',
                        color: '#ff8800',
                        entity: initiative.entity
                    });
                }
            }

            // 2. High Progress
            if (initiative.progress >= 75 && initiative.status === 'On Going') {
                notifications.push({
                    id: `progress-${initiative.id}`,
                    type: 'updates',
                    title: `High Progress: ${initiative.name}`,
                    message: `Initiative is at ${initiative.progress}% completion. Great progress!`,
                    time: new Date().toISOString(),
                    initiative: initiative.name,
                    initiativeId: initiative.id,
                    priority: 'normal',
                    icon: 'trending-up',
                    color: '#00ff9d',
                    entity: initiative.entity
                });
            }

            // 3. Completed
            if (initiative.status === 'Done') {
                notifications.push({
                    id: `completed-${initiative.id}`,
                    type: 'completed',
                    title: `Completed: ${initiative.name}`,
                    message: `Initiative has been successfully completed.`,
                    time: initiative.dueDate, // Approximate
                    initiative: initiative.name,
                    initiativeId: initiative.id,
                    priority: 'low',
                    icon: 'check-circle',
                    color: '#00ff9d',
                    entity: initiative.entity
                });
            }
        });

        // 4. Include System Notifications
        // Allow users to see notifications addressed to them
        const systemNotifications = this.getSystemNotifications();
        const userSystemNotifications = systemNotifications.filter(n =>
            n.user === user.username || n.user === 'All' || n.user === 'System' || (role === 'administrator' && !n.user)
        );

        const mappedSysNotifs = userSystemNotifications.map(n => ({
            id: `sys-${n.id}`,
            type: 'updates',
            title: n.title || 'System Notification',
            message: n.message,
            time: n.timestamp,
            initiative: 'System',
            initiativeId: null,
            priority: 'normal',
            icon: 'bell',
            color: '#0088ff',
            entity: 'All'
        }));
        notifications.push(...mappedSysNotifs);

        return notifications;
    }

    // Get read status IDs
    getReadIds() {
        return JSON.parse(localStorage.getItem(this.READ_KEY) || '[]');
    }

    // Mark a notification ID as read
    markAsRead(id) {
        const readIds = this.getReadIds();
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem(this.READ_KEY, JSON.stringify(readIds));
            this.updateBadges();
            return true;
        }
        return false;
    }

    markAllAsRead() {
        const all = this.generateAllNotifications();
        const readIds = all.map(n => n.id);
        localStorage.setItem(this.READ_KEY, JSON.stringify(readIds));
        this.updateBadges();
    }

    // --- Badge Logic ---

    updateBadges() {
        this.updateNotificationBadge();
        this.updateApprovalBadge();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const all = this.generateAllNotifications();
        const readIds = this.getReadIds();

        // Count unread
        const unreadCount = all.filter(n => !readIds.includes(n.id)).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'block'; // Or 'flex' depending on CSS
        } else {
            badge.style.display = 'none';
        }
    }

    updateApprovalBadge() {
        const badge = document.getElementById('approvalsBadge');
        if (!badge) return;

        // 1. Try RBAC (Best Source of Truth)
        if (window.rbac && typeof window.rbac.isAdmin === 'function') {
            if (!window.rbac.isAdmin()) {
                badge.style.display = 'none';
                return;
            }
        } else {
            // 2. Manual Check (Fallback)
            let isAdmin = false;
            let currentUserRaw = localStorage.getItem('currentUser');
            let userRole = '';

            if (currentUserRaw) {
                try {
                    // Try to parse as JSON object first
                    const parsed = JSON.parse(currentUserRaw);
                    if (parsed && parsed.role) {
                        userRole = parsed.role;
                    } else if (parsed && parsed.username) {
                        // Look up in users array if only username is stored (Case-insensitive)
                        const users = JSON.parse(localStorage.getItem('users') || '[]');
                        const found = users.find(u => (u.username || '').toLowerCase() === parsed.username.toLowerCase());
                        if (found) userRole = found.role;
                    }
                } catch (e) {
                    // It's a plain string username
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const found = users.find(u => (u.username || '').toLowerCase() === currentUserRaw.toLowerCase());
                    if (found) userRole = found.role;
                }
            }

            userRole = (userRole || '').toLowerCase();
            isAdmin = userRole === 'administrator' || userRole === 'admin';

            if (!isAdmin) {
                badge.style.display = 'none';
                return;
            }
        }

        // 3. Count Pending Initiatives (Loose Check)
        const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
        const pendingCount = initiatives.filter(i => {
            const status = (i.approvalStatus || '').toLowerCase();
            // Match 'pending', 'pending_update', 'pending approval', etc.
            return status.includes('pending');
        }).length;

        console.log('🔔 Approval Badge Update:', { pendingCount, visible: pendingCount > 0 });

        if (pendingCount > 0) {
            badge.textContent = pendingCount > 99 ? '99+' : pendingCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Global Instance
window.notificationManager = new NotificationManager();

// Helper for backward compatibility
window.addNotification = function (type, message, user) {
    window.notificationManager.add(type, message, user);
};


