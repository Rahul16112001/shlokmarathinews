document.addEventListener('DOMContentLoaded', async () => {
    const liveTvForm = document.getElementById('live-tv-form');
    const alertBox = document.getElementById('live-tv-alert');
    const urlInput = document.getElementById('live-url');
    const nameInput = document.getElementById('channel-name');
    const activeInput = document.getElementById('is-active');
    const idInput = document.getElementById('channel-id');
    const playerWrapper = document.getElementById('preview-player-container');
    const statusBadge = document.getElementById('stream-status-badge');

    function extractYouTubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function updatePreview(url, isActive) {
        const vidId = extractYouTubeId(url);
        if (vidId && playerWrapper) {
            playerWrapper.innerHTML = `
                <iframe 
                    style="width: 100%; height: 100%; border: none; border-radius: 12px;" 
                    src="https://www.youtube-nocookie.com/embed/${vidId}?autoplay=0&rel=0" 
                    title="Live Stream Preview" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
        } else if (playerWrapper) {
            playerWrapper.innerHTML = `
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--admin-text-muted); padding: 2rem; text-align: center;">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 12px; opacity: 0.7;"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                    <div style="font-size: 14px; font-weight: 600; color: var(--admin-text-main); margin-bottom: 4px;">No Stream Configured</div>
                    <div style="font-size: 12px;">Enter a valid YouTube Live URL on the left to activate player preview.</div>
                </div>
            `;
        }

        if (statusBadge) {
            if (isActive && vidId) {
                statusBadge.className = 'live-status-pill on-air';
                statusBadge.innerHTML = '<span class="pulse-red-dot"></span><span>ON AIR (LIVE)</span>';
            } else {
                statusBadge.className = 'live-status-pill offline';
                statusBadge.innerHTML = '<span class="dot-offline"></span><span>STANDBY / OFFLINE</span>';
            }
        }
    }

    if (urlInput) {
        urlInput.addEventListener('input', () => {
            updatePreview(urlInput.value, activeInput.checked);
        });
    }

    if (activeInput) {
        activeInput.addEventListener('change', () => {
            updatePreview(urlInput.value, activeInput.checked);
        });
    }

    async function loadLiveTvConfig() {
        try {
            const { data, error } = await supabase
                .from('live_tv_channels')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const channel = data[0];
                idInput.value = channel.id;
                nameInput.value = channel.channel_name || '';
                urlInput.value = channel.live_url || '';
                activeInput.checked = Boolean(channel.is_active);
                updatePreview(channel.live_url, channel.is_active);
            } else {
                updatePreview('', false);
            }
        } catch (error) {
            console.error('Error loading Live TV config:', error);
            updatePreview('', false);
        }
    }

    liveTvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = idInput.value;
        const channelName = nameInput.value.trim();
        const liveUrl = urlInput.value.trim();
        const isActive = activeInput.checked;

        if (!extractYouTubeId(liveUrl)) {
            showAlert('Please enter a valid YouTube Live or video URL (e.g. https://www.youtube.com/watch?v=...)', 'error');
            return;
        }

        const payload = {
            channel_name: channelName,
            live_url: liveUrl,
            platform: 'youtube',
            is_active: isActive,
            updated_at: new Date().toISOString()
        };

        try {
            let res;
            if (id) {
                res = await supabase
                    .from('live_tv_channels')
                    .update(payload)
                    .eq('id', id);
            } else {
                res = await supabase
                    .from('live_tv_channels')
                    .insert([payload]);
            }

            if (res.error) throw res.error;
            
            showAlert('Live TV channel stream saved successfully!', 'success');
            loadLiveTvConfig();
        } catch (error) {
            console.error('Error saving Live TV config:', error);
            showAlert('Failed to save configuration. Please check your Supabase connection.', 'error');
        }
    });

    function showAlert(message, type) {
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.className = type === 'error' ? 'alert alert-error' : 'alert alert-success';
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }

    loadLiveTvConfig();
});
