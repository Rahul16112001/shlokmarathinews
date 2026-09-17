// /js/auth.js

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we are on login or register pages to avoid redirect loops, but actually public pages shouldn't block.
    
    // Auth UI elements
    const loginBtn = document.getElementById('nav-login-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');

    // Display elements
    const navAvatar = document.getElementById('user-nav-avatar');
    const navName = document.getElementById('user-nav-name');
    const dropdownAvatar = document.getElementById('user-dropdown-avatar');
    const dropdownName = document.getElementById('user-dropdown-name');
    const dropdownEmail = document.getElementById('user-dropdown-email');
    
    // Profile page elements
    const profilePageAvatar = document.getElementById('profile-page-avatar');
    const profilePageName = document.getElementById('profile-page-name');
    const profilePageEmail = document.getElementById('profile-page-email');
    const profilePageJoined = document.getElementById('profile-page-joined');
    const profilePageRole = document.getElementById('profile-page-role');

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // State
    let currentUser = null;
    let currentProfile = null;

    // Helper: Show Error
    function showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) {
            const textEl = document.getElementById(elementId + '-text');
            if (textEl) {
                textEl.textContent = message;
                el.style.display = 'flex'; // For the new flex-based alert
            } else {
                el.textContent = message;
                el.style.display = 'block';
            }
        }
    }

    // Helper: Hide Error
    function hideError(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.style.display = 'none';
        }
    }

    function setupPasswordToggle(toggleId, inputId) {
        const toggleBtn = document.getElementById(toggleId);
        const inputEl = document.getElementById(inputId);
        if (toggleBtn && inputEl) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = inputEl.getAttribute('type') === 'password';
                const nextType = isPassword ? 'text' : 'password';
                inputEl.setAttribute('type', nextType);
                const icon = toggleBtn.querySelector('[data-lucide]') || toggleBtn;
                if (icon && window.lucide) {
                    icon.setAttribute('data-lucide', nextType === 'password' ? 'eye' : 'eye-off');
                    lucide.createIcons();
                }
            });
        }
    }
    
    setupPasswordToggle('toggle-pwd-login', 'password');
    setupPasswordToggle('toggle-pwd-reg', 'password');
    setupPasswordToggle('toggle-pwd-confirm', 'confirmPassword');

    const userPasswordInput = document.getElementById('password');
    const userCapsWarning = document.getElementById('caps-warning-user');
    if (userPasswordInput && userCapsWarning) {
        const checkCaps = (e) => {
            if (e.getModifierState && e.getModifierState('CapsLock')) {
                userCapsWarning.style.display = 'inline-flex';
            } else {
                userCapsWarning.style.display = 'none';
            }
        };
        userPasswordInput.addEventListener('keydown', checkCaps);
        userPasswordInput.addEventListener('keyup', checkCaps);
        userPasswordInput.addEventListener('blur', () => {
            userCapsWarning.style.display = 'none';
        });
    }

    const userDemoFillBtn = document.getElementById('user-demo-fill');
    const userEmailInput = document.getElementById('email');
    if (userDemoFillBtn && userEmailInput && userPasswordInput) {
        userDemoFillBtn.addEventListener('click', () => {
            userEmailInput.value = 'reader@shlokmarathi.news';
            userPasswordInput.value = 'reader123';
            const orig = userDemoFillBtn.textContent;
            userDemoFillBtn.textContent = 'भरले!';
            setTimeout(() => {
                userDemoFillBtn.textContent = orig;
            }, 1200);
            userPasswordInput.focus();
        });
    }

    // Password Strength Indicator
    const regPasswordInput = document.getElementById('password');
    if (regPasswordInput && document.getElementById('pwd-bar-1')) {
        regPasswordInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const bar1 = document.getElementById('pwd-bar-1');
            const bar2 = document.getElementById('pwd-bar-2');
            const bar3 = document.getElementById('pwd-bar-3');
            const text = document.getElementById('pwd-strength-text');
            
            let strength = 0;
            if (val.length >= 6) strength++;
            if (val.match(/[A-Z]/) && val.match(/[0-9]/)) strength++;
            if (val.match(/[^a-zA-Z0-9]/) && val.length >= 8) strength++;
            
            bar1.style.backgroundColor = strength >= 1 ? (strength === 1 ? '#ef4444' : '#eab308') : '#e9ecef';
            bar2.style.backgroundColor = strength >= 2 ? (strength === 2 ? '#eab308' : '#22c55e') : '#e9ecef';
            bar3.style.backgroundColor = strength >= 3 ? '#22c55e' : '#e9ecef';
            
            if (val.length === 0) {
                text.textContent = '';
            } else if (strength === 0) {
                text.textContent = 'Too short';
                text.style.color = '#ef4444';
            } else if (strength === 1) {
                text.textContent = 'Weak';
                text.style.color = '#ef4444';
            } else if (strength === 2) {
                text.textContent = 'Fair';
                text.style.color = '#eab308';
            } else {
                text.textContent = 'Strong';
                text.style.color = '#22c55e';
            }
        });
    }

    // Toggle dropdown
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
            userMenuBtn.setAttribute('aria-expanded', !isExpanded);
            userDropdownMenu.classList.toggle('show');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdownMenu && userDropdownMenu.classList.contains('show') && !userMenuDropdown.contains(e.target)) {
                userMenuBtn.setAttribute('aria-expanded', 'false');
                userDropdownMenu.classList.remove('show');
            }
        });
    }

    // Update Header UI
    function updateHeaderUI() {
        if (currentUser) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userMenuDropdown) userMenuDropdown.classList.remove('hidden');
            
            // Only fall back to metadata if currentProfile is missing; do NOT default to "User" if logged out
            const name = currentProfile?.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
            const avatarUrl = currentProfile?.avatar_url || currentUser.user_metadata?.avatar_url || `data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E`;
            const email = currentProfile?.email || currentUser.email;

            if (navName) navName.textContent = name;
            if (navAvatar) navAvatar.src = avatarUrl;
            if (dropdownName) dropdownName.textContent = name;
            if (dropdownEmail) dropdownEmail.textContent = email;
            if (dropdownAvatar) dropdownAvatar.src = avatarUrl;
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userMenuDropdown) userMenuDropdown.classList.add('hidden');
        }
    }

    // Load Profile
    async function fetchProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                console.warn('Profile not found, returning null');
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error.message);
            return null;
        }
    }

    // Init Session
    async function initSession() {
        if (!window.supabase) return;
        
        // Initial state is loading (buttons are hidden in HTML)
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user) {
            currentProfile = await fetchProfile(user.id);
            currentUser = user;
            updateHeaderUI();
            
            if (profilePageName) {
                profilePageName.textContent = currentProfile?.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
                profilePageEmail.textContent = currentProfile?.email || currentUser.email;
                profilePageAvatar.src = currentProfile?.avatar_url || currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/100';
                profilePageRole.textContent = currentProfile?.role === 'admin' ? 'प्रशासक (Admin)' : 'वाचक (Reader)';
                const adminLink = document.getElementById('profile-admin-link');
                if (adminLink && currentProfile?.role === 'admin') {
                    adminLink.style.display = 'inline-flex';
                }
                
                if (currentProfile?.created_at) {
                    const date = new Date(currentProfile.created_at);
                    profilePageJoined.textContent = date.toLocaleDateString('mr-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                }
            }
        } else {
            currentUser = null;
            currentProfile = null;
            updateHeaderUI();
        }
        
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION') return;
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user && (!currentUser || currentUser.id !== session.user.id)) {
                    currentProfile = await fetchProfile(session.user.id);
                    currentUser = session.user;
                    updateHeaderUI();
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                currentProfile = null;
                updateHeaderUI();
                // Redirect if on profile page
                if (window.location.pathname.includes('profile.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // Login logic
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-submit-btn');
            const btnText = document.getElementById('login-btn-text');
            const spinner = document.getElementById('login-spinner');
            
            hideError('login-error');
            btn.disabled = true;
            if (btnText) btnText.textContent = 'Signing in...';
            if (spinner) spinner.style.display = 'block';
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                showError('login-error', error.message);
                btn.disabled = false;
                if (btnText) btnText.textContent = 'Login';
                if (spinner) spinner.style.display = 'none';
            } else {
                if (btnText) btnText.textContent = 'Success!';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        });
    }

    // Register logic
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const btn = document.getElementById('register-submit-btn');
            const btnText = document.getElementById('register-btn-text');
            const spinner = document.getElementById('register-spinner');
            
            hideError('register-error');
            
            if (password !== confirmPassword) {
                showError('register-error', 'Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                showError('register-error', 'Password must be at least 6 characters');
                return;
            }
            
            btn.disabled = true;
            if (btnText) btnText.textContent = 'Creating account...';
            if (spinner) spinner.style.display = 'block';
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            
            if (error) {
                showError('register-error', error.message);
                btn.disabled = false;
                if (btnText) btnText.textContent = 'Create Account';
                if (spinner) spinner.style.display = 'none';
            } else {
                if (btnText) btnText.textContent = 'Success!';
                setTimeout(() => {
                    alert('Account created successfully! Please login.');
                    window.location.href = 'login.html';
                }, 500);
            }
        });
    }
    
    // Logout logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
        });
    }

    // Initialize
    initSession();
});
