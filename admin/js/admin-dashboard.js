// /admin/js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // Basic init
    const authStatus = await checkAuthAndSetupProfile();
    
    // We try to load data, but gracefully handle failures
    await loadDashboardStats();
    await loadRecentArticles();
    await loadLiveNews();
});

async function checkAuthAndSetupProfile() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('Not authenticated');

        const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
        if (profile) {
            const name = profile.full_name || profile.email.split('@')[0];
            document.getElementById('admin-name').textContent = name;
            document.getElementById('admin-avatar-initial').textContent = name.charAt(0).toUpperCase();
        }
        return true;
    } catch (e) {
        console.warn("Supabase auth check failed. This is expected if keys are missing.", e);
        return false;
    }
}

function renderEmptyState(container, title, desc) {
    container.innerHTML = `
        <tr>
            <td colspan="4">
                <div class="empty-state">
                    <i data-lucide="database" class="empty-icon"></i>
                    <h3 class="empty-title">${title}</h3>
                    <p class="empty-desc">${desc}</p>
                </div>
            </td>
        </tr>
    `;
    lucide.createIcons();
}

function renderDivEmptyState(container, title, desc) {
    container.innerHTML = `
        <div class="empty-state">
            <i data-lucide="wifi-off" class="empty-icon"></i>
            <h3 class="empty-title">${title}</h3>
            <p class="empty-desc">${desc}</p>
        </div>
    `;
    lucide.createIcons();
}

async function loadDashboardStats() {
    try {
        const [articlesData, publishedData, breakingData, viewsData, videosData, pubVideosData, shortsData, videoViewsData, profilesData] = await Promise.all([
            supabase.from('articles').select('*', { count: 'exact', head: true }),
            supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            supabase.from('breaking_news').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('articles').select('views'),
            supabase.from('videos').select('*', { count: 'exact', head: true }),
            supabase.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            supabase.from('videos').select('*', { count: 'exact', head: true }).eq('video_type', 'SHORT_VIDEO'),
            supabase.from('videos').select('views'),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
        ]);

        const tA = articlesData.count;
        const pA = publishedData.count;
        const bN = breakingData.count;
        
        let totalViews = 0;
        if (viewsData.data) {
            totalViews = viewsData.data.reduce((sum, article) => sum + (article.views || 0), 0);
        }

        const tV = videosData.count;
        const pV = pubVideosData.count;
        const sV = shortsData.count;
        
        let totalVideoViews = 0;
        if (videoViewsData.data) {
            totalVideoViews = videoViewsData.data.reduce((sum, video) => sum + (video.views || 0), 0);
        }

        document.getElementById('stat-articles').textContent = tA || 0;
        document.getElementById('stat-published').textContent = pA || 0;
        document.getElementById('stat-breaking').textContent = bN || 0;
        document.getElementById('stat-views').textContent = totalViews > 0 ? totalViews.toLocaleString() : 'N/A';
        
        const statVideos = document.getElementById('stat-videos');
        if (statVideos) statVideos.textContent = tV || 0;
        
        const statPubVideos = document.getElementById('stat-published-videos');
        if (statPubVideos) statPubVideos.textContent = pV || 0;
        
        const statShorts = document.getElementById('stat-short-videos');
        if (statShorts) statShorts.textContent = sV || 0;
        
        const statVidViews = document.getElementById('stat-video-views');
        if (statVidViews) statVidViews.textContent = totalVideoViews > 0 ? totalVideoViews.toLocaleString() : '0';

        const statUsers = document.getElementById('stat-users');
        if (statUsers) statUsers.textContent = profilesData?.count || 0;
        
    } catch (error) {
        console.error("Stats fetch failed:", error);
        document.getElementById('stat-articles').textContent = '-';
        document.getElementById('stat-published').textContent = '-';
        document.getElementById('stat-breaking').textContent = '-';
        document.getElementById('stat-views').textContent = '-';
        
        const statVideos = document.getElementById('stat-videos');
        if (statVideos) statVideos.textContent = '-';
        const statPubVideos = document.getElementById('stat-published-videos');
        if (statPubVideos) statPubVideos.textContent = '-';
        const statShorts = document.getElementById('stat-short-videos');
        if (statShorts) statShorts.textContent = '-';
        const statVidViews = document.getElementById('stat-video-views');
        if (statVidViews) statVidViews.textContent = '-';
    }
}

async function loadRecentArticles() {
    const listContainer = document.getElementById('recent-articles-list');
    try {
        const { data: articles, error } = await supabase
            .from('articles')
            .select('id, title, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!articles || articles.length === 0) {
            renderEmptyState(listContainer, "No articles yet", "Create your first article to start publishing.");
            return;
        }

        listContainer.innerHTML = '';
        articles.forEach((article, index) => {
            const date = new Date(article.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
            
            let statusBadge = '';
            if (article.status === 'published') {
                statusBadge = `
                    <span style="display: flex; align-items: center; gap: 6px; color: #059669; font-weight: 600;">
                        <div class="live-dot"></div> Live
                    </span>
                `;
            } else {
                statusBadge = `
                    <span style="display: flex; align-items: center; gap: 6px; color: var(--admin-text-muted); font-weight: 600;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #94a3b8;"></div> ${article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                    </span>
                `;
            }

            const row = document.createElement('div');
            row.className = 'v-row';
            row.onclick = () => window.location.href = `article-editor.html?id=${article.id}`;
            
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 14px; background: var(--admin-surface-hover); border: 1px solid var(--admin-border); display: flex; align-items: center; justify-content: center; color: var(--admin-text-muted); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);">
                        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--admin-text-main); letter-spacing: -0.2px;">${article.title}</h3>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--admin-text-muted); font-weight: 500;">
                            <span>${date}</span>
                            ${statusBadge}
                        </div>
                    </div>
                </div>
                <button class="v-action" title="Edit">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
            `;
            listContainer.appendChild(row);
        });
        lucide.createIcons();
    } catch (error) {
        console.warn("Failed to load articles.", error);
        renderEmptyState(tbody, "Database Not Connected", "Please add your Supabase URL and Anon Key to js/admin-supabase.js to view data.");
    }
}

async function loadLiveNews() {
    const feed = document.getElementById('live-news-feed');
    try {
        const { data: news, error } = await supabase
            .from('breaking_news')
            .select('title, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        if (!news || news.length === 0) {
            feed.innerHTML = '<p style="color:#94a3b8; text-align:center; padding: 2rem 0;">No active breaking news.</p>';
            return;
        }

        feed.innerHTML = '';
        news.forEach(item => {
            const time = new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const div = document.createElement('div');
            div.innerHTML = `
                <div style="display:flex; align-items:center; margin-bottom:0.25rem; font-size:0.75rem; font-weight:600; color:#ef4444; letter-spacing:0.05em;">
                    <span class="live-indicator"></span> LIVE
                </div>
                <h4 style="font-size:0.875rem; font-weight:600; margin-bottom:0.25rem; color:#e2e8f0;">${item.title}</h4>
                <div style="font-size:0.75rem; color:#94a3b8;">${time}</div>
            `;
            feed.appendChild(div);
        });

    } catch (error) {
        renderDivEmptyState(feed, "Database Not Connected", "Configure Supabase to view breaking news.");
    }
}
