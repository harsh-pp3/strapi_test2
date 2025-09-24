// Dynamic Strapi CMS Integration - No HTML changes required
(function() {
    const STRAPI_URL = 'http://localhost:1337';
    
    // Get current page slug
    function getPageSlug() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'index';
    }
    
    // Load and apply content from Strapi
    async function loadContent() {
        const slug = getPageSlug();
        console.log('🔍 Loading content for:', slug);
        
        try {
            const response = await fetch(`${STRAPI_URL}/api/github-html-files?filters[slug][$eq]=${slug}&populate=*`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const content = data.data[0].attributes;
                
                // Only apply published content
                if (content.publishedAt) {
                    applyContent(content);
                    console.log('✅ Strapi content applied');
                } else {
                    console.log('📝 Content not published');
                }
            } else {
                console.log('ℹ️ No content found for:', slug);
            }
        } catch (error) {
            console.log('❌ Strapi error:', error.message);
        }
    }
    
    // Apply content - ONLY replaces text content, never touches HTML structure
    function applyContent(content) {
        // Update meta tags only
        if (content.metaTitle) document.title = content.metaTitle;
        if (content.metaDescription) updateMeta('description', content.metaDescription);
        if (content.metaKeywords) updateMeta('keywords', content.metaKeywords);
        
        // Replace content ONLY - preserves all existing HTML structure
        if (content.title) replaceTextContent('h1, h2, .title', content.title);
        if (content.content) replaceTextContent('.para1, p', content.content);
        if (content.description) replaceTextContent('.description, .intro', content.description);
    }
    
    // Helper functions
    function updateMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) meta.content = content; // Only update existing meta tags
    }
    
    function replaceTextContent(selectors, newContent) {
        const element = document.querySelector(selectors);
        if (element) {
            // ONLY replace text content, preserve all HTML structure and classes
            element.textContent = newContent;
            console.log(`📝 Replaced text in: ${selectors}`);
        }
    }
    
    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', loadContent);
    
    // Expose refresh function
    window.refreshCMS = loadContent;
    
})();