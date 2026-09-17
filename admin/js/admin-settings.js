// /admin/js/admin-settings.js

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('settings-form');
    const alertBox = document.getElementById('settings-alert');
    
    // Inputs
    const idInput = document.getElementById('setting-id');
    const siteNameInput = document.getElementById('site-name');
    const contactEmailInput = document.getElementById('contact-email');
    const siteDescriptionInput = document.getElementById('site-description');
    
    const socialFacebook = document.getElementById('social-facebook');
    const socialTwitter = document.getElementById('social-twitter');
    const socialInstagram = document.getElementById('social-instagram');
    const socialYoutube = document.getElementById('social-youtube');

    await loadSettings();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const settingsData = {
            site_name: siteNameInput.value,
            contact_email: contactEmailInput.value,
            description: siteDescriptionInput.value,
            social_links: {
                facebook: socialFacebook.value,
                twitter: socialTwitter.value,
                instagram: socialInstagram.value,
                youtube: socialYoutube.value
            }
        };

        try {
            let error;
            if (idInput.value) {
                const res = await supabase.from('site_settings').update(settingsData).eq('id', idInput.value);
                error = res.error;
            } else {
                const res = await supabase.from('site_settings').insert([settingsData]);
                error = res.error;
            }

            if (error) throw error;
            
            showAlert('Settings saved successfully', 'success');
        } catch (error) {
            console.error(error);
            showAlert('Failed to save settings', 'error');
        }
    });

    async function loadSettings() {
        try {
            const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
            
            // It's okay if no rows exist initially
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                idInput.value = data.id;
                siteNameInput.value = data.site_name || '';
                contactEmailInput.value = data.contact_email || '';
                siteDescriptionInput.value = data.description || '';
                
                if (data.social_links) {
                    socialFacebook.value = data.social_links.facebook || '';
                    socialTwitter.value = data.social_links.twitter || '';
                    socialInstagram.value = data.social_links.instagram || '';
                    socialYoutube.value = data.social_links.youtube || '';
                }
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            showAlert("Failed to load settings.", "error");
        }
    }

    function showAlert(message, type = 'info') {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        
        if (type === 'success') {
            alertBox.style.background = 'rgba(16, 185, 129, 0.1)';
            alertBox.style.color = 'var(--admin-success)';
            alertBox.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        } else if (type === 'error') {
            alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
            alertBox.style.color = 'var(--admin-danger)';
            alertBox.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        }
        
        alertBox.style.display = 'block';
        setTimeout(() => alertBox.style.display = 'none', 3000);
    }
});
