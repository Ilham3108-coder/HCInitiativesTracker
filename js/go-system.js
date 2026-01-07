// Approval System for User-Submitted Initiatives
// Handles approval workflow for initiatives created by non-admin users

// Create approval notification for administrators
function createApprovalNotification(initiative) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

    const approvalNotification = {
        id: Date.now(),
        type: 'approval_request',
        title: 'New Initiative Approval Required',
        message: `"${initiative.name}" submitted by ${getCurrentUser().name || 'User'} requires your approval.`,
        initiativeId: initiative.id,
        initiativeName: initiative.name,
        submittedBy: getCurrentUser().name || 'User',
        timestamp: new Date().toISOString(),
        read: false,
        status: 'pending' // pending, approved, rejected
    };

    notifications.unshift(approvalNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Update notification badge
    updateNotificationBadge();
}

// Approve initiative
function approveInitiative(notificationId, initiativeId) {
    // Update initiative status
    const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
    const initiative = initiatives.find(i => i.id === initiativeId);

    if (initiative) {
        initiative.status = 'Not Started'; // Change from Pending Approval to Not Started
        initiative.approvedBy = getCurrentUser().name || 'Administrator';
        initiative.approvedAt = new Date().toISOString();
        localStorage.setItem('initiatives', JSON.stringify(initiatives));
    }

    // Update notification
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
        notification.status = 'approved';
        notification.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    // Create success notification for submitter
    const owner = initiative.createdBy || initiative.owner;
    createNotification(
        'success',
        `Initiative Approved: Your initiative "${initiative.name}" has been approved.`,
        owner
    );

    return true;
}

// Reject initiative
function rejectInitiative(notificationId, initiativeId, reason = '') {
    // Update initiative status
    const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
    const initiative = initiatives.find(i => i.id === initiativeId);

    if (initiative) {
        initiative.status = 'Cancelled';
        initiative.rejectedBy = getCurrentUser().name || 'Administrator';
        initiative.rejectedAt = new Date().toISOString();
        initiative.rejectionReason = reason;
        localStorage.setItem('initiatives', JSON.stringify(initiatives));
    }

    // Update notification
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
        notification.status = 'rejected';
        notification.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    // Create notification for submitter
    const owner = initiative.createdBy || initiative.owner;
    createNotification(
        'warning',
        `Initiative Rejected: Your initiative "${initiative.name}" was not approved.${reason ? ' Reason: ' + reason : ''}`,
        owner
    );

    return true;
}

// Get current user from localStorage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || '{"role": "Administrator", "name": "Admin"}');
}

// Create general notification
// Create notification - Proxy to Central Manager
function createNotification(type, message, user) {
    if (window.notificationManager) {
        window.notificationManager.add(type, message, user);
    }
}

// Update notification badge count
// Update Notification Badge - Proxy to Central Manager
function updateNotificationBadge() {
    if (window.notificationManager) {
        window.notificationManager.updateNotificationBadge();
    }
}

// Check if user can submit initiatives
function canUserSubmitInitiatives() {
    const user = getCurrentUser();
    return user.role === 'Administrator' || user.role === 'User';
}

// Check if user needs approval
function needsApproval() {
    const user = getCurrentUser();
    return user.role === 'User'; // Only User role needs approval
}

// Make functions globally available
window.createApprovalNotification = createApprovalNotification;
window.approveInitiative = approveInitiative;
window.rejectInitiative = rejectInitiative;
window.getCurrentUser = getCurrentUser;
window.createNotification = createNotification;
window.updateNotificationBadge = updateNotificationBadge;
window.canUserSubmitInitiatives = canUserSubmitInitiatives;
window.needsApproval = needsApproval;
