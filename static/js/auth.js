document.addEventListener('DOMContentLoaded', () => {
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const nameGroup = document.getElementById('name-group');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const authSwitch = document.getElementById('auth-switch');
    const switchText = document.getElementById('switch-text');
    const authForm = document.getElementById('auth-form');

    let isLogin = true;

    function toggleAuth(forceLogin) {
        isLogin = forceLogin !== undefined ? forceLogin : !isLogin;

        if (isLogin) {
            loginToggle.classList.add('active');
            signupToggle.classList.remove('active');
            nameGroup.style.display = 'none';
            authTitle.textContent = 'Welcome Back';
            authSubtitle.textContent = 'Continue your journey to peak productivity.';
            submitBtn.textContent = 'Sign In';
            switchText.textContent = "Don't have an account?";
            authSwitch.textContent = 'Create one';
        } else {
            loginToggle.classList.remove('active');
            signupToggle.classList.add('active');
            nameGroup.style.display = 'block';
            authTitle.textContent = 'Join Cloud Buddy';
            authSubtitle.textContent = 'Start your path to efficient execution.';
            submitBtn.textContent = 'Get Started';
            switchText.textContent = "Already have an account?";
            authSwitch.textContent = 'Login';
        }
    }

    loginToggle.addEventListener('click', () => toggleAuth(true));
    signupToggle.addEventListener('click', () => toggleAuth(false));
    authSwitch.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuth();
    });

    // Handle Form Submission via Backend API
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('name') ? document.getElementById('name').value : '';

        const endpoint = isLogin ? '/login' : '/signup';
        const payload = isLogin ? { email, password } : { email, password, username };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                window.location.href = result.redirect;
            } else {
                alert(result.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth Error:', error);
            alert('An error occurred. Please try again.');
        }
    });
});
