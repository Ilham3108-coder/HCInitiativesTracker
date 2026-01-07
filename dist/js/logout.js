// Logout confirmation functions
function confirmLogout(event) {
    event.preventDefault();
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function proceedLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html'; // Redirect to login page
}

// Close modal on outside click
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) closeLogoutModal();
        });
    }
});
