const fs = require('fs');
const path = require('path');

// Utility for Component Extraction
function extractComponents() {
    console.log('Extracting components from index.html...');
    const htmlPath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(htmlPath)) {
        console.error('index.html not found');
        return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    
    const componentsDir = path.join(__dirname, 'components');
    if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir);
    }

    // Extract header
    const headerMatch = html.match(/<header class="site-header-redesign.*?<\/header>/s);
    if (headerMatch) {
        fs.writeFileSync(path.join(componentsDir, 'header.html'), headerMatch[0], 'utf8');
        console.log('Header extracted.');
    }

    // Extract search
    const searchMatch = html.match(/<div class="search-overlay" id="search-overlay" hidden>.*?<\/div>\s*<\/div>/s);
    if (searchMatch) {
        fs.writeFileSync(path.join(componentsDir, 'search.html'), searchMatch[0], 'utf8');
        console.log('Search extracted.');
    }

    // Extract sidebar
    const sidebarMatch = html.match(/<aside class="home-sidebar" aria-label="साइडबार">.*?<\/aside>/s);
    if (sidebarMatch) {
        fs.writeFileSync(path.join(componentsDir, 'sidebar.html'), sidebarMatch[0], 'utf8');
        console.log('Sidebar extracted.');
    }

    // Extract footer
    const footerMatch = html.match(/<footer class="site-footer" id="site-footer">.*?<\/footer>/s);
    if (footerMatch) {
        fs.writeFileSync(path.join(componentsDir, 'footer.html'), footerMatch[0], 'utf8');
        console.log('Footer extracted.');
    }
}

// Utility for Component Injection (Static Build)
function injectComponents() {
    console.log('Injecting components mounts into HTML files...');
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        let html = fs.readFileSync(filePath, 'utf8');
        const originalHtml = html;

        // Strip old elements
        html = html.replace(/<div class="utility-bar">.*?<\/div>\s*<\/div>\s*/s, '');
        html = html.replace(/<header class="site-header.*?id="site-header">.*?<\/header>/s, '');
        html = html.replace(/<div class="search-overlay"[^>]*>.*?<\/div>\s*<\/div>/s, '');
        html = html.replace(/<footer class="site-footer.*?id="site-footer">.*?<\/footer>/s, '');

        // Inject mounts
        const bodyMatch = html.match(/<body[^>]*>/);
        if (bodyMatch && !html.includes('<div id="global-header-mount"></div>')) {
            const mounts = '\n  <div id="global-header-mount"></div>\n  <div id="global-search-mount"></div>\n';
            html = html.substring(0, bodyMatch.index + bodyMatch[0].length) + mounts + html.substring(bodyMatch.index + bodyMatch[0].length);
        }

        if (!html.includes('<div id="global-footer-mount"></div>')) {
            const footerMounts = '\n  <div id="global-footer-mount"></div>\n';
            html = html.replace('</body>', footerMounts + '</body>');
        }

        if (!html.includes('js/global-components.js')) {
            const script = '  <script src="js/global-components.js"></script>\n';
            html = html.replace('</body>', script + '</body>');
        }

        if (html !== originalHtml) {
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`Updated ${file}`);
        }
    });
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--extract')) {
    extractComponents();
} else if (args.includes('--inject')) {
    injectComponents();
} else {
    console.log('Usage: node build.js [--extract] [--inject]');
}
