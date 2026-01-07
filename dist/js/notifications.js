// js/notifications.js
// Notification System Manager

class NotificationManager {
    constructor() {
        this.STORAGE_KEY = 'admin_notifications';
        this.MAX_NOTIFICATIONS = 50;
    }

    // Get all notifications
    getAll() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    }

    // Add a new notification
    add(type, message, user) {
        const notifications = this.getAll();

        const newNotification = {
            id: Date.now(),
            type: type, // 'info', 'warning', 'success', 'error'
            message: message,
            user: user, // username
            timestamp: new Date().toISOString(),
            read: false
        };

        // Add to beginning
        notifications.unshift(newNotification);

        // Limit size
        if (notifications.length > this.MAX_NOTIFICATIONS) {
            notifications.pop();
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));

        // Trigger event for real-time updates
        window.dispatchEvent(new Event('notifications-updated'));

        console.log('🔔 Notification added:', message);
    }

    // Broadcast notification to all users (for admin actions)
    broadcastToAllUsers(type, message, excludeUser = null) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const regularUsers = users.filter(u =>
            u.role === 'user' && u.username !== excludeUser
        );

        regularUsers.forEach(user => {
            this.add(type, message, user.username);
        });

        console.log(`📢 Broadcast notification to ${regularUsers.length} users:`, message);
    }

    // Mark all as read
    markAllRead() {
        const notifications = this.getAll();
        notifications.forEach(n => n.read = true);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        window.dispatchEvent(new Event('notifications-updated'));
    }

    // Get unread count
    getUnreadCount() {
        return this.getAll().filter(n => !n.read).length;
    }

    // Parse timestamp to relative time
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";

        return "Just now";
    }
}

// Global Instance
window.notificationManager = new NotificationManager();

// Helper for global access
window.addNotification = function (type, message, user) {
    window.notificationManager.add(type, message, user);
};
