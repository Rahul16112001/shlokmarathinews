// /admin/js/admin-breaking-news.js

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('breaking-tbody');
    const modal = document.getElementById('breaking-modal');
    const modalTitle = document.getElementById('breaking-modal-title');
    const form = document.getElementById('breaking-form');
    
    // Form fields
    const idInput = document.getElementById('breaking-id');
    const titleInput = document.getElementById('breaking-title');
    const activeInput = document.getElementById('breaking-active');
    
    // Buttons
    const btnCreate = document.getElementById('btn-create-alert');
    const btnCloseModal = document.getElementById('btn-close-modal');

    function renderEmptyState(container, title, desc) {
        container.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state" style="padding: 2rem;">
                        <i data-lucide="radio" class="empty-icon"></i>
                        <h3 class="empty-title">${title}</h3>
                        <p class="empty-desc">${desc}</p>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
    }

    async function loadAlerts() {
        tbody.innerHTML = '<tr><td colspan="4"><div class="skeleton skeleton-text" style="height:40px; margin:0;"></div></td></tr>';
        
        try {
            const { data: alerts, error } = await supabase
                .from('breaking_news')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            tbody.innerHTML = '';
            if (alerts.length === 0) {
                renderEmptyState(tbody, "No Active Alerts", "Create a breaking news alert to display it on the public portal.");
                return;
            }

            alerts.forEach(alert => {
                const statusHtml = alert.is_active 
                    ? `<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:4px 10px; border-radius:99px; font-size:11.5px; font-weight:700;"><div style="width:6px; height:6px; border-radius:50%; background:#ef4444; box-shadow:0 0 6px rgba(239,68,68,0.7);"></div> ON TICKER</span>`
                    : `<span style="display:inline-flex; align-items:center; gap:6px; background:var(--admin-surface-hover); color:var(--admin-text-muted); border:1px solid var(--admin-border); padding:4px 10px; border-radius:99px; font-size:11.5px; font-weight:700;"><div style="width:6px; height:6px; border-radius:50%; background:#94a3b8;"></div> INACTIVE</span>`;
                const date = new Date(alert.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom: 1px solid var(--admin-border); transition: background 0.15s;';
                tr.innerHTML = `
                    <td style="padding: 16px 24px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 7px; background: rgba(239,68,68,0.1); color: #ef4444; flex-shrink: 0;">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            </span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--admin-text-main); line-height: 1.4;">${alert.title}</span>
                        </div>
                    </td>
                    <td style="padding: 16px 24px;">${statusHtml}</td>
                    <td style="padding: 16px 24px; font-size: 13px; color: var(--admin-text-muted); font-weight: 500;">${date}</td>
                    <td style="padding: 16px 24px; text-align: right;">
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button class="action-btn edit btn-edit" data-alert='${JSON.stringify(alert).replace(/'/g, "&#39;")}' title="Edit">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="action-btn delete btn-delete" data-id="${alert.id}" title="Delete">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events:none;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            lucide.createIcons();

            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const alert = JSON.parse(e.target.closest('.btn-edit').getAttribute('data-alert').replace(/&#39;/g, "'"));
                    idInput.value = alert.id;
                    titleInput.value = alert.title;
                    activeInput.checked = alert.is_active;
                    
                    modalTitle.textContent = 'Edit Alert';
                    modal.style.display = 'flex';
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this alert?')) {
                        const id = e.target.closest('.btn-delete').getAttribute('data-id');
                        const { error } = await supabase.from('breaking_news').delete().eq('id', id);
                        if (error) {
                            console.error(error);
                            alert('Failed to delete alert.');
                        } else {
                            loadAlerts();
                        }
                    }
                });
            });

        } catch (error) {
            console.warn(error);
            renderEmptyState(tbody, "Database Error", "Failed to load breaking news from Supabase.");
        }
    }

    // Modal Logic
    btnCreate.addEventListener('click', () => {
        form.reset();
        idInput.value = '';
        activeInput.checked = true; // default to true
        modalTitle.textContent = 'Create Alert';
        modal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const alertData = {
            title: titleInput.value.trim(),
            is_active: activeInput.checked
        };

        try {
            let error;
            if (idInput.value) {
                const res = await supabase.from('breaking_news').update(alertData).eq('id', idInput.value);
                error = res.error;
            } else {
                const res = await supabase.from('breaking_news').insert([alertData]);
                error = res.error;
            }

            if (error) throw error;

            modal.style.display = 'none';
            loadAlerts();
        } catch (error) {
            console.warn(error);
            alert('Failed to save alert. Check your Supabase configuration.');
        }
    });

    loadAlerts();
});
