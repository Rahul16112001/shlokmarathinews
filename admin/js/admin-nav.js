(function() {
    const savedTheme = localStorage.getItem('admin_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) document.body.setAttribute('data-theme', savedTheme);
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    syncSidebarNav();
    initMobileNav();
    initThemeToggle();
    syncAdminHeaderProfile();
});

function syncSidebarNav() {
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader && !sidebarHeader.querySelector('.brand-badge-row')) {
        sidebarHeader.innerHTML = `
            <div class="brand-badge-row">
                <img src="../assits/shlokmrathi news logo.png" alt="Shlok Logo" class="brand-logo">
                <div class="brand-text-col">
                    <span class="brand-title">SHLOK NEWS</span>
                    <span class="brand-tag">Newsroom CMS</span>
                </div>
                <span class="brand-version-pill">PRO</span>
            </div>
        `;
    }

    const nav = document.querySelector('.sidebar-nav');
    if (nav) {
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

        const sections = [
            {
                title: 'Overview',
                links: [
                    { href: 'dashboard.html', icon: 'layout-dashboard', label: 'Dashboard' }
                ]
            },
            {
                title: 'Content Management',
                links: [
                    { href: 'articles.html', icon: 'file-text', label: 'Articles' },
                    { href: 'categories.html', icon: 'folder', label: 'Categories' },
                    { href: 'videos.html', icon: 'video', label: 'Videos' },
                    { href: 'short-videos.html', icon: 'smartphone', label: 'Short Videos' },
                    { href: 'breaking-news.html', icon: 'radio', label: 'Breaking News' },
                    { href: 'gallery.html', icon: 'image', label: 'Gallery' },
                    { href: 'live-tv.html', icon: 'tv', label: 'Live TV' }
                ]
            },
            {
                title: 'Platform & Access',
                links: [
                    { href: 'users.html', icon: 'users', label: 'Users & Team' },
                    { href: 'settings.html', icon: 'settings', label: 'Settings' }
                ]
            }
        ];

        let navHtml = '';
        sections.forEach(sec => {
            navHtml += `<div class="nav-section-title">${sec.title}</div>`;
            sec.links.forEach(link => {
                const isActive = currentPath === link.href || (currentPath === 'article-editor.html' && link.href === 'articles.html');
                navHtml += `
                    <a href="${link.href}" class="nav-item ${isActive ? 'active' : ''}">
                        <span class="icon-box"><i data-lucide="${link.icon}"></i></span> ${link.label}
                    </a>
                `;
            });
        });
        nav.innerHTML = navHtml;
    }

    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
        let footer = sidebar.querySelector('.sidebar-footer');
        if (!footer) {
            footer = document.createElement('div');
            footer.className = 'sidebar-footer';
            sidebar.appendChild(footer);
        }
        footer.innerHTML = `
            <div class="sidebar-user-card">
                <div class="user-avatar-sm" id="sidebar-user-avatar">A</div>
                <div class="sidebar-user-info">
                    <span class="sidebar-user-name" id="sidebar-user-name">Administrator</span>
                    <span class="sidebar-user-role">Super Admin</span>
                </div>
                <button class="btn-logout-icon" title="Logout" onclick="adminLogout()">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `;
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function initThemeToggle() {
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;

    if (!topbarRight.querySelector('.topbar-live-pill')) {
        const livePill = document.createElement('div');
        livePill.className = 'topbar-live-pill';
        livePill.innerHTML = '<div class="topbar-live-dot"></div><span>Online</span>';
        topbarRight.prepend(livePill);
    }

    const globalSearch = document.querySelector('.global-search');
    if (globalSearch && !globalSearch.querySelector('.search-kbd')) {
        const kbd = document.createElement('kbd');
        kbd.className = 'search-kbd';
        kbd.textContent = '⌘K';
        globalSearch.appendChild(kbd);
    }

    if (!document.getElementById('theme-toggle-btn')) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const btn = document.createElement('button');
        btn.id = 'theme-toggle-btn';
        btn.className = 'theme-toggle-btn';
        btn.setAttribute('title', 'Toggle Theme');
        btn.setAttribute('aria-label', 'Toggle Theme');
        btn.innerHTML = `<i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}"></i>`;

        btn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            if (document.body) document.body.setAttribute('data-theme', nextTheme);
            localStorage.setItem('admin_theme', nextTheme);
            btn.innerHTML = `<i data-lucide="${nextTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
            if (window.lucide) window.lucide.createIcons();
        });

        const userProfile = topbarRight.querySelector('.user-profile');
        if (userProfile) {
            topbarRight.insertBefore(btn, userProfile);
        } else {
            topbarRight.appendChild(btn);
        }
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function initMobileNav() {
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        document.body.prepend(overlay);
    }

    const topbarLeft = document.querySelector('.topbar-left');
    if (topbarLeft && !document.getElementById('sidebar-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.className = 'mobile-menu-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle menu');
        toggleBtn.innerHTML = '<i data-lucide="menu"></i>';
        topbarLeft.prepend(toggleBtn);
        if (window.lucide) window.lucide.createIcons();
    }

    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}

async function syncAdminHeaderProfile() {
    if (!window.supabase) return;

    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await window.supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        if (profile) {
            const name = profile.full_name || profile.email.split('@')[0];
            const nameEl = document.getElementById('admin-name');
            const avatarEl = document.getElementById('admin-avatar-initial') || document.querySelector('.user-avatar');
            if (nameEl) nameEl.textContent = name;
            if (avatarEl && !avatarEl.querySelector('img')) {
                avatarEl.textContent = name.charAt(0).toUpperCase();
            }
        }
    } catch (e) {
        console.warn(e);
    }
}
