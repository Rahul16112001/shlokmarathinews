document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const limit = 10;
    let currentStatus = 'all';
    let currentCategory = '';
    let currentSearch = '';
    let searchDebounceTimer = null;
    let selectedArticleIds = new Set();

    initFilters();
    initPagination();
    initBulkActions();
    loadCategoriesFilter();
    refreshData();

    function initFilters() {
        const tabsContainer = document.getElementById('status-tabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.cms-tab-btn');
                if (!btn) return;
                tabsContainer.querySelectorAll('.cms-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentStatus = btn.getAttribute('data-status') || 'all';
                currentPage = 1;
                selectedArticleIds.clear();
                updateBulkBar();
                loadArticles(currentPage);
            });
        }

        const categorySelect = document.getElementById('filter-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                currentCategory = e.target.value;
                currentPage = 1;
                selectedArticleIds.clear();
                updateBulkBar();
                loadArticles(currentPage);
            });
        }

        const searchInput = document.getElementById('search-articles');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    currentSearch = e.target.value.trim();
                    currentPage = 1;
                    selectedArticleIds.clear();
                    updateBulkBar();
                    loadArticles(currentPage);
                }, 300);
            });
        }

        const topbarSearch = document.getElementById('topbar-search');
        if (topbarSearch) {
            topbarSearch.addEventListener('input', (e) => {
                if (searchInput) searchInput.value = e.target.value;
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    currentSearch = e.target.value.trim();
                    currentPage = 1;
                    selectedArticleIds.clear();
                    updateBulkBar();
                    loadArticles(currentPage);
                }, 300);
            });
        }

        const btnRefresh = document.getElementById('btn-refresh-articles');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                refreshData();
            });
        }

        const thSelectAll = document.getElementById('th-select-all');
        if (thSelectAll) {
            thSelectAll.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const checkboxes = document.querySelectorAll('.article-row-cb');
                checkboxes.forEach(cb => {
                    cb.checked = isChecked;
                    const id = cb.getAttribute('data-id');
                    if (isChecked) selectedArticleIds.add(id);
                    else selectedArticleIds.delete(id);
                });
                updateBulkBar();
            });
        }
    }

    function initPagination() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    loadArticles(currentPage);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentPage++;
                loadArticles(currentPage);
            });
        }
    }

    function initBulkActions() {
        const btnClear = document.getElementById('btn-bulk-clear');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                selectedArticleIds.clear();
                const thSelectAll = document.getElementById('th-select-all');
                if (thSelectAll) thSelectAll.checked = false;
                document.querySelectorAll('.article-row-cb').forEach(cb => cb.checked = false);
                updateBulkBar();
            });
        }

        const btnPublish = document.getElementById('btn-bulk-publish');
        if (btnPublish) {
            btnPublish.addEventListener('click', async () => {
                if (selectedArticleIds.size === 0) return;
                const ids = Array.from(selectedArticleIds);
                try {
                    const { error } = await supabase
                        .from('articles')
                        .update({ status: 'published' })
                        .in('id', ids);

                    if (error) throw error;
                    selectedArticleIds.clear();
                    updateBulkBar();
                    refreshData();
                } catch (err) {
                    console.warn(err);
                    alert('Could not update selected articles');
                }
            });
        }

        const btnDelete = document.getElementById('btn-bulk-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', async () => {
                if (selectedArticleIds.size === 0) return;
                if (!confirm(`Delete ${selectedArticleIds.size} selected article(s)? This action cannot be undone.`)) return;

                const ids = Array.from(selectedArticleIds);
                try {
                    const { error } = await supabase
                        .from('articles')
                        .delete()
                        .in('id', ids);

                    if (error) throw error;
                    selectedArticleIds.clear();
                    updateBulkBar();
                    refreshData();
                } catch (err) {
                    console.warn(err);
                    alert('Could not delete selected articles');
                }
            });
        }
    }

    function updateBulkBar() {
        const bulkBar = document.getElementById('bulk-bar');
        const bulkCount = document.getElementById('bulk-count');
        if (!bulkBar || !bulkCount) return;

        const count = selectedArticleIds.size;
        if (count > 0) {
            bulkCount.textContent = `${count} selected`;
            bulkBar.classList.add('active');
        } else {
            bulkBar.classList.remove('active');
            const thSelectAll = document.getElementById('th-select-all');
            if (thSelectAll) thSelectAll.checked = false;
        }
    }

    async function loadCategoriesFilter() {
        const select = document.getElementById('filter-category');
        if (!select) return;

        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) throw error;
            if (data && data.length > 0) {
                select.innerHTML = '<option value="">All Categories</option>' +
                    data.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }
        } catch (e) {
            console.warn(e);
        }
    }

    async function refreshData() {
        loadMetrics();
        loadArticles(currentPage);
    }

    async function loadMetrics() {
        try {
            const [totalRes, pubRes, draftRes, breakingRes] = await Promise.all([
                supabase.from('articles').select('*', { count: 'exact', head: true }),
                supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
                supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
                supabase.from('articles').select('*', { count: 'exact', head: true }).eq('is_breaking', true)
            ]);

            const totalCount = totalRes.count || 0;
            const pubCount = pubRes.count || 0;
            const draftCount = draftRes.count || 0;
            const breakingCount = breakingRes.count || 0;

            const elTotal = document.getElementById('kpi-total');
            const elPub = document.getElementById('kpi-published');
            const elDraft = document.getElementById('kpi-drafts');
            const elBreaking = document.getElementById('kpi-breaking');

            if (elTotal) elTotal.textContent = totalCount;
            if (elPub) elPub.textContent = pubCount;
            if (elDraft) elDraft.textContent = draftCount;
            if (elBreaking) elBreaking.textContent = breakingCount;

            const tAll = document.getElementById('tab-count-all');
            const tPub = document.getElementById('tab-count-published');
            const tDraft = document.getElementById('tab-count-draft');
            const tBreak = document.getElementById('tab-count-breaking');

            if (tAll) tAll.textContent = totalCount;
            if (tPub) tPub.textContent = pubCount;
            if (tDraft) tDraft.textContent = draftCount;
            if (tBreak) tBreak.textContent = breakingCount;
        } catch (e) {
            console.warn(e);
        }
    }

    function renderEmptyState(tbody, title, desc) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div style="padding: 48px 20px; text-align: center;">
                        <div style="width: 52px; height: 52px; border-radius: 14px; background: var(--admin-surface-hover); border: 1px solid var(--admin-border); display: inline-flex; align-items: center; justify-content: center; color: var(--admin-text-light); margin-bottom: 14px;">
                            <i data-lucide="file-x" style="width: 26px; height: 26px;"></i>
                        </div>
                        <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: var(--admin-text-main);">${title}</h3>
                        <p style="margin: 0 0 16px 0; font-size: 13.5px; color: var(--admin-text-muted); max-width: 420px; margin-left: auto; margin-right: auto;">${desc}</p>
                        <a href="article-editor.html" class="btn btn-primary btn-sm">
                            <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create First Article
                        </a>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }

    async function loadArticles(page) {
        const tbody = document.getElementById('articles-tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div style="padding: 24px; display: flex; flex-direction: column; gap: 12px;">
                        <div class="skeleton skeleton-text" style="height: 40px; border-radius: 8px;"></div>
                        <div class="skeleton skeleton-text" style="height: 40px; border-radius: 8px;"></div>
                        <div class="skeleton skeleton-text" style="height: 40px; border-radius: 8px;"></div>
                    </div>
                </td>
            </tr>
        `;

        try {
            let query = supabase
                .from('articles')
                .select('id, title, slug, status, featured_image, is_featured, is_breaking, is_trending, created_at, category_id, category:categories(id, name)', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (currentStatus === 'published') {
                query = query.eq('status', 'published');
            } else if (currentStatus === 'draft') {
                query = query.eq('status', 'draft');
            } else if (currentStatus === 'breaking') {
                query = query.eq('is_breaking', true);
            }

            if (currentCategory) {
                query = query.eq('category_id', currentCategory);
            }

            if (currentSearch) {
                query = query.or(`title.ilike.%${currentSearch}%,slug.ilike.%${currentSearch}%`);
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data: articles, count, error } = await query;
            if (error) throw error;

            const total = count || 0;
            const pageInfo = document.getElementById('page-info');
            const pageNumPill = document.getElementById('page-num-pill');
            const prevBtn = document.getElementById('prev-page');
            const nextBtn = document.getElementById('next-page');

            if (pageInfo) {
                const startItem = total === 0 ? 0 : from + 1;
                const endItem = Math.min(to + 1, total);
                pageInfo.textContent = `Showing ${startItem}-${endItem} of ${total} articles`;
            }
            if (pageNumPill) pageNumPill.textContent = page;
            if (prevBtn) prevBtn.disabled = page === 1;
            if (nextBtn) nextBtn.disabled = to >= total - 1 || total === 0;

            if (!articles || articles.length === 0) {
                renderEmptyState(tbody, "No articles found", currentSearch || currentCategory || currentStatus !== 'all' ? "Try clearing your filters or search criteria." : "No articles published yet. Click below to draft your first story.");
                return;
            }

            tbody.innerHTML = '';
            articles.forEach(art => {
                const isSelected = selectedArticleIds.has(art.id);
                const tr = document.createElement('tr');
                tr.className = 'saas-row';

                const formattedDate = new Date(art.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                const categoryName = art.category && art.category.name ? art.category.name : 'General';
                
                let thumbHtml = `
                    <div style="width: 54px; height: 40px; border-radius: 8px; background: var(--admin-surface-hover); border: 1px solid var(--admin-border); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                        <i data-lucide="image" style="width: 16px; height: 16px; color: var(--admin-text-light);"></i>
                    </div>
                `;
                if (art.featured_image) {
                    thumbHtml = `
                        <div style="width: 54px; height: 40px; border-radius: 8px; background: var(--admin-surface-hover); border: 1px solid var(--admin-border); overflow: hidden; flex-shrink: 0;">
                            <img src="${art.featured_image}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML='<div style=\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--admin-text-light);font-size:12px;\'>📷</div>';">
                        </div>
                    `;
                }

                let flagsHtml = '';
                if (art.is_breaking) {
                    flagsHtml += '<span class="article-flag breaking">Breaking</span>';
                }
                if (art.is_featured) {
                    flagsHtml += '<span class="article-flag featured">Featured</span>';
                }

                let statusBadge = '';
                if (art.status === 'published') {
                    statusBadge = `
                        <span class="badge-stat">
                            <div class="pulse-dot"></div> Published
                        </span>
                    `;
                } else if (art.status === 'archived') {
                    statusBadge = `
                        <span style="display: inline-flex; align-items: center; gap: 6px; background: var(--admin-surface-hover); color: var(--admin-text-muted); font-size: 11.5px; padding: 4px 10px; border-radius: 99px; font-weight: 600; border: 1px solid var(--admin-border);">
                            Archived
                        </span>
                    `;
                } else {
                    statusBadge = `
                        <span style="display: inline-flex; align-items: center; gap: 6px; background: var(--admin-surface-hover); color: var(--admin-text-muted); font-size: 11.5px; padding: 4px 10px; border-radius: 99px; font-weight: 600; border: 1px solid var(--admin-border);">
                            <div style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;"></div> Draft
                        </span>
                    `;
                }

                tr.innerHTML = `
                    <td style="padding: 14px 16px; text-align: center;">
                        <input type="checkbox" class="article-row-cb" data-id="${art.id}" ${isSelected ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--admin-primary);">
                    </td>
                    <td style="padding: 12px 14px;">
                        ${thumbHtml}
                    </td>
                    <td style="padding: 12px 14px;">
                        <div style="max-width: 440px;">
                            <a href="article-editor.html?id=${art.id}" class="article-title-link" title="${art.title.replace(/"/g, '&quot;')}">
                                ${art.title}
                            </a>
                            <div class="article-meta-sub">
                                <span>${art.slug || 'no-slug'}</span>
                                ${flagsHtml}
                            </div>
                        </div>
                    </td>
                    <td style="padding: 12px 14px;">
                        <span class="badge-tag">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--admin-primary);"></span>
                            ${categoryName}
                        </span>
                    </td>
                    <td style="padding: 12px 14px;">
                        ${statusBadge}
                    </td>
                    <td style="padding: 12px 14px; font-size: 12.5px; color: var(--admin-text-muted); font-weight: 500;">
                        ${formattedDate}
                    </td>
                    <td style="padding: 12px 16px; text-align: right;">
                        <div style="display: inline-flex; gap: 6px; align-items: center;">
                            <a href="../article-detail.html?id=${art.id}" target="_blank" class="btn-icon-sq" title="View live">
                                <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                            </a>
                            <a href="article-editor.html?id=${art.id}" class="btn-icon-sq primary" title="Edit article">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                            </a>
                            <button class="btn-icon-sq danger btn-delete-row" data-id="${art.id}" title="Delete article">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px; pointer-events: none;"></i>
                            </button>
                        </div>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            if (window.lucide) lucide.createIcons();

            document.querySelectorAll('.article-row-cb').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (e.target.checked) selectedArticleIds.add(id);
                    else selectedArticleIds.delete(id);
                    updateBulkBar();
                });
            });

            document.querySelectorAll('.btn-delete-row').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.closest('.btn-delete-row').getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this article?')) {
                        try {
                            const { error } = await supabase.from('articles').delete().eq('id', id);
                            if (error) throw error;
                            selectedArticleIds.delete(id);
                            updateBulkBar();
                            refreshData();
                        } catch (err) {
                            console.warn(err);
                            alert('Failed to delete article');
                        }
                    }
                });
            });

        } catch (err) {
            console.warn(err);
            renderEmptyState(tbody, "Database Connection Required", "Configure Supabase in js/admin-supabase.js to view and manage live articles.");
        }
    }
});