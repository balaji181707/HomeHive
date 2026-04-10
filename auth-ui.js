// Utility to decode JWT without external libraries
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

let isLoginMode = true;

function toggleAuthModal() {
    const modal = document.getElementById('authModal');
    if(modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function switchAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Login to HomeHive' : 'Create an Account';
    document.getElementById('authSwitchText').innerText = isLoginMode ? "Don't have an account? Signup" : "Already have an account? Login";
    
    const nameInput = document.getElementById('authName');
    nameInput.style.display = isLoginMode ? 'none' : 'block';
    
    if(!isLoginMode) {
        nameInput.setAttribute('required', 'true');
    } else {
        nameInput.removeAttribute('required');
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    try {
        if (isLoginMode) {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('hh_token', res.token);
            alert("✓ " + res.message);
        } else {
            const name = document.getElementById('authName').value;
            const res = await api.post('/auth/signup', { name, email, password });
            localStorage.setItem('hh_token', res.token);
            alert("✓ " + res.message);
        }
        toggleAuthModal();
        updateNavAuth();
        
        if (typeof filterListings === "function") filterListings();
        
    } catch(err) {
        alert("Authentication Error: " + err.message);
    }
}

function updateNavAuth() {
    const token = localStorage.getItem('hh_token');
    const authNavItem = document.getElementById('authNavItem');
    
    // Find the Admin navigation link to handle Role Based logic
    const adminLink = document.querySelector('a[href="admin-login.html"]');

    if(token) {
        if(authNavItem) authNavItem.innerHTML = `<button class="reset-filter-btn" style="padding: 0.5rem 1rem; margin:0;" onclick="logout()">Log Out</button>`;
        
        // Extract Data Payload from Token securely
        const decoded = decodeJWT(token);
        
        // Hide Admin Button if user is not an Admin!
        if (decoded && decoded.role !== 'admin' && adminLink) {
            adminLink.parentElement.style.display = 'none';
        } else if (adminLink) {
            adminLink.parentElement.style.display = 'inline-block';
        }
        
    } else {
        if(authNavItem) authNavItem.innerHTML = `<button class="apply-filter-btn" style="padding: 0.5rem 1rem; margin:0;" onclick="toggleAuthModal()">Log In</button>`;
        
        // Show Admin Button by default when not logged in so Admins can access it
        if(adminLink) {
            adminLink.parentElement.style.display = 'inline-block';
        }
    }
}

function logout() {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_admin_token');
    window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
    // If not logged in, bounce to portal immediately
    if(!localStorage.getItem('hh_token') && !window.location.pathname.endsWith('index.html')) {
        window.location.replace('index.html');
    }
});
