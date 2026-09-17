document.addEventListener('DOMContentLoaded', async () => {
    // Only run if the live tv container exists
    const iframeContainer = document.getElementById('live-tv-iframe-container');
    const placeholderUi = document.getElementById('live-tv-placeholder-ui');

    if (!iframeContainer || !placeholderUi) return;

    try {
        const { data, error } = await window.supabase
            .from('live_tv_channels')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            const channel = data[0];
            const liveUrl = channel.live_url;

            // Extract video ID from youtube URL
            let videoId = '';
            if (liveUrl.includes('youtube.com/live/')) {
                videoId = liveUrl.split('youtube.com/live/')[1].split('?')[0];
            } else if (liveUrl.includes('youtube.com/watch')) {
                videoId = new URLSearchParams(liveUrl.split('?')[1]).get('v');
            } else if (liveUrl.includes('youtu.be/')) {
                videoId = liveUrl.split('youtu.be/')[1].split('?')[0];
            }

            if (videoId) {
                // Hide placeholder
                placeholderUi.style.display = 'none';

                // Inject Iframe
                iframeContainer.innerHTML = `
                    <iframe 
                        id="tv-youtube-player"
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&enablejsapi=1&controls=1" 
                        title="${channel.channel_name}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        referrerpolicy="strict-origin-when-cross-origin" 
                        allowfullscreen
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
                    </iframe>
                `;
                
                // Initialize the YT Player now that the iframe exists
                setTimeout(() => {
                    if (typeof window.initYtPlayer === 'function') {
                        window.initYtPlayer();
                    }
                }, 100);
            } else {
                showUnavailableState();
            }
        } else {
            // No active live TV stream
            showUnavailableState();
        }

    } catch (err) {
        console.error("Error loading Live TV:", err);
    }

    function showUnavailableState() {
        iframeContainer.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #020202; color: #9ca3af; font-family: monospace; font-size: 14px; text-align: center; padding: 20px;">
                <div>
                    <div style="margin-bottom: 10px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin: 0 auto;">
                            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                            <polyline points="17 2 12 7 7 2"></polyline>
                        </svg>
                    </div>
                    Live News currently unavailable
                </div>
            </div>
        `;
        placeholderUi.style.display = 'none'; // hide the standard REC button
    }
});
