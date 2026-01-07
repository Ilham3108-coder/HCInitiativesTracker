// Apply menu names from localStorage
function applyMenuNames() {
    const savedNames = JSON.parse(localStorage.getItem('customMenuNames') || 'null');
    if (!savedNames) return;

    // Update menu items
    const menuItems = document.querySelectorAll('.nav-item .menu-text');
    menuItems.forEach(item => {
        const parent = item.closest('.nav-item');
        const href = parent.getAttribute('href');

        if (href && href.includes('dashboard')) item.textContent = savedNames.dashboard;
        else if (href && href.includes('projects')) item.textContent = savedNames.initiatives;
        else if (href && href.includes('owners')) item.textContent = savedNames.owners;
        else if (href && href.includes('analytics')) item.textContent = savedNames.analytics;
        else if (href && href.includes('notifications')) item.textContent = savedNames.notifications;
        else if (href && href.includes('timeline')) item.textContent = savedNames.timeline;
        else if (href && href.includes('user-management')) item.textContent = savedNames.userManagement || 'User Management';
        else if (href && href.includes('settings')) item.textContent = savedNames.settings;
    });
}

// Make function globally available
window.applyCustomMenuNames = applyMenuNames;

// Apply on page load
document.addEventListener('DOMContentLoaded', applyMenuNames);
