// Strapi Content Manager - Only updates meta tags and specific content
(function() {
    const STRAPI_URL = 'http://localhost:1337';
    
    function getPageFileName() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }
    
    async function loadContent() {
        const fileName = getPageFileName();
        
        try {
            const response = await fetch(`${STRAPI_URL}/api/github-html-files?populate=*`);
            if (!response.ok) return;
            
            const data = await response.json();
            if (!data.data || data.data.length === 0) return;
            
            // Find matching file
            let content = data.data.find(item => item.attributes.fileName === fileName);
            if (!content) {
                const baseFileName = fileName.replace('.html', '');
                content = data.data.find(item => item.attributes.fileName === baseFileName);
            }
            if (!content) {
                const fullFileName = fileName.includes('.html') ? fileName : fileName + '.html';
                content = data.data.find(item => item.attributes.fileName === fullFileName);
            }
            
            // Apply only if published
            if (content && content.attributes.publishedAt) {
                applyContent(content.attributes);
            }
        } catch (error) {
            // Fail silently
        }
    }
    
    function applyContent(content) {
        // Update document title
        if (content.htmlTitle) {
            document.title = content.htmlTitle;
        }
        
        // Update meta description
        if (content.metaDescription) {
            updateMeta('description', content.metaDescription);
        }
        
        // Update meta keywords
        if (content.metaKeywords) {
            updateMeta('keywords', content.metaKeywords);
        }
    }
    
    function updateMeta(name, content) {
        // Only look for meta tags in head
        let meta = document.head.querySelector(`meta[name="${name}"]`);
        
        if (meta) {
            // Update existing meta tag
            meta.content = content;
        } else {
            // Create new meta tag only in head
            meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
        }
    }
    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();