document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const alertBox = document.getElementById('editor-alert');
    
    const titleInput = document.getElementById('article-title');
    const slugInput = document.getElementById('article-slug');
    const excerptInput = document.getElementById('article-excerpt');
    const contentInput = document.getElementById('article-content');
    const statusSelect = document.getElementById('article-status');
    const isFeaturedInput = document.getElementById('is-featured');
    const isBreakingInput = document.getElementById('is-breaking');
    const isTrendingInput = document.getElementById('is-trending');
    const categorySelect = document.getElementById('article-category');
    const modeBadge = document.getElementById('story-mode-badge');
    
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageUploadPrompt = document.getElementById('image-upload-prompt');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewImg = document.getElementById('preview-img-el') || imagePreview.querySelector('img');
    const fileInput = document.getElementById('article-image');
    const btnRemoveImage = document.getElementById('btn-remove-image');
    const imageUrlInput = document.getElementById('article-image-url');

    const titleCountEl = document.getElementById('title-word-count');
    const bodyCountEl = document.getElementById('body-word-count');

    initToolbar();
    initCounters();

    await loadCategories();

    if (articleId) {
        if (modeBadge) {
            modeBadge.textContent = 'Editing Story';
            modeBadge.style.background = 'var(--admin-primary-light)';
            modeBadge.style.color = 'var(--admin-primary)';
        }
        await loadArticle(articleId);
    }

    titleInput.addEventListener('input', () => {
        if (!articleId || slugInput.value === '') {
            slugInput.value = generateSlug(titleInput.value);
        }
    });

    const bindSave = (elId, status) => {
        const el = document.getElementById(elId);
        if (el) el.addEventListener('click', () => saveArticle(status));
    };

    bindSave('btn-save-draft', 'draft');
    bindSave('btn-publish', 'published');
    bindSave('btn-save-draft-sidebar', 'draft');
    bindSave('btn-publish-sidebar', 'published');

    if (imageUploadPrompt) {
        imageUploadPrompt.addEventListener('click', () => {
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            showAlert('Uploading image...', 'info');
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('article-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('article-images')
                .getPublicUrl(fileName);

            setImage(data.publicUrl);
            showAlert('Image uploaded successfully', 'success');
        } catch (error) {
            console.error(error);
            showAlert('Failed to upload image. Storage bucket may need configuration.', 'error');
        }
    });

    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', (e) => {
            e.stopPropagation();
            setImage('');
            fileInput.value = '';
        });
    }

    function setImage(url) {
        imageUrlInput.value = url;
        if (url) {
            imagePreviewImg.src = url;
            imagePreview.style.display = 'block';
            imageUploadPrompt.style.display = 'none';
        } else {
            imagePreviewImg.src = '';
            imagePreview.style.display = 'none';
            imageUploadPrompt.style.display = 'block';
        }
    }

    function initCounters() {
        const updateWordCount = (input, el) => {
            if (!input || !el) return;
            const text = input.value.trim();
            const words = text ? text.split(/\s+/).length : 0;
            el.textContent = `${words} word${words === 1 ? '' : 's'}`;
        };

        titleInput.addEventListener('input', () => updateWordCount(titleInput, titleCountEl));
        contentInput.addEventListener('input', () => updateWordCount(contentInput, bodyCountEl));
    }

    function initToolbar() {
        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.tb-btn');
            if (!btn) return;
            const cmd = btn.getAttribute('data-cmd');
            formatText(cmd);
        });
    }

    function formatText(cmd) {
        const textarea = contentInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        let replacement = '';

        switch (cmd) {
            case 'bold':
                replacement = selected ? `**${selected}**` : '**Bold Text**';
                break;
            case 'italic':
                replacement = selected ? `*${selected}*` : '*Italic Text*';
                break;
            case 'underline':
                replacement = selected ? `<u>${selected}</u>` : '<u>Underlined Text</u>';
                break;
            case 'h2':
                replacement = selected ? `\n## ${selected}\n` : '\n## Subheading\n';
                break;
            case 'h3':
                replacement = selected ? `\n### ${selected}\n` : '\n### Section Heading\n';
                break;
            case 'list':
                replacement = selected ? `\n- ${selected}` : '\n- List item';
                break;
            case 'quote':
                replacement = selected ? `\n> ${selected}\n` : '\n> Quoted statement\n';
                break;
            case 'link':
                const url = prompt('Enter link URL:', 'https://');
                if (url) {
                    replacement = selected ? `[${selected}](${url})` : `[Link Text](${url})`;
                } else {
                    return;
                }
                break;
            default:
                return;
        }

        textarea.setRangeText(replacement, start, end, 'end');
        textarea.focus();
    }

    async function loadCategories() {
        try {
            const { data: categories, error } = await supabase
                .from('categories')
                .select('id, name')
                .eq('is_active', true)
                .order('name', { ascending: true });
                
            if (error) throw error;

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
            showAlert('Failed to load categories.', 'error');
        }
    }

    async function loadArticle(id) {
        try {
            const { data: article, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            titleInput.value = article.title || '';
            slugInput.value = article.slug || '';
            excerptInput.value = article.excerpt || '';
            contentInput.value = article.content || '';
            statusSelect.value = article.status || 'draft';
            isFeaturedInput.checked = article.is_featured || false;
            isBreakingInput.checked = article.is_breaking || false;
            isTrendingInput.checked = article.is_trending || false;
            categorySelect.value = article.category_id || '';
            
            const cover = article.featured_image || article.image_url;
            if (cover) {
                setImage(cover);
            }

            titleInput.dispatchEvent(new Event('input'));
            contentInput.dispatchEvent(new Event('input'));

        } catch (error) {
            console.error('Error loading article:', error);
            showAlert('Failed to load article.', 'error');
        }
    }

    async function saveArticle(forceStatus = null) {
        try {
            const status = forceStatus || statusSelect.value;
            statusSelect.value = status;
            
            const title = titleInput.value.trim();
            const slug = slugInput.value.trim() || generateSlug(title);
            
            if (!title) {
                showAlert('Headline / Title is required', 'error');
                titleInput.focus();
                return;
            }

            showAlert('Saving story...', 'info');

            const { data: { user } } = await supabase.auth.getUser();

            const articleData = {
                title,
                slug,
                excerpt: excerptInput.value.trim(),
                content: contentInput.value.trim(),
                status,
                is_featured: isFeaturedInput.checked,
                is_breaking: isBreakingInput.checked,
                is_trending: isTrendingInput.checked,
                category_id: categorySelect.value || null,
                featured_image: imageUrlInput.value || null,
                author_id: user ? user.id : null
            };

            if (status === 'published' && !articleId) {
                articleData.published_at = new Date().toISOString();
            }

            let result;
            if (articleId) {
                result = await supabase
                    .from('articles')
                    .update(articleData)
                    .eq('id', articleId);
            } else {
                result = await supabase
                    .from('articles')
                    .insert([articleData])
                    .select();
            }

            if (result.error) throw result.error;

            showAlert(`Article ${articleId ? 'updated' : 'published'} successfully!`, 'success');
            
            if (!articleId && result.data && result.data.length > 0) {
                setTimeout(() => {
                    window.location.href = `article-editor.html?id=${result.data[0].id}`;
                }, 1000);
            }

        } catch (error) {
            console.error('Error saving article:', error);
            showAlert(error.message, 'error');
        }
    }

    function generateSlug(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-\u0900-\u097F]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    function showAlert(message, type = 'info') {
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        
        if (type === 'success') {
            alertBox.style.background = 'rgba(16, 185, 129, 0.12)';
            alertBox.style.color = 'var(--admin-success)';
            alertBox.style.border = '1px solid rgba(16, 185, 129, 0.25)';
        } else if (type === 'error') {
            alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
            alertBox.style.color = 'var(--admin-danger)';
            alertBox.style.border = '1px solid rgba(239, 68, 68, 0.25)';
        } else {
            alertBox.style.background = 'var(--admin-surface)';
            alertBox.style.color = 'var(--admin-text-main)';
            alertBox.style.border = '1px solid var(--admin-border)';
        }
        
        alertBox.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                alertBox.style.display = 'none';
            }, 3000);
        }
    }
});
