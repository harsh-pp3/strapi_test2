// Strapi Content Manager - Works with existing GitHub plugin structure
(function() {
    const STRAPI_URL = 'http://localhost:1337';
    
    function getPageFileName() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }
    
    async function loadContent() {
        const fileName = getPageFileName();
        console.log('🔍 Loading content for:', fileName);
        
        try {
            const response = await fetch(`${STRAPI_URL}/api/github-html-files?populate=*`);
            
            if (!response.ok) {
                console.log('❌ Strapi API not available');
                return;
            }
            
            const data = await response.json();
            console.log('📦 API Response:', data);
            
            if (data.data && data.data.length > 0) {
                const content = data.data.find(item => item.attributes.fileName === fileName);
                
                if (content && content.attributes.publishedAt) {
                    applyContent(content.attributes);
                    console.log('✅ Content applied');
                } else {
                    console.log('ℹ️ No published content for:', fileName);
                }
            } else {
                console.log('ℹ️ No entries found');
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }
    
    function applyContent(content) {
        if (content.htmlTitle) document.title = content.htmlTitle;
        if (content.metaDescription) updateMeta('description', content.metaDescription);
        if (content.metaKeywords) updateMeta('keywords', content.metaKeywords);
        
        if (content.title) replaceText('h2', content.title);
        if (content.bodyContent) replaceText('.para1', content.bodyContent);
    }
    
    function updateMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) meta.content = content;
    }
    
    function replaceText(selector, newContent) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = newContent;
            console.log(`📝 Updated: ${selector}`);
        }
    }
    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();