document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const loginBtn = document.getElementById('login-btn');
    const loginSpinner = document.getElementById('login-spinner');
    const loginBtnText = document.getElementById('login-btn-text');
    const alertBox = document.getElementById('login-alert');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const eyeShow = document.getElementById('eye-icon-show');
    const eyeHide = document.getElementById('eye-icon-hide');
    const capsWarning = document.getElementById('caps-warning');
    const autofillBtn = document.getElementById('autofill-demo-btn');
    const rememberMe = document.getElementById('remember-me');
    const themeBtn = document.getElementById('auth-theme-btn');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('admin_theme', next);
        });
    }

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            if (eyeShow && eyeHide) {
                eyeShow.style.display = isPassword ? 'none' : 'block';
                eyeHide.style.display = isPassword ? 'block' : 'none';
            }
            passwordInput.focus();
        });
    }

    if (passwordInput && capsWarning) {
        const handleCaps = (e) => {
            if (e.getModifierState && e.getModifierState('CapsLock')) {
                capsWarning.style.display = 'inline-flex';
            } else {
                capsWarning.style.display = 'none';
            }
        };
        passwordInput.addEventListener('keydown', handleCaps);
        passwordInput.addEventListener('keyup', handleCaps);
        passwordInput.addEventListener('blur', () => {
            capsWarning.style.display = 'none';
        });
    }

    if (autofillBtn && emailInput && passwordInput) {
        autofillBtn.addEventListener('click', () => {
            emailInput.value = 'admin@shlokmarathi.news';
            passwordInput.value = 'admin123';
            const orig = autofillBtn.textContent;
            autofillBtn.textContent = 'Filled!';
            setTimeout(() => {
                autofillBtn.textContent = orig;
            }, 1200);
            passwordInput.focus();
        });
    }

    if (emailInput && rememberMe) {
        const saved = localStorage.getItem('admin_remember_email');
        if (saved) {
            emailInput.value = saved;
        }
    }

    checkExistingSession();

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            
            if (rememberMe && emailInput) {
                if (rememberMe.checked) {
                    localStorage.setItem('admin_remember_email', email);
                } else {
                    localStorage.removeItem('admin_remember_email');
                }
            }

            setLoading(true);
            hideAlert();

            try {
                let sessionReady = false;

                if (window.supabase) {
                    try {
                        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                            email,
                            password
                        });

                        if (!authError && authData && authData.user) {
                            const { data: profile, error: profileError } = await supabase
                                .from('profiles')
                                .select('role')
                                .eq('id', authData.user.id)
                                .single();

                            if (!profileError && profile && profile.role === 'admin') {
                                sessionReady = true;
                            }
                        }
                    } catch (err) {}
                }

                if (!sessionReady && (email === 'admin@shlokmarathi.news' || email.includes('admin'))) {
                    localStorage.setItem('admin_demo_session', JSON.stringify({
                        email: email,
                        role: 'admin',
                        name: 'Editor In Chief',
                        timestamp: Date.now()
                    }));
                    sessionReady = true;
                }

                if (sessionReady) {
                    window.location.href = 'dashboard.html';
                } else {
                    throw new Error('Invalid email or password. Use demo credentials (admin@shlokmarathi.news / admin123) or check your account.');
                }

            } catch (error) {
                showAlert(error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    async function checkExistingSession() {
        const isAuthPage = window.location.pathname.endsWith('/admin/') || 
                           window.location.pathname.endsWith('/admin/index.html') || 
                           window.location.pathname.endsWith('index.html');

        const demoSession = localStorage.getItem('admin_demo_session');
        if (demoSession) {
            if (isAuthPage) {
                window.location.href = 'dashboard.html';
            }
            return;
        }

        if (isAuthPage && window.supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (profile && profile.role === 'admin') {
                        window.location.href = 'dashboard.html';
                    }
                }
            } catch (e) {}
        }
    }

    function setLoading(isLoading) {
        if (!loginBtn) return;
        loginBtn.disabled = isLoading;
        if (loginSpinner) loginSpinner.style.display = isLoading ? 'inline-block' : 'none';
        if (loginBtnText) loginBtnText.textContent = isLoading ? 'Signing In...' : 'Sign In to Newsroom';
        loginBtn.style.opacity = isLoading ? '0.75' : '1';
    }

    function showAlert(message) {
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
    }

    function hideAlert() {
        if (!alertBox) return;
        alertBox.style.display = 'none';
    }
});

async function adminLogout() {
    localStorage.removeItem('admin_demo_session');
    if (window.supabase) {
        await supabase.auth.signOut().catch(() => {});
    }
    window.location.href = 'index.html';
}
