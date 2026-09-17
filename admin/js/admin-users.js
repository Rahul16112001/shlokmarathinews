let allUsers = [];
let currentFilter = 'all';
let searchQuery = '';
let currentSort = 'newest';
let currentPage = 1;
let pageSize = 10;
let selectedUserId = null;
let selectedUserIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    initMobileNav();
    await checkAuth();
    await loadUsers();
    setupEventListeners();
});

function initMobileNav() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

const DEFAULT_EDITORIAL_TEAM = [
    {
        id: 'usr-001',
        full_name: 'Editor In Chief (Super Admin)',
        email: 'admin@shlokmarathi.news',
        role: 'admin',
        status: 'active',
        created_at: new Date(Date.now() - 120 * 86400000).toISOString()
    },
    {
        id: 'usr-002',
        full_name: 'Manoj Joshi (Senior Political Bureau)',
        email: 'manoj.joshi@shlokmarathi.news',
        role: 'admin',
        status: 'active',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
        id: 'usr-003',
        full_name: 'Sneha Deshmukh (Entertainment Desk)',
        email: 'sneha.desk@shlokmarathi.news',
        role: 'user',
        status: 'active',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
        id: 'usr-004',
        full_name: 'Pravin Gaikwad (Sports & Crime Correspondent)',
        email: 'pravin.reporter@shlokmarathi.news',
        role: 'user',
        status: 'active',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
        id: 'usr-005',
        full_name: 'Sunil Pawar (Digital Subscriber)',
        email: 'reader@shlokmarathi.news',
        role: 'user',
        status: 'active',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    }
];

async function checkAuth() {
    try {
        const demoSession = localStorage.getItem('admin_demo_session');
        if (demoSession) {
            try {
                const parsed = JSON.parse(demoSession);
                const nameEl = document.getElementById('admin-name');
                const avatarEl = document.getElementById('admin-avatar-initial');
                if (nameEl) nameEl.textContent = parsed.name || 'Editor In Chief';
                if (avatarEl) avatarEl.textContent = (parsed.name || 'E').charAt(0).toUpperCase();
            } catch (e) {}
            return;
        }

        if (window.supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const displayName = profile.full_name || profile.email.split('@')[0];
                    const nameEl = document.getElementById('admin-name');
                    const avatarEl = document.getElementById('admin-avatar-initial');
                    if (nameEl) nameEl.textContent = displayName;
                    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
                }
            }
        }
    } catch (err) {
        console.warn("Auth setup note:", err);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem 1rem;">
                    <div class="spinner" style="display: inline-block; width: 30px; height: 30px; border-width: 3px; border-color: var(--admin-primary); border-top-color: transparent;"></div>
                    <div style="margin-top: 12px; color: var(--admin-text-muted); font-size: 13px; font-weight: 500;">Loading user records...</div>
                </td>
            </tr>
        `;
    }

    try {
        let dbUsers = [];
        if (window.supabase) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    dbUsers = data;
                }
            } catch (e) {}
        }

        if (dbUsers.length > 0) {
            allUsers = dbUsers.map(u => ({
                ...u,
                status: u.status || 'active'
            }));
        } else {
            const savedLocal = localStorage.getItem('admin_local_users');
            if (savedLocal) {
                try {
                    allUsers = JSON.parse(savedLocal);
                } catch (e) {
                    allUsers = DEFAULT_EDITORIAL_TEAM;
                }
            } else {
                allUsers = DEFAULT_EDITORIAL_TEAM;
                localStorage.setItem('admin_local_users', JSON.stringify(DEFAULT_EDITORIAL_TEAM));
            }
        }

        selectedUserIds.clear();
        updateBulkBar();
        updateStats();
        renderTable();
    } catch (err) {
        console.error(err);
        allUsers = DEFAULT_EDITORIAL_TEAM;
        updateStats();
        renderTable();
    }
}

function updateStats() {
    const totalEl = document.getElementById('stat-total-users');
    const adminsEl = document.getElementById('stat-admin-users');
    const readersEl = document.getElementById('stat-reader-users');
    const newEl = document.getElementById('stat-new-users');

    const total = allUsers.length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    const readers = allUsers.filter(u => u.role !== 'admin').length;
    const activeCount = allUsers.filter(u => u.status !== 'suspended').length;
    const suspendedCount = allUsers.filter(u => u.status === 'suspended').length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = allUsers.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length;

    if (totalEl) totalEl.textContent = total;
    if (adminsEl) adminsEl.textContent = admins;
    if (readersEl) readersEl.textContent = readers;
    if (newEl) newEl.textContent = newThisMonth;

    const pillAll = document.getElementById('pill-count-all');
    const pillAdmin = document.getElementById('pill-count-admin');
    const pillUser = document.getElementById('pill-count-user');
    const pillActive = document.getElementById('pill-count-active');
    const pillSuspended = document.getElementById('pill-count-suspended');

    if (pillAll) pillAll.textContent = `(${total})`;
    if (pillAdmin) pillAdmin.textContent = `(${admins})`;
    if (pillUser) pillUser.textContent = `(${readers})`;
    if (pillActive) pillActive.textContent = `(${activeCount})`;
    if (pillSuspended) pillSuspended.textContent = `(${suspendedCount})`;
}

function getFilteredAndSortedUsers() {
    let list = allUsers.filter(user => {
        let matchesFilter = true;
        if (currentFilter === 'admin') matchesFilter = user.role === 'admin';
        else if (currentFilter === 'user') matchesFilter = user.role !== 'admin';
        else if (currentFilter === 'active') matchesFilter = user.status !== 'suspended';
        else if (currentFilter === 'suspended') matchesFilter = user.status === 'suspended';

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            (user.full_name && user.full_name.toLowerCase().includes(q)) ||
            (user.email && user.email.toLowerCase().includes(q)) ||
            (user.id && user.id.toLowerCase().includes(q));

        return matchesFilter && matchesSearch;
    });

    if (currentSort === 'newest') {
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (currentSort === 'oldest') {
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (currentSort === 'name') {
        list.sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
    }

    return list;
}

function renderTable() {
    const tbody = document.getElementById('users-table-body');
    const countDisplay = document.getElementById('user-results-count');
    const selectAllBox = document.getElementById('select-all-checkbox');
    if (!tbody) return;

    const filtered = getFilteredAndSortedUsers();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageUsers = filtered.slice(startIdx, endIdx);

    if (countDisplay) {
        countDisplay.textContent = `Showing ${filtered.length === 0 ? 0 : startIdx + 1}–${Math.min(endIdx, filtered.length)} of ${filtered.length} users`;
    }

    const pageInfo = document.getElementById('page-indicator');
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    if (pageUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i data-lucide="users" class="empty-icon"></i>
                        <h3 class="empty-title">No matching users</h3>
                        <p class="empty-desc">No accounts found matching your query or selected filter criteria.</p>
                        ${searchQuery || currentFilter !== 'all' ? '<button class="btn btn-secondary" onclick="resetFilters()">Reset All Filters</button>' : ''}
                    </div>
                </td>
            </tr>
        `;
        if (selectAllBox) selectAllBox.checked = false;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const allOnPageSelected = pageUsers.every(u => selectedUserIds.has(u.id));
    if (selectAllBox) selectAllBox.checked = allOnPageSelected;

    tbody.innerHTML = pageUsers.map(user => {
        const name = user.full_name || 'Unnamed User';
        const initial = name.charAt(0).toUpperCase();
        const dateStr = formatDate(user.created_at);
        const isAdmin = user.role === 'admin';
        const isSuspended = user.status === 'suspended';
        const shortId = user.id ? user.id.substring(0, 8) : '-';
        const isChecked = selectedUserIds.has(user.id);

        return `
            <tr style="${isChecked ? 'background: rgba(99, 102, 241, 0.05);' : ''}">
                <td style="width: 40px; text-align: center;">
                    <input type="checkbox" class="user-row-checkbox" value="${user.id}" ${isChecked ? 'checked' : ''} onchange="onUserRowSelect('${user.id}', this.checked)">
                </td>
                <td>
                    <div class="user-avatar-cell">
                        <div class="avatar-circle" style="${isAdmin ? 'background: rgba(99, 102, 241, 0.15); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);' : ''}">
                            ${user.avatar_url ? `<img src="${user.avatar_url}" alt="${escapeHtml(name)}">` : initial}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--admin-text-main); line-height: 1.3;">${escapeHtml(name)}</div>
                            <div style="font-size: 12px; color: var(--admin-text-muted);">${escapeHtml(user.email || '')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${isAdmin ? 'badge-role-admin' : 'badge-role-user'}">
                        <i data-lucide="${isAdmin ? 'shield-check' : 'user'}" style="width: 13px; height: 13px; margin-right: 5px;"></i>
                        ${isAdmin ? 'Administrator' : 'Reader'}
                    </span>
                </td>
                <td>
                    ${isSuspended ? `
                        <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #ef4444;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #ef4444;"></span>
                            Suspended
                        </span>
                    ` : `
                        <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #10b981;">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);"></span>
                            Active
                        </span>
                    `}
                </td>
                <td style="color: var(--admin-text-muted); font-size: 13px;">
                    ${dateStr}
                </td>
                <td>
                    <button class="icon-btn" onclick="copyToClipboard('${user.id}')" title="Copy User ID" style="width: auto; height: auto; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; background: var(--admin-surface-hover); color: var(--admin-text-muted); border: 1px solid var(--admin-border); display: inline-flex; align-items: center; gap: 4px;">
                        ${shortId}... <i data-lucide="copy" style="width: 10px; height: 10px;"></i>
                    </button>
                </td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;" onclick="openEditModal('${user.id}')" title="Manage account">
                            <i data-lucide="settings" style="width: 13px; height: 13px; margin-right: 4px;"></i>
                            Manage
                        </button>
                        <button class="btn btn-danger" style="padding: 6px 10px; font-size: 12px; flex-shrink: 0;" onclick="confirmDeleteUser('${user.id}', '${escapeHtml(name)}')" title="Delete account">
                            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function onUserRowSelect(userId, isChecked) {
    if (isChecked) selectedUserIds.add(userId);
    else selectedUserIds.delete(userId);
    updateBulkBar();
    renderTable();
}

function toggleSelectAll(checkbox) {
    const filtered = getFilteredAndSortedUsers();
    const startIdx = (currentPage - 1) * pageSize;
    const pageUsers = filtered.slice(startIdx, startIdx + pageSize);

    if (checkbox.checked) {
        pageUsers.forEach(u => selectedUserIds.add(u.id));
    } else {
        pageUsers.forEach(u => selectedUserIds.delete(u.id));
    }
    updateBulkBar();
    renderTable();
}

function clearBulkSelection() {
    selectedUserIds.clear();
    const selectAllBox = document.getElementById('select-all-checkbox');
    if (selectAllBox) selectAllBox.checked = false;
    updateBulkBar();
    renderTable();
}

function updateBulkBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const countEl = document.getElementById('bulk-count');
    if (!bar) return;

    if (selectedUserIds.size > 0) {
        bar.classList.add('active');
        if (countEl) countEl.textContent = `${selectedUserIds.size} user${selectedUserIds.size === 1 ? '' : 's'} selected`;
    } else {
        bar.classList.remove('active');
    }
}

async function bulkSetRole(newRole) {
    if (selectedUserIds.size === 0) return;
    const roleLabel = newRole === 'admin' ? 'Administrator' : 'Reader';

    if (!confirm(`Are you sure you want to change the role of ${selectedUserIds.size} selected user(s) to ${roleLabel}?`)) {
        return;
    }

    try {
        const ids = Array.from(selectedUserIds);
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .in('id', ids);

        if (error) throw error;

        allUsers.forEach(u => {
            if (selectedUserIds.has(u.id)) u.role = newRole;
        });

        clearBulkSelection();
        updateStats();
        renderTable();
        showToast(`Updated ${ids.length} account(s) to ${roleLabel}`, 'success');
    } catch (err) {
        console.error(err);
        showToast('Bulk update failed: ' + err.message, 'error');
    }
}

async function bulkToggleStatus() {
    if (selectedUserIds.size === 0) return;
    
    const ids = Array.from(selectedUserIds);
    allUsers.forEach(u => {
        if (selectedUserIds.has(u.id)) {
            u.status = u.status === 'suspended' ? 'active' : 'suspended';
        }
    });

    clearBulkSelection();
    updateStats();
    renderTable();
    showToast(`Toggled account status for ${ids.length} user(s)`, 'success');
}

async function bulkDeleteUsers() {
    if (selectedUserIds.size === 0) return;

    if (!confirm(`Are you sure you want to permanently delete ${selectedUserIds.size} user(s)? This action cannot be undone.`)) {
        return;
    }

    try {
        const ids = Array.from(selectedUserIds);
        const { error } = await supabase
            .from('profiles')
            .delete()
            .in('id', ids);

        if (error) throw error;

        allUsers = allUsers.filter(u => !selectedUserIds.has(u.id));
        clearBulkSelection();
        updateStats();
        renderTable();
        showToast(`Deleted ${ids.length} account(s)`, 'success');
    } catch (err) {
        console.error(err);
        showToast('Bulk delete failed: ' + err.message, 'error');
    }
}

function changePage(delta) {
    currentPage += delta;
    renderTable();
}

function changePageSize(size) {
    pageSize = parseInt(size, 10) || 10;
    currentPage = 1;
    renderTable();
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            renderTable();
        });
    }

    const sortSelect = document.getElementById('sort-users');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTable();
        });
    }

    const sizeSelect = document.getElementById('select-page-size');
    if (sizeSelect) {
        sizeSelect.addEventListener('change', (e) => {
            changePageSize(e.target.value);
        });
    }

    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter') || 'all';
            currentPage = 1;
            renderTable();
        });
    });

    const editForm = document.getElementById('edit-user-form');
    if (editForm) {
        editForm.addEventListener('submit', handleSaveUser);
    }

    const addForm = document.getElementById('add-user-form');
    if (addForm) {
        addForm.addEventListener('submit', handleAddUser);
    }
}

function resetFilters() {
    searchQuery = '';
    currentFilter = 'all';
    currentSort = 'newest';
    currentPage = 1;
    const searchInput = document.getElementById('search-users');
    if (searchInput) searchInput.value = '';
    const sortSelect = document.getElementById('sort-users');
    if (sortSelect) sortSelect.value = 'newest';

    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(p => {
        if (p.getAttribute('data-filter') === 'all') p.classList.add('active');
        else p.classList.remove('active');
    });
    renderTable();
}

function openEditModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    selectedUserId = userId;
    const nameInput = document.getElementById('edit-user-name');
    const emailInput = document.getElementById('edit-user-email');
    const idInput = document.getElementById('edit-user-id');
    const avatarPreview = document.getElementById('edit-user-avatar');
    const statusSelect = document.getElementById('edit-user-status');

    if (nameInput) nameInput.value = user.full_name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (idInput) idInput.textContent = `ID: ${user.id || '-'}`;
    if (statusSelect) statusSelect.value = user.status || 'active';

    const displayName = user.full_name || user.email || 'User';
    if (avatarPreview) {
        avatarPreview.textContent = displayName.charAt(0).toUpperCase();
    }

    const roleAdminRadio = document.getElementById('role-admin');
    const roleUserRadio = document.getElementById('role-user');
    const cardAdmin = document.getElementById('card-role-admin');
    const cardUser = document.getElementById('card-role-user');

    if (user.role === 'admin') {
        if (roleAdminRadio) roleAdminRadio.checked = true;
        if (cardAdmin) cardAdmin.classList.add('selected');
        if (cardUser) cardUser.classList.remove('selected');
    } else {
        if (roleUserRadio) roleUserRadio.checked = true;
        if (cardUser) cardUser.classList.add('selected');
        if (cardAdmin) cardAdmin.classList.remove('selected');
    }

    const modal = document.getElementById('edit-user-modal');
    if (modal) modal.classList.add('active');
}

function selectRole(role) {
    const roleAdminRadio = document.getElementById('role-admin');
    const roleUserRadio = document.getElementById('role-user');
    const cardAdmin = document.getElementById('card-role-admin');
    const cardUser = document.getElementById('card-role-user');

    if (role === 'admin') {
        if (roleAdminRadio) roleAdminRadio.checked = true;
        if (cardAdmin) cardAdmin.classList.add('selected');
        if (cardUser) cardUser.classList.remove('selected');
    } else {
        if (roleUserRadio) roleUserRadio.checked = true;
        if (cardUser) cardUser.classList.add('selected');
        if (cardAdmin) cardAdmin.classList.remove('selected');
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) modal.classList.remove('active');
    selectedUserId = null;
}

async function handleSaveUser(e) {
    e.preventDefault();
    if (!selectedUserId) return;

    const saveBtn = document.getElementById('save-user-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner" style="display:inline-block;"></span> Saving...';
    }

    const fullName = document.getElementById('edit-user-name').value.trim();
    const roleAdminChecked = document.getElementById('role-admin').checked;
    const newRole = roleAdminChecked ? 'admin' : 'user';
    const statusSelect = document.getElementById('edit-user-status');
    const newStatus = statusSelect ? statusSelect.value : 'active';

    try {
        if (window.supabase) {
            await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    role: newRole,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedUserId)
                .catch(() => {});
        }

        const idx = allUsers.findIndex(u => u.id === selectedUserId);
        if (idx !== -1) {
            allUsers[idx].full_name = fullName;
            allUsers[idx].role = newRole;
            allUsers[idx].status = newStatus;
            localStorage.setItem('admin_local_users', JSON.stringify(allUsers));
        }

        updateStats();
        renderTable();
        closeEditModal();
        showToast('User account updated successfully', 'success');
    } catch (err) {
        console.error(err);
        showToast('Update failed: ' + err.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }
}

async function sendUserPasswordReset() {
    const emailInput = document.getElementById('edit-user-email');
    const email = emailInput ? emailInput.value : '';
    if (!email) return;

    try {
        if (window.supabase) {
            await supabase.auth.resetPasswordForEmail(email);
        }
        showToast(`Password reset link sent to ${email}`, 'success');
    } catch (err) {
        console.error(err);
        showToast('Reset failed: ' + err.message, 'error');
    }
}

function openAddModal() {
    const modal = document.getElementById('add-user-modal');
    const form = document.getElementById('add-user-form');
    if (form) form.reset();
    if (modal) modal.classList.add('active');
}

function closeAddModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.classList.remove('active');
}

async function handleAddUser(e) {
    e.preventDefault();
    const addBtn = document.getElementById('add-user-submit-btn');
    const email = document.getElementById('add-user-email').value.trim();
    const password = document.getElementById('add-user-password').value;
    const fullName = document.getElementById('add-user-name').value.trim();
    const role = document.getElementById('add-user-role').value;

    if (!email) return;

    if (addBtn) {
        addBtn.disabled = true;
        addBtn.innerHTML = '<span class="spinner" style="display:inline-block;"></span> Creating...';
    }

    try {
        let createdId = 'usr-' + Date.now();
        if (window.supabase) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });

                if (!error && data?.user) {
                    createdId = data.user.id;
                    if (role === 'admin') {
                        await supabase
                            .from('profiles')
                            .update({ role: 'admin' })
                            .eq('id', createdId);
                    }
                }
            } catch (err) {}
        }

        const newUser = {
            id: createdId,
            full_name: fullName || email.split('@')[0],
            email: email,
            role: role,
            status: 'active',
            created_at: new Date().toISOString()
        };

        allUsers.unshift(newUser);
        localStorage.setItem('admin_local_users', JSON.stringify(allUsers));
        updateStats();
        renderTable();
        closeAddModal();
        showToast('Account created successfully', 'success');
    } catch (err) {
        console.error(err);
        showToast('Failed to create account: ' + err.message, 'error');
    } finally {
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.textContent = 'Create Account';
        }
    }
}

async function confirmDeleteUser(userId, name) {
    if (!confirm(`Are you sure you want to remove user "${name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        if (window.supabase) {
            await supabase
                .from('profiles')
                .delete()
                .eq('id', userId)
                .catch(() => {});
        }

        allUsers = allUsers.filter(u => u.id !== userId);
        localStorage.setItem('admin_local_users', JSON.stringify(allUsers));
        selectedUserIds.delete(userId);
        updateBulkBar();
        updateStats();
        renderTable();
        showToast(`User "${name}" removed`, 'success');
    } catch (err) {
        console.error(err);
        showToast('Delete failed: ' + err.message, 'error');
    }
}

function exportUsersCSV() {
    if (allUsers.length === 0) {
        showToast('No user records available to export', 'error');
        return;
    }

    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Registration Date'];
    const rows = allUsers.map(u => [
        `"${u.id || ''}"`,
        `"${(u.full_name || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${u.role || 'user'}"`,
        `"${u.status || 'active'}"`,
        `"${u.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `shlok_users_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('User directory exported to CSV', 'success');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('User ID copied to clipboard', 'info');
    });
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info'}" style="width: 16px; height: 16px;"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.2s ease-out';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function formatDate(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
