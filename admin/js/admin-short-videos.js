// /admin/js/admin-short-videos.js

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('videos-tbody');
    const modal = document.getElementById('video-modal');
    const modalTitle = document.getElementById('video-modal-title');
    const form = document.getElementById('video-form');
    
    // Form fields
    const idInput = document.getElementById('video-id');
    const titleInput = document.getElementById('video-title');
    const categorySelect = document.getElementById('video-category');
    const descInput = document.getElementById('video-description');
    
    const videoFileInput = document.getElementById('video-file');
    const videoUrlInput = document.getElementById('video-url');
    const videoUploadProgress = document.getElementById('video-upload-progress');
    
    const thumbFileInput = document.getElementById('thumbnail-file');
    const thumbUrlInput = document.getElementById('video-thumbnail');
    const thumbUploadProgress = document.getElementById('thumbnail-upload-progress');
    
    const statusSelect = document.getElementById('video-status');
    const btnSubmit = form.querySelector('button[type="submit"]');
    
    // Buttons
    const btnUpload = document.getElementById('btn-upload-video');
    const btnCloseModal = document.getElementById('btn-close-modal');

    function renderEmptyState(container, title, desc) {
        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state" style="padding: 2rem;">
                        <i data-lucide="smartphone" class="empty-icon"></i>
                        <h3 class="empty-title">${title}</h3>
                        <p class="empty-desc">${desc}</p>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
    }

    async function loadCategories() {
        try {
            const { data, error } = await supabase.from('categories').select('id, name').eq('is_active', true);
            if (error) throw error;
            
            data.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    }

    async function loadVideos() {
        tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton skeleton-text" style="height:40px; margin:0;"></div></td></tr>';
        
        try {
            const { data: videos, error } = await supabase
                .from('videos')
                .select('*, category:categories(name)')
                .eq('video_type', 'SHORT_VIDEO')
                .order('created_at', { ascending: false });

            if (error) throw error;

            tbody.innerHTML = '';
            if (videos.length === 0) {
                renderEmptyState(tbody, "No short videos found", "Click Upload Video to add your first short.");
                return;
            }

            videos.forEach(vid => {
                const isPublished = vid.status === 'published';
                const statusHtml = isPublished 
                    ? `<span class="badge-stat"><div class="dot-live" style="width:6px; height:6px; border-radius:50%; background:#10b981;"></div> Published</span>`
                    : `<span class="badge-stat draft" style="background:var(--admin-surface-hover); color:var(--admin-text-muted); border:1px solid var(--admin-border);"><div style="width:6px; height:6px; border-radius:50%; background:#94a3b8;"></div> Draft</span>`;
                const date = new Date(vid.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                const catName = vid.category ? vid.category.name : 'Uncategorized';
                const thumb = vid.thumbnail_url || '../assits/shlokmrathi news logo.png';

                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom: 1px solid var(--admin-border); transition: background 0.15s;';
                tr.innerHTML = `
                    <td style="padding: 14px 20px;">
                        <div style="position: relative; width: 44px; height: 76px; border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--admin-border); background: var(--admin-bg);">
                            <img src="${thumb}" alt="Reel" style="width: 100%; height: 100%; object-fit: cover;">
                            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5)); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px;">
                                <svg width="12" height="12" fill="#ffffff" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 14px 20px;">
                        <span style="font-size: 14px; font-weight: 600; color: var(--admin-text-main); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${vid.title}</span>
                    </td>
                    <td style="padding: 14px 20px;"><span class="badge-cat">${catName}</span></td>
                    <td style="padding: 14px 20px;">${statusHtml}</td>
                    <td style="padding: 14px 20px; font-size: 13px; color: var(--admin-text-muted); font-weight: 500;">${date}</td>
                    <td style="padding: 14px 20px; text-align: right;">
                        <div style="display: flex; justify-content: flex-end; gap: 8px;">
                            <button class="action-btn edit btn-edit" data-vid='${JSON.stringify(vid).replace(/'/g, "&#39;")}' title="Edit">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="action-btn delete btn-delete" data-id="${vid.id}" title="Delete">
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
                    const vid = JSON.parse(e.target.closest('.btn-edit').getAttribute('data-vid').replace(/&#39;/g, "'"));
                    idInput.value = vid.id;
                    titleInput.value = vid.title;
                    categorySelect.value = vid.category_id || '';
                    descInput.value = vid.description || '';
                    videoUrlInput.value = vid.video_url;
                    thumbUrlInput.value = vid.thumbnail_url || '';
                    statusSelect.value = vid.status;
                    
                    videoFileInput.value = '';
                    thumbFileInput.value = '';
                    
                    modalTitle.textContent = 'Edit Short Video';
                    modal.style.display = 'flex';
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this short video?')) {
                        const id = e.target.closest('.btn-delete').getAttribute('data-id');
                        const { error } = await supabase.from('videos').delete().eq('id', id);
                        if (error) {
                            console.error(error);
                            alert('Failed to delete video.');
                        } else {
                            loadVideos();
                        }
                    }
                });
            });

        } catch (error) {
            console.warn(error);
            renderEmptyState(tbody, "Database Error", "Failed to load short videos from Supabase.");
        }
    }

    function uploadFile(file, bucket, progressEl) {
        return new Promise(async (resolve, reject) => {
            progressEl.style.display = 'block';
            progressEl.textContent = 'Uploading: 0%';
            progressEl.style.color = 'inherit'; // Reset color
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            let token = SUPABASE_ANON_KEY;
            try {
                const { data: { session } } = await window.supabase.auth.getSession();
                if (session) token = session.access_token;
            } catch(e) { }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.setRequestHeader('x-upsert', 'false');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    progressEl.textContent = `Uploading: ${percentComplete}%`;
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    progressEl.textContent = 'Upload complete!';
                    progressEl.style.color = 'green';
                    const { data: publicUrlData } = window.supabase.storage.from(bucket).getPublicUrl(filePath);
                    resolve({ url: publicUrlData.publicUrl, path: filePath });
                } else {
                    let errorMsg = 'Upload failed';
                    try {
                        const res = JSON.parse(xhr.responseText);
                        if (res.message) errorMsg += ': ' + res.message;
                    } catch (e) {}
                    progressEl.textContent = errorMsg;
                    progressEl.style.color = 'var(--admin-danger)';
                    reject(new Error(errorMsg));
                }
            };

            xhr.onerror = () => {
                progressEl.textContent = 'Upload failed due to network error';
                progressEl.style.color = 'var(--admin-danger)';
                reject(new Error('Network error'));
            };

            xhr.send(file);
        });
    }

    // Modal Logic
    btnUpload.addEventListener('click', () => {
        form.reset();
        idInput.value = '';
        videoUrlInput.value = '';
        thumbUrlInput.value = '';
        videoUploadProgress.style.display = 'none';
        thumbUploadProgress.style.display = 'none';
        modalTitle.textContent = 'Upload Short Video';
        modal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Saving...';
        
        try {
            let finalVideoUrl = videoUrlInput.value;
            let finalThumbUrl = thumbUrlInput.value;
            
            if (videoFileInput.files.length > 0) {
                const res = await uploadFile(videoFileInput.files[0], 'videos', videoUploadProgress);
                finalVideoUrl = res.url;
            }
            
            if (thumbFileInput.files.length > 0) {
                const res = await uploadFile(thumbFileInput.files[0], 'video-thumbnails', thumbUploadProgress);
                finalThumbUrl = res.url;
            }
            
            if (!finalVideoUrl && !idInput.value) {
                throw new Error("Please select a video file to upload.");
            }

            const vidData = {
                title: titleInput.value.trim(),
                description: descInput.value.trim(),
                category_id: categorySelect.value || null,
                video_url: finalVideoUrl,
                thumbnail_url: finalThumbUrl || null,
                status: statusSelect.value,
                video_type: 'SHORT_VIDEO'
            };

            if (vidData.status === 'published' && !idInput.value) {
                vidData.published_at = new Date().toISOString();
            }

            let error;
            if (idInput.value) {
                const res = await supabase.from('videos').update(vidData).eq('id', idInput.value);
                error = res.error;
            } else {
                // Get user ID
                const { data: { user } } = await supabase.auth.getUser();
                if (user) vidData.author_id = user.id;
                
                const res = await supabase.from('videos').insert([vidData]);
                error = res.error;
            }

            if (error) throw error;

            modal.style.display = 'none';
            loadVideos();
        } catch (error) {
            console.warn(error);
            alert(error.message || 'Failed to save video. Check your Supabase configuration.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Save';
        }
    });

    await loadCategories();
    loadVideos();
});
