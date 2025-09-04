(async function () {
    async function getAuthStatus() {
        try {
            const res = await fetch('/auth/status', { credentials: 'same-origin' });
            if (!res.ok) return { loggedIn: false };
            return await res.json();
        } catch (err) {
            return { loggedIn: false };
        }
    }

    function replaceLoginWithLogout(user) {
        // Change any anchor that currently points to /login --> /logout
        document.querySelectorAll('a[href="/login"]').forEach(a => {
            a.textContent = 'LOGOUT';
            a.href = '/logout';
            a.classList.add('logout-btn');
        });

        // Remove or hide signup links (pointing to /signup)
        document.querySelectorAll('a[href="/signup"]').forEach(a => {
            a.style.display = 'none';
        });

        // Add a profile/dashboard link (if there's a container to put it)
        // Try to find a common header container
        const headerRight = document.querySelector('.user-section') || document.querySelector('.header-content') || document.body;
        // Add a small "Hi, Name" link if not already present
        if (!document.querySelector('.nav-profile')) {
            const a = document.createElement('a');
            a.href = '/dashboard';
            a.className = 'nav-profile';
            a.style.marginLeft = '12px';
            a.style.color = 'inherit';
            a.style.textDecoration = 'none';
            a.style.fontWeight = '600';
            a.textContent = user && user.name ? `Hi, ${user.name.split(' ')[0]}` : 'Profile';
            headerRight.appendChild(a);
        }
    }

    function replaceLogoutWithLogin() {
        // change logout back to login if needed
        document.querySelectorAll('a[href="/logout"]').forEach(a => {
            a.textContent = 'Login';
            a.href = '/login';
            a.classList.remove('logout-btn');
        });

        // show signup back
        document.querySelectorAll('a[href="/signup"]').forEach(a => {
            a.style.display = '';
        });

        // remove profile link
        document.querySelectorAll('.nav-profile').forEach(el => el.remove());
    }

    const status = await getAuthStatus();
    if (status.loggedIn) {
        replaceLoginWithLogout(status.user);
    } else {
        replaceLogoutWithLogin();
    }
})();