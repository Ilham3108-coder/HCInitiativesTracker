/**
 * Entity Filter Manager
 * Handles entity-based filtering for regular users across all pages
 */

(function () {
    'use strict';

    // Get current user info
    function getCurrentUserInfo() {
        const currentUsername = localStorage.getItem('currentUser');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = users.find(u => u.username === currentUsername);

        return {
            user: currentUser,
            isAdmin: currentUser && (currentUser.role === 'administrator' || currentUser.role === 'admin'),
            entity: currentUser?.entity || null
        };
    }

    // Apply entity filtering to data
    window.applyEntityFilter = function (data) {
        const userInfo = getCurrentUserInfo();

        // Admin sees all data
        if (userInfo.isAdmin) {
            return data;
        }

        // Regular user sees only their entity's data
        if (userInfo.entity) {
            return data.filter(item => item.entity === userInfo.entity);
        }

        return data;
    };

    // Hide entity sidebar for regular users
    // Hide entity sidebar for regular users
    window.hideEntitySidebarForUsers = function () {
        const userInfo = getCurrentUserInfo();

        if (!userInfo.isAdmin) {
            // Hide the ENTIRE sidebar container for users
            const sidebar = document.getElementById('mainSidebar');
            if (sidebar) {
                sidebar.style.display = 'none';
            }

            // Adjust the content wrapper to full width
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.style.gridTemplateColumns = '1fr';
            }
        }
    };

    // Filter initiatives based on user entity
    window.filterInitiativesByUserEntity = function (initiatives) {
        const userInfo = getCurrentUserInfo();

        // Admin sees all
        if (userInfo.isAdmin) {
            return initiatives;
        }

        // User sees only their entity
        if (userInfo.entity) {
            return initiatives.filter(i => i.entity === userInfo.entity);
        }

        return initiatives;
    };

    // Export for use in other scripts
    window.EntityFilter = {
        getCurrentUserInfo,
        applyEntityFilter,
        hideEntitySidebarForUsers,
        filterInitiativesByUserEntity
    };

    console.log('✅ Entity Filter Manager loaded');
})();
