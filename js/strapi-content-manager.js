// Strapi Content Manager - Only updates meta tags, never touches page content
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
                applyMetaTags(content.attributes);
            }
        } catch (error) {
            // Fail silently
        }
    }
    
    function applyMetaTags(content) {
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
        
        // Update body content if provided
        if (content.bodyContent) {
            replaceBodyContent(content.bodyContent);
        }
    }
    
    function updateMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) {
            meta.content = content;
        }
    }
    
    function replaceBodyContent(newContent) {
        // Parse new content
        const temp = document.createElement('div');
        temp.innerHTML = newContent;
        
        // Get all text elements from new content
        const newElements = temp.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li, td, th');
        
        newElements.forEach(newEl => {
            const text = newEl.textContent.trim();
            if (!text) return;
            
            // Find matching element in page by tag and position
            const tag = newEl.tagName.toLowerCase();
            const pageElements = document.querySelectorAll(tag);
            const newIndex = Array.from(temp.querySelectorAll(tag)).indexOf(newEl);
            
            if (pageElements[newIndex]) {
                // Only replace text content, keep all attributes and structure
                pageElements[newIndex].textContent = text;
            }
        });
    }
    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();