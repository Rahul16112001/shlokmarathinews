document.addEventListener("DOMContentLoaded", async () => {
    // Helper to fetch and inject HTML
    async function loadComponent(id, url) {
        const el = document.getElementById(id);
        if (el) {
            try {
                const cacheBuster = '?v=' + new Date().getTime();
                const response = await fetch(url + cacheBuster);
                if (response.ok) {
                    const html = await response.text();
                    // Replace the innerHTML
                    el.innerHTML = html;
                    
                    // If this is the header, setup the active navigation
                    if (id === 'global-header-mount') {
                        setupActiveNavigation();
                        // Also initialize lucide icons for the newly injected HTML
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                } else {
                    console.error(`Failed to load ${url}: ${response.status}`);
                }
            } catch (e) {
                console.error(`Error loading ${url}:`, e);
            }
        }
    }

    // Load all components
    await Promise.all([
        loadComponent('global-header-mount', 'components/header.html'),
        loadComponent('global-search-mount', 'components/search.html'),
        loadComponent('global-sidebar-mount', 'components/sidebar.html'),
        loadComponent('global-footer-mount', 'components/footer.html')
    ]);

    // Setup active navigation based on current URL or data-page attribute
    function setupActiveNavigation() {
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop() || 'index.html';
        const dataPage = document.body.getAttribute('data-page');

        const navLinks = document.querySelectorAll('.at-main-nav .at-nav-link, .at-network-links .at-net-link');
        
        navLinks.forEach(link => {
            // Remove existing active class
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            
            // Match logic
            let isMatch = false;
            
            if (href === pageName) {
                isMatch = true;
            } else if (href === 'index.html' && pageName === '') {
                isMatch = true;
            }
            
            // Custom mappings based on user examples
            if (pageName === 'video.html' && link.textContent.trim().toUpperCase().includes('VIDEO')) isMatch = true;
            if (pageName === 'short-video.html' && link.textContent.trim().toUpperCase().includes('SHORT VIDEO')) isMatch = true;
            if (pageName === 'photo-gallery.html' && link.textContent.trim().toUpperCase().includes('PHOTO')) isMatch = true;
            if (pageName === 'podcast.html' && link.textContent.trim().toUpperCase().includes('PODCAST')) isMatch = true;

            if (isMatch) {
                link.classList.add('active');
            }
        });
        
        // Setup trending/latest active states if needed
        // (Similar logic can be added here)
    }
});
