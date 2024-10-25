// Show login/sign up buttons initially
let isLoggedIn = false;

function showLogin() {
    // Add your login logic here
    isLoggedIn = true;
    updateAuthState();
}

function showSignup() {
    // Add your signup logic here
    isLoggedIn = true;
    updateAuthState();
}

function logout() {
    isLoggedIn = false;
    updateAuthState();
}

function updateAuthState() {
    const authOptions = document.getElementById('authOptions');
    const userOptions = document.getElementById('userOptions');

    if (isLoggedIn) {
        authOptions.style.display = 'none';
        userOptions.classList.add('active');
    } else {
        authOptions.style.display = 'flex';
        userOptions.classList.remove('active');
    }
}

// Call updateAuthState on page load to check login state
document.addEventListener('DOMContentLoaded', updateAuthState);
