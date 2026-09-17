document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('categories-tbody');
    const form = document.getElementById('category-form');
    const nameInput = document.getElementById('category-name');
    const slugInput = document.getElementById('category-slug');
    const activeInput = document.getElementById('category-active');
    const idInput = document.getElementById('category-id');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSave = document.getElementById('btn-save-cat');
    const studioHeading = document.getElementById('studio-heading');
    const studioModePill = document.getElementById('studio-mode-pill');
    const previewName = document.getElementById('preview-name');
    const previewSlug = document.getElementById('preview-slug');
    const slugHint = document.getElementById('slug-hint');
    const searchInput = document.getElementById('search-categories');
    const btnRefresh = document.getElementById('btn-refresh-categories');

    let allCategories = [];
    let articleCounts = {};

    initEvents();
    loadAll();

    function initEvents() {
        nameInput.addEventListener('input', () => {
            const val = nameInput.value.trim();
            if (previewName) previewName.textContent = val || 'वर्ग / Desk Name';
            if (!idInput.value) {
                const slug = slugify(val);
                slugInput.value = slug;
                if (previewSlug) previewSlug.textContent = `/category/${slug || 'slug'}`;
                if (slugHint) slugHint.textContent = slug || 'slug';
            }
        });

        slugInput.addEventListener('input', () => {
            const slug = slugify(slugInput.value);
            slugInput.value = slug;
            if (previewSlug) previewSlug.textContent = `/category/${slug || 'slug'}`;
            if (slugHint) slugHint.textContent = slug || 'slug';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            const slug = slugify(slugInput.value.trim() || name);
            const is_active = activeInput.checked;

            if (!name) return;

            const categoryData = { name, slug, is_active };

            try {
                if (btnSave) {
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<i data-lucide="loader-2" style="width:15px;height:15px;animation:spin 1s linear infinite;"></i> Saving...';
                }

                let error;
                if (idInput.value) {
                    const res = await supabase.from('categories').update(categoryData).eq('id', idInput.value);
                    error = res.error;
                } else {
                    const res = await supabase.from('categories').insert([categoryData]);
                    error = res.error;
                }

                if (error) throw error;

                resetForm();
                await loadAll();
            } catch (err) {
                console.warn(err);
                alert('Failed to save category. Please check your Supabase setup.');
            } finally {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerHTML = '<i data-lucide="check" style="width:15px;height:15px;"></i> Save Category';
                    if (window.lucide) lucide.createIcons();
                }
            }
        });

        btnCancel.addEventListener('click', resetForm);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                renderTable(allCategories.filter(c => 
                    c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
                ));
            });
        }

        if (btnRefresh) {
            btnRefresh.addEventListener('click', loadAll);
        }
    }

    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-ऀ-ॿ]+/g, '')
            .replace(/\-\-\+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    async function loadAll() {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div style="padding: 24px; display: flex; flex-direction: column; gap: 10px;">
                        <div class="skeleton skeleton-text" style="height: 36px; border-radius: 8px;"></div>
                        <div class="skeleton skeleton-text" style="height: 36px; border-radius: 8px;"></div>
                    </div>
                </td>
            </tr>
        `;

        try {
            const [catRes, artRes] = await Promise.all([
                supabase.from('categories').select('*').order('created_at', { ascending: false }),
                supabase.from('articles').select('category_id')
            ]);

            if (catRes.error) throw catRes.error;
            allCategories = catRes.data || [];

            articleCounts = {};
            if (artRes.data) {
                artRes.data.forEach(a => {
                    if (a.category_id) {
                        articleCounts[a.category_id] = (articleCounts[a.category_id] || 0) + 1;
                    }
                });
            }

            updateMetrics(allCategories, artRes.data || []);
            renderTable(allCategories);

        } catch (err) {
            console.warn(err);
            renderEmptyState(tbody, "Database Connection Required", "Configure Supabase in js/admin-supabase.js to view and manage categories.");
        }
    }

    function updateMetrics(categories, articles) {
        const total = categories.length;
        const active = categories.filter(c => c.is_active).length;
        const inactive = total - active;
        const taggedArticles = articles.filter(a => !!a.category_id).length;

        const elTotal = document.getElementById('cat-total');
        const elActive = document.getElementById('cat-active');
        const elInactive = document.getElementById('cat-inactive');
        const elArticles = document.getElementById('cat-articles');
        const elDirCount = document.getElementById('directory-count');

        if (elTotal) elTotal.textContent = total;
        if (elActive) elActive.textContent = active;
        if (elInactive) elInactive.textContent = inactive;
        if (elArticles) elArticles.textContent = taggedArticles;
        if (elDirCount) elDirCount.textContent = `${total} items`;
    }

    function renderEmptyState(container, title, desc) {
        container.innerHTML = `
            <tr>
                <td colspan="5">
                    <div style="padding: 48px 20px; text-align: center;">
                        <div style="width: 52px; height: 52px; border-radius: 14px; background: var(--admin-surface-hover); border: 1px solid var(--admin-border); display: inline-flex; align-items: center; justify-content: center; color: var(--admin-text-light); margin-bottom: 14px;">
                            <i data-lucide="folder-plus" style="width: 26px; height: 26px;"></i>
                        </div>
                        <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: var(--admin-text-main);">${title}</h3>
                        <p style="margin: 0; font-size: 13.5px; color: var(--admin-text-muted);">${desc}</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
    }

    function renderTable(categories) {
        if (!categories || categories.length === 0) {
            renderEmptyState(tbody, "No categories found", "Use the Category Studio on the left to create your first desk.");
            return;
        }

        tbody.innerHTML = '';
        categories.forEach(cat => {
            const count = articleCounts[cat.id] || 0;
            const tr = document.createElement('tr');
            tr.className = 'saas-row';

            const statusToggleHtml = `
                <label class="saas-toggle" title="Toggle visibility">
                    <input type="checkbox" class="cat-quick-toggle" data-id="${cat.id}" ${cat.is_active ? 'checked' : ''}>
                    <span class="toggle-track"></span>
                </label>
            `;

            tr.innerHTML = `
                <td style="padding: 14px 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${cat.is_active ? 'var(--admin-primary)' : 'var(--admin-text-light)'}; flex-shrink: 0;"></span>
                        <span style="font-size: 14px; font-weight: 700; color: var(--admin-text-main);">${cat.name}</span>
                    </div>
                </td>
                <td style="padding: 14px 18px;">
                    <span class="badge-tag" style="font-family: ui-monospace, SFMono-Regular, Monaco, monospace; font-size: 11.5px;">
                        /${cat.slug}
                    </span>
                </td>
                <td style="padding: 14px 18px;">
                    <span class="cat-count-pill">
                        ${count} stor${count === 1 ? 'y' : 'ies'}
                    </span>
                </td>
                <td style="padding: 14px 18px;">
                    ${statusToggleHtml}
                </td>
                <td style="padding: 14px 20px; text-align: right;">
                    <div style="display: inline-flex; gap: 6px; align-items: center;">
                        <button class="btn-icon-sq primary btn-edit-cat" data-id="${cat.id}" title="Edit category">
                            <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn-icon-sq danger btn-delete-cat" data-id="${cat.id}" title="Delete category">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; pointer-events: none;"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        if (window.lucide) lucide.createIcons();

        document.querySelectorAll('.btn-edit-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const cat = allCategories.find(c => c.id == id);
                if (!cat) return;

                idInput.value = cat.id;
                nameInput.value = cat.name;
                slugInput.value = cat.slug;
                activeInput.checked = cat.is_active;

                if (previewName) previewName.textContent = cat.name;
                if (previewSlug) previewSlug.textContent = `/category/${cat.slug}`;
                if (slugHint) slugHint.textContent = cat.slug;
                if (studioHeading) studioHeading.textContent = 'Edit Desk';
                if (studioModePill) {
                    studioModePill.textContent = 'Edit Mode';
                    studioModePill.style.background = 'var(--admin-primary-light)';
                    studioModePill.style.color = 'var(--admin-primary)';
                }
                btnCancel.style.display = 'inline-flex';

                const studioPanel = document.getElementById('studio-panel');
                if (studioPanel) {
                    studioPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    nameInput.focus();
                }
            });
        });

        document.querySelectorAll('.cat-quick-toggle').forEach(chk => {
            chk.addEventListener('change', async (e) => {
                const id = e.target.getAttribute('data-id');
                const newState = e.target.checked;
                try {
                    const { error } = await supabase
                        .from('categories')
                        .update({ is_active: newState })
                        .eq('id', id);

                    if (error) throw error;
                    const cat = allCategories.find(c => c.id == id);
                    if (cat) cat.is_active = newState;
                    updateMetrics(allCategories, []);
                } catch (err) {
                    console.warn(err);
                    e.target.checked = !newState;
                    alert('Could not update category status');
                }
            });
        });

        document.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const cat = allCategories.find(c => c.id == id);
                const count = articleCounts[id] || 0;
                let msg = 'Delete this category?';
                if (count > 0) {
                    msg = `Warning: ${count} article(s) are currently tagged in this category. Deleting it will detach them. Continue?`;
                }

                if (confirm(msg)) {
                    try {
                        const { error } = await supabase.from('categories').delete().eq('id', id);
                        if (error) throw error;
                        await loadAll();
                    } catch (err) {
                        console.warn(err);
                        alert('Failed to delete category');
                    }
                }
            });
        });
    }

    function resetForm() {
        form.reset();
        idInput.value = '';
        activeInput.checked = true;
        if (studioHeading) studioHeading.textContent = 'Category Studio';
        if (studioModePill) {
            studioModePill.textContent = 'Create';
            studioModePill.style.background = 'var(--admin-surface-hover)';
            studioModePill.style.color = 'var(--admin-text-muted)';
        }
        if (previewName) previewName.textContent = 'ताज्या बातम्या';
        if (previewSlug) previewSlug.textContent = '/category/breaking';
        if (slugHint) slugHint.textContent = 'slug';
        btnCancel.style.display = 'none';
    }
});