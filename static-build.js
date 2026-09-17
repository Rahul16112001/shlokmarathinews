const fs = require('fs');
const path = require('path');

function injectStaticComponents() {
    console.log('Statically injecting components into HTML files...');
    const componentsDir = path.join(__dirname, 'components');
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

    let headerHtml = '';
    let footerHtml = '';
    let searchHtml = '';
    let sidebarHtml = '';

    try {
        headerHtml = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8');
        footerHtml = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8');
        searchHtml = fs.readFileSync(path.join(componentsDir, 'search.html'), 'utf8');
        sidebarHtml = fs.readFileSync(path.join(componentsDir, 'sidebar.html'), 'utf8');
    } catch (e) {
        console.error('Failed to load components:', e.message);
        return;
    }

    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let html = fs.readFileSync(filePath, 'utf8');
        const originalHtml = html;

        // Remove dynamic script tag
        html = html.replace(/<script src="js\/global-components\.js[^"]*"><\/script>\s*/g, '');

        // Replace mounts with actual HTML
        html = html.replace(/<div id="global-header-mount"><\/div>/g, headerHtml);
        html = html.replace(/<div id="global-footer-mount"><\/div>/g, footerHtml);
        html = html.replace(/<div id="global-search-mount"><\/div>/g, searchHtml);
        html = html.replace(/<div id="global-sidebar-mount"><\/div>/g, sidebarHtml);

        if (html !== originalHtml) {
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`Successfully built: ${file}`);
        }
    });
}

injectStaticComponents();
