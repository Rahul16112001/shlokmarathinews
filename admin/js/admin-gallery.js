document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const searchInput = document.getElementById('search-gallery');
    const filterPills = document.querySelectorAll('.gallery-filter-pill');
    const uploadBtn = document.getElementById('btn-upload-media');
    const uploadModal = document.getElementById('upload-modal');
    const previewModal = document.getElementById('preview-modal');
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('gallery-file-input');
    const toast = document.getElementById('gallery-toast');

    let allMedia = [
        {
            id: 'm1',
            title: 'Shlok News Official Logo',
            category: 'logos',
            url: '../assits/shlokmrathi news logo.png',
            size: '142 KB',
            dimensions: '512 × 512',
            date: 'Sep 10, 2026'
        },
        {
            id: 'm2',
            title: 'Maharashtra Vidhan Sabha Session',
            category: 'articles',
            url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80',
            size: '380 KB',
            dimensions: '1920 × 1080',
            date: 'Sep 12, 2026'
        },
        {
            id: 'm3',
            title: 'Mumbai Coastal Road Project',
            category: 'articles',
            url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
            size: '420 KB',
            dimensions: '1600 × 900',
            date: 'Sep 14, 2026'
        },
        {
            id: 'm4',
            title: 'Agriculture Monsoon Harvest',
            category: 'articles',
            url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80',
            size: '512 KB',
            dimensions: '1920 × 1280',
            date: 'Sep 15, 2026'
        },
        {
            id: 'm5',
            title: 'Breaking News Ticker Banner',
            category: 'banners',
            url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
            size: '290 KB',
            dimensions: '1200 × 400',
            date: 'Sep 16, 2026'
        },
        {
            id: 'm6',
            title: 'Indian Cricket Team Press Brief',
            category: 'thumbnails',
            url: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?w=800&q=80',
            size: '310 KB',
            dimensions: '1280 × 720',
            date: 'Sep 16, 2026'
        }
    ];

    let currentCategory = 'all';

    renderGallery();
    loadSupabaseMedia();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderGallery();
        });
    }

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-cat') || 'all';
            renderGallery();
        });
    });

    if (uploadBtn && uploadModal) {
        uploadBtn.addEventListener('click', () => {
            uploadModal.style.display = 'flex';
        });
    }

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (uploadModal) uploadModal.style.display = 'none';
            if (previewModal) previewModal.style.display = 'none';
        });
    });

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#ef4444';
            dropzone.style.background = 'rgba(239, 68, 68, 0.05)';
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'var(--admin-border)';
            dropzone.style.background = 'transparent';
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--admin-border)';
            dropzone.style.background = 'transparent';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                handleFileUpload(fileInput.files[0]);
            }
        });
    }

    async function handleFileUpload(file) {
        const title = file.name.replace(/\.[^/.]+$/, '');
        const reader = new FileReader();
        reader.onload = (e) => {
            const newMedia = {
                id: 'm_' + Date.now(),
                title: title,
                category: 'articles',
                url: e.target.result,
                size: (file.size / 1024).toFixed(0) + ' KB',
                dimensions: 'Uploaded Image',
                date: 'Just now'
            };
            allMedia.unshift(newMedia);
            renderGallery();
            if (uploadModal) uploadModal.style.display = 'none';
            showToast('Asset uploaded successfully!');
        };
        reader.readAsDataURL(file);
    }

    async function loadSupabaseMedia() {
        if (!window.supabase) return;
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('title, featured_image, created_at')
                .not('featured_image', 'is', null)
                .order('created_at', { ascending: false })
                .limit(12);

            if (error || !data) return;

            data.forEach((item, idx) => {
                if (item.featured_image && !allMedia.some(m => m.url === item.featured_image)) {
                    allMedia.push({
                        id: 'sb_' + idx,
                        title: item.title || 'Article Cover',
                        category: 'articles',
                        url: item.featured_image,
                        size: 'Web Asset',
                        dimensions: '16:9 Cover',
                        date: new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                    });
                }
            });
            renderGallery();
        } catch (e) {
            console.warn(e);
        }
    }

    function renderGallery() {
        if (!galleryGrid) return;

        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const filtered = allMedia.filter(item => {
            const matchesCat = currentCategory === 'all' || item.category === currentCategory;
            const matchesSearch = !query || item.title.toLowerCase().includes(query);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            galleryGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center;">
                    <div class="empty-state">
                        <svg width="48" height="48" fill="none" stroke="var(--admin-text-muted)" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 1rem;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <h3 class="empty-title" style="font-size: 16px; font-weight: 700; color: var(--admin-text-main); margin-bottom: 4px;">No media assets found</h3>
                        <p class="empty-desc" style="font-size: 13px; color: var(--admin-text-muted); margin: 0;">Try adjusting your search terms or upload a new media file.</p>
                    </div>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = filtered.map(item => `
            <div class="gallery-card" data-id="${item.id}">
                <div class="gallery-thumb-wrap">
                    <img src="${item.url}" alt="${item.title}" class="gallery-thumb-img" loading="lazy" onerror="this.src='../assits/shlokmrathi news logo.png'">
                    <div class="gallery-card-overlay">
                        <button class="gallery-action-btn btn-copy" data-url="${item.url}" title="Copy Link">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="gallery-action-btn btn-preview" data-url="${item.url}" data-title="${item.title}" title="Preview">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="gallery-action-btn btn-delete-asset" data-id="${item.id}" title="Delete">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="gallery-card-info">
                    <div class="gallery-card-title" title="${item.title}">${item.title}</div>
                    <div class="gallery-card-meta">
                        <span>${item.dimensions}</span>
                        <span>•</span>
                        <span>${item.size}</span>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Direct URL copied to clipboard!');
                }).catch(() => {
                    showToast('Copied: ' + url);
                });
            });
        });

        document.querySelectorAll('.btn-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.getAttribute('data-url');
                const title = btn.getAttribute('data-title');
                if (previewModal) {
                    document.getElementById('preview-modal-img').src = url;
                    document.getElementById('preview-modal-title').textContent = title;
                    previewModal.style.display = 'flex';
                }
            });
        });

        document.querySelectorAll('.btn-delete-asset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('Remove this asset from gallery?')) {
                    allMedia = allMedia.filter(m => m.id !== id);
                    renderGallery();
                    showToast('Asset removed');
                }
            });
        });

        const totalEl = document.getElementById('stat-total-media');
        if (totalEl) totalEl.textContent = allMedia.length;
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }
});
