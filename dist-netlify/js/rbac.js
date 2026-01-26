// js/rbac.js - Enhanced Role-Based Access Control with Approval Workflow
// Version 2.1 - Debug Enhanced

class RBAC {
    constructor() {
        console.log('🔐 RBAC Initializing...');
        this.currentUser = this.getCurrentUser();
        console.log('👤 Current User:', this.currentUser);
        console.log('🎭 Is Admin?', this.isAdmin());
        console.log('👥 Is User?', this.isUser());
        this.initializeApprovalSystem();
    }

    // Get current logged-in user
    getCurrentUser() {
        const username = localStorage.getItem('currentUser');
        console.log('📝 Username from localStorage:', username);

        if (!username) {
            console.warn('⚠️ No currentUser in localStorage');
            return null;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('👥 All users:', users.map(u => `${u.username} (${u.role})`));

        const user = users.find(u => u.username === username);
        console.log('✅ Found user:', user);

        // Add entity to user if not exists (for backward compatibility)
        if (user && !user.entity) {
            user.entity = 'All'; // Default entity
        }

        return user || null;
    }

    // Initialize approval system
    initializeApprovalSystem() {
        // Ensure initiatives have approval status
        const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
        let updated = false;

        console.log('🔧 Initializing approval system for', initiatives.length, 'initiatives');

        initiatives.forEach(init => {
            if (!init.approvalStatus) {
                init.approvalStatus = 'approved'; // Existing initiatives are auto-approved
                updated = true;
                console.log('✅ Auto-approved existing initiative:', init.name);
            }
            if (!init.createdBy) {
                init.createdBy = init.owner || 'admin';
                updated = true;
            }
        });

        if (updated) {
            localStorage.setItem('initiatives', JSON.stringify(initiatives));
            console.log('💾 Saved', initiatives.length, 'initiatives with approval status');
        } else {
            console.log('ℹ️ All initiatives already have approval status');
        }
    }

    // ============ ROLE CHECKS ============

    // Check if current user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role && (this.currentUser.role.toLowerCase() === 'admin' || this.currentUser.role.toLowerCase() === 'administrator');
    }

    // Check if current user is regular user
    isUser() {
        return this.currentUser && this.currentUser.role && this.currentUser.role.toLowerCase() === 'user';
    }

    // ============ PERMISSION CHECKS ============

    // Users CAN create initiatives (but need approval)
    canCreate() {
        return this.currentUser !== null; // Both admin and user can create
    }

    // Check if user can edit initiative
    canEdit(initiative) {
        if (this.isAdmin()) return true; // Admin can edit anything

        if (this.isUser()) {
            // User can only edit their own pending initiatives
            return initiative.createdBy === this.currentUser.username &&
                initiative.approvalStatus === 'pending';
        }

        return false;
    }

    // Check if user can delete initiative
    canDelete(initiative) {
        if (this.isAdmin()) return true; // Admin can delete anything

        if (this.isUser()) {
            // User can only delete their own pending initiatives
            return initiative.createdBy === this.currentUser.username &&
                initiative.approvalStatus === 'pending';
        }

        return false;
    }

    // Check if user can update progress (more permissive than canEdit)
    canUpdateProgress(initiative) {
        if (this.isAdmin()) return true; // Admin can update anything

        if (this.isUser()) {
            // User can update progress for:
            // 1. Approved initiatives from their entity
            // 2. Their own initiatives (any status)
            const isFromUserEntity = this.matchesUserEntity(initiative);
            const isApproved = initiative.approvalStatus === 'approved' || !initiative.approvalStatus;
            const isOwn = initiative.createdBy === this.currentUser.username;

            const canUpdate = (isFromUserEntity && isApproved) || isOwn;

            console.log(`🔍 canUpdateProgress for "${initiative.name}":`, {
                userEntity: this.currentUser?.entity,
                initiativeEntity: initiative.entity,
                isFromUserEntity,
                isApproved,
                isOwn,
                canUpdate
            });

            return canUpdate;
        }

        return false;
    }

    // Check if user can view initiative
    canView(initiative) {
        if (!this.currentUser) return false;
        if (this.isAdmin()) return true; // Admin sees all

        if (this.isUser()) {
            // User can see:
            // 1. Their own initiatives (any status)
            // 2. Approved initiatives from their entity
            return initiative.createdBy === this.currentUser.username ||
                (initiative.approvalStatus === 'approved' &&
                    this.matchesUserEntity(initiative));
        }

        return false;
    }

    // Check if initiative matches user's entity
    matchesUserEntity(initiative) {
        // If no current user, deny access
        if (!this.currentUser) {
            console.log('  ❌ matchesUserEntity: No current user');
            return false;
        }

        // If user has no entity assigned, deny access (should not happen)
        if (!this.currentUser.entity) {
            console.log('  ❌ matchesUserEntity: User has no entity assigned');
            return false;
        }

        // Admin with 'All' entity can see everything
        if (this.isAdmin() && this.currentUser.entity === 'All') {
            console.log('  ✅ matchesUserEntity: Admin with All entity');
            return true;
        }

        // For regular users, strictly match entity
        const matches = initiative.entity === this.currentUser.entity;
        console.log(`  ${matches ? '✅' : '❌'} matchesUserEntity: "${initiative.entity}" ${matches ? '===' : '!=='} "${this.currentUser.entity}"`);
        return matches;
    }

    // Filter initiatives based on user role and entity
    filterInitiatives(initiatives) {
        if (!this.currentUser) {
            console.warn('⚠️ No current user, returning empty array');
            return [];
        }

        console.log('🔍 FILTER DEBUG - Current User:', {
            username: this.currentUser.username,
            role: this.currentUser.role,
            entity: this.currentUser.entity,
            isAdmin: this.isAdmin(),
            isUser: this.isUser()
        });

        if (this.isAdmin()) {
            console.log('👑 Admin user - showing all', initiatives.length, 'initiatives');
            return initiatives; // Admin sees all
        }

        if (this.isUser()) {
            console.log('👤 Regular user - applying entity filter...');
            console.log('📊 Total initiatives before filter:', initiatives.length);

            const filtered = initiatives.filter((init, index) => {
                // User can see:
                // 1. Their own initiatives (any status)
                const isOwn = init.createdBy === this.currentUser.username;

                // 2. Approved initiatives from their entity
                const isApproved = init.approvalStatus === 'approved';
                const matchesEntity = this.matchesUserEntity(init);
                const isApprovedInEntity = isApproved && matchesEntity;

                const shouldShow = isOwn || isApprovedInEntity;

                // Debug first 5 initiatives
                if (index < 5) {
                    console.log(`  Initiative ${index + 1}: "${init.name}"`, {
                        entity: init.entity,
                        userEntity: this.currentUser.entity,
                        matchesEntity: matchesEntity,
                        isApproved: isApproved,
                        isOwn: isOwn,
                        shouldShow: shouldShow
                    });
                }

                return shouldShow;
            });

            console.log('✅ Filtered results:', {
                total: initiatives.length,
                filtered: filtered.length,
                userEntity: this.currentUser.entity,
                username: this.currentUser.username
            });

            return filtered;
        }

        console.warn('⚠️ Unknown user role, returning empty array');
        return [];
    }

    // ============ APPROVAL PERMISSIONS ============

    canApprove() {
        return this.isAdmin();
    }

    canReject() {
        return this.isAdmin();
    }

    // ============ ADMIN PERMISSIONS ============

    canManageUsers() {
        return this.isAdmin();
    }

    canAccessSettings() {
        return this.isAdmin();
    }

    canDelete(initiative) {
        if (this.isAdmin()) {
            return true; // Admin can delete anything
        }

        if (this.isUser()) {
            // Users can only delete their own pending or rejected initiatives
            const isOwn = initiative.createdBy === this.currentUser.username;
            const status = initiative.approvalStatus || 'approved';
            const notApproved = status !== 'approved';

            return isOwn && notApproved;
        }

        return false;
    }

    canExport() {
        return this.isAdmin();
    }

    canViewAllData() {
        return this.isAdmin();
    }

    // ============ DATA FILTERING ============

    // Filter initiatives based on user role and entity
    filterInitiatives(initiatives) {
        if (!this.currentUser) return [];

        if (this.isAdmin()) {
            // Admin sees everything
            console.log('👑 Admin view: showing all', initiatives.length, 'initiatives');
            return initiatives;
        }

        if (this.isUser()) {
            // User sees ONLY approved initiatives
            // Pending/rejected initiatives are hidden from main list
            const filtered = initiatives.filter(init => {
                // Treat initiatives without approvalStatus as approved (existing initiatives)
                const status = init.approvalStatus || 'approved';

                // Only show approved initiatives
                return status === 'approved';
            });

            console.log('👤 User view: showing', filtered.length, 'approved initiatives (hiding pending/rejected)');
            return filtered;
        }

        return [];
    }

    // Get pending approvals (admin only)
    getPendingApprovals() {
        if (!this.isAdmin()) return [];

        const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
        return initiatives.filter(init => init.approvalStatus === 'pending' || init.approvalStatus === 'pending_update');
    }

    // Get approval count for badge
    getPendingCount() {
        return this.getPendingApprovals().length;
    }

    // ============ APPROVAL ACTIONS ============

    approveInitiative(initiativeId) {
        if (!this.canApprove()) {
            this.showPermissionDenied();
            return false;
        }

        const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
        const initiative = initiatives.find(i => i.id === initiativeId);

        if (!initiative) {
            console.error('Initiative not found:', initiativeId);
            return false;
        }

        let notifType = 'approved';
        let notifMessage = `Your initiative "${initiative.name}" has been approved by ${this.currentUser.username}`;

        // Handle Pending Update Approval
        if (initiative.approvalStatus === 'pending_update' && initiative.pendingUpdate) {
            // Restore ID and other system fields just in case they were missing/overwritten incorrectly (though we deleted ID in creation)
            const updateData = initiative.pendingUpdate;
            const originalId = initiative.id;
            const originalCreatedBy = initiative.createdBy;

            // Merge updates
            Object.assign(initiative, updateData);

            // Restore protected fields
            initiative.id = originalId;
            initiative.createdBy = originalCreatedBy;

            // Clean up
            delete initiative.pendingUpdate;

            notifType = 'approved_update';
            notifMessage = `Your update request for "${initiative.name}" has been approved by ${this.currentUser.username}`;
        }

        initiative.approvalStatus = 'approved';
        initiative.approvedBy = this.currentUser.username;
        initiative.approvedAt = new Date().toISOString();

        localStorage.setItem('initiatives', JSON.stringify(initiatives));

        // Create notification for initiative creator
        this.createNotification({
            username: initiative.createdBy,
            type: notifType,
            message: notifMessage,
            initiativeId: initiative.id,
            initiativeName: initiative.name,
            timestamp: new Date().toISOString()
        });

        console.log('✅ Initiative approved:', initiative.name);
        return true;
    }

    rejectInitiative(initiativeId, reason) {
        if (!this.canReject()) {
            this.showPermissionDenied();
            return false;
        }

        const initiatives = JSON.parse(localStorage.getItem('initiatives') || '[]');
        const initiative = initiatives.find(i => i.id === initiativeId);

        if (!initiative) {
            console.error('Initiative not found:', initiativeId);
            return false;
        }

        let notifType = 'rejected';
        let notifMessage = `Your initiative "${initiative.name}" has been rejected. Reason: ${reason}`;

        if (initiative.approvalStatus === 'pending_update') {
            // Revert update request
            delete initiative.pendingUpdate;
            initiative.approvalStatus = 'approved'; // Revert to previous approved state

            notifType = 'rejected_update';
            notifMessage = `Your update request for "${initiative.name}" was rejected. Reason: ${reason}`;
        } else if (initiative.approvalStatus === 'pending_delete') {
            // Revert delete request
            initiative.approvalStatus = 'approved'; // Revert to active state

            notifType = 'rejected_delete';
            notifMessage = `Your request to delete "${initiative.name}" was rejected. The initiative remains active. Reason: ${reason}`;
        } else {
            // Normal rejection (for new initiatives)
            initiative.approvalStatus = 'rejected';
            initiative.rejectedBy = this.currentUser.username;
            initiative.rejectedAt = new Date().toISOString();
            initiative.rejectionReason = reason;
        }

        localStorage.setItem('initiatives', JSON.stringify(initiatives));

        // Create notification for initiative creator
        this.createNotification({
            username: initiative.createdBy,
            type: notifType,
            message: notifMessage,
            initiativeId: initiative.id,
            initiativeName: initiative.name,
            timestamp: new Date().toISOString()
        });

        console.log('❌ Initiative rejected:', initiative.name);
        return true;
    }

    // ============ NOTIFICATIONS ============

    createNotification(notificationData) {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

        const notification = {
            id: Date.now() + Math.random(),
            username: notificationData.username,
            type: notificationData.type,
            message: notificationData.message,
            initiativeId: notificationData.initiativeId,
            initiativeName: notificationData.initiativeName,
            timestamp: notificationData.timestamp || new Date().toISOString(),
            read: false
        };

        notifications.push(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));

        console.log('📬 Notification created for:', notificationData.username);
    }

    // ============ UI MANAGEMENT ============

    applyPermissions() {
        console.log('🔒 Applying RBAC permissions...');

        if (!this.currentUser) {
            console.warn('⚠️ No user logged in, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        console.log('🔐 Applying RBAC permissions for:', this.currentUser.username, '(Role:', this.currentUser.role + ')');

        // Hide/show elements based on role
        if (!this.canManageUsers()) {
            console.log('❌ Hiding User Management (user role)');
            const userMgmtLinks = document.querySelectorAll('a[href="user-management.html"]');
            userMgmtLinks.forEach(link => {
                link.style.display = 'none';
            });
        } else {
            console.log('✅ Showing User Management (admin role)');
        }

        if (!this.canAccessSettings()) {
            console.log('❌ Hiding Settings (user role)');
            const settingsLinks = document.querySelectorAll('a[href="settings.html"]');
            settingsLinks.forEach(link => {
                link.style.display = 'none';
            });
        } else {
            console.log('✅ Showing Settings (admin role)');
        }

        // Hide Approvals for non-admin
        if (!this.canApprove()) {
            console.log('❌ Hiding Approvals (user role)');
            const approvalsLinks = document.querySelectorAll('a[href="approvals.html"], #approvalsLink');
            approvalsLinks.forEach(link => {
                link.style.display = 'none';
            });
        } else {
            console.log('✅ Showing Approvals (admin role)');
        }

        // Add role badge
        this.addRoleBadge();
        if (this.isAdmin()) {
            document.body.classList.add('admin-view');

            // Auto-scroll to active item if needed
            setTimeout(() => this.autoScrollActiveItem(), 100);
        } else {
            document.body.classList.remove('admin-view');
        }
    }

    // Auto-scroll sidebar to active item
    autoScrollActiveItem() {
        const activeItem = document.querySelector('.sidebar .nav-item.active');
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
            console.log('📜 Auto-scrolled sidebar to:', activeItem.innerText.trim());
        }
    }

    // Add role badge to sidebar
    addRoleBadge() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || document.getElementById('roleBadge')) return;

        const roleColor = this.isAdmin() ? '#ff0055' : '#0088ff';
        const roleLabel = this.isAdmin() ? 'Administrator' : 'User';
        const entityInfo = this.currentUser.entity ? `Entity: ${this.currentUser.entity}` : '';

        const badge = document.createElement('div');
        badge.id = 'roleBadge';
        badge.style.cssText = `
            padding: 12px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            border-left: 3px solid ${roleColor};
            margin: 10px;
            font-size: 12px;
        `;
        badge.innerHTML = `
            <div style="color: var(--text-muted); margin-bottom: 4px; font-size: 10px;">LOGGED IN AS</div>
            <div style="color: white; font-weight: 600; margin-bottom: 6px;">${this.currentUser.username}</div>
            <div style="color: ${roleColor}; font-size: 11px; font-weight: 600; margin-bottom: 4px;">${roleLabel}</div>
            ${entityInfo ? `<div style="color: var(--text-muted); font-size: 10px;">${entityInfo}</div>` : ''}
        `;

        const logo = sidebar.querySelector('.logo');
        if (logo && logo.nextSibling) {
            sidebar.insertBefore(badge, logo.nextSibling);
        }
    }



    // Show permission denied message
    showPermissionDenied() {
        alert('⛔ You do not have permission to perform this action.');
    }

    // Show entity mismatch message
    showEntityMismatch() {
        alert('⚠️ You can only create initiatives for your assigned entity: ' + this.currentUser.entity);
    }
}

// Initialize RBAC
const rbac = new RBAC();

// Apply permissions when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    rbac.applyPermissions();
});

// Export for use in other scripts
window.rbac = rbac;
