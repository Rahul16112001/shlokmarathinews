const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wnvioeabsiizpbldwcek.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudmlvZWFic2lpenBibGR3Y2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMzYwNzEsImV4cCI6MjEwMjYxMjA3MX0.c9rV5m0YdyzuXIhK7-P6tDwPqyIHqMkiJXZBZ9bS1KQ');
supabase.auth.signUp({
    email: 'admin2@shlokmarathi.news',
    password: 'password123'
}).then(async r => {
    console.log('Signup:', r.data);
    if (r.data?.user) {
        const { error } = await supabase.from('profiles').insert([{
            id: r.data.user.id,
            role: 'admin',
            full_name: 'Admin User 2',
            email: 'admin2@shlokmarathi.news'
        }]);
        console.log('Profile Insert Error:', error);
    }
});
