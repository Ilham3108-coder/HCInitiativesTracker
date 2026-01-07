// Theme Management System
// Handles light/dark mode switching across all pages

// Get current theme
function getTheme() {
    return localStorage.getItem('theme') || 'dark';
}

// Set theme
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // Update toggle if it exists
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.checked = (theme === 'dark');
    }
}

// Toggle between light and dark
function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Make functions globally available
window.getTheme = getTheme;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;

// Apply theme on page load
document.addEventListener('DOMContentLoaded', function () {
    const theme = getTheme();
    applyTheme(theme);
});
