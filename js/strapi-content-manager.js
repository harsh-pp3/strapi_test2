// Strapi Content Manager - Updates meta tags and marked content only
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
                console.log('✅ Found published content:', content.attributes);
                applyContent(content.attributes);
            } else if (content) {
                console.log('⚠️ Content found but NOT published');
            } else {
                console.log('⚠️ No content found for:', fileName);
            }
        } catch (error) {
            // Fail silently
        }
    }
    
    function applyContent(content) {
        // Update document title
        if (content.htmlTitle) document.title = content.htmlTitle;
        
        // Update meta tags
        if (content.metaDescription) updateMeta('description', content.metaDescription);
        if (content.metaKeywords) updateMeta('keywords', content.metaKeywords);
        if (content.Meta_Title) updateMeta('title', content.Meta_Title);
        if (content.Meta_Description) updateMeta('description', content.Meta_Description);
        if (content.Keywords) updateMeta('keywords', content.Keywords);
        if (content.Robots_Tag) updateMeta('robots', content.Robots_Tag);
        if (content.Author_Meta_Tag) updateMeta('author', content.Author_Meta_Tag);
        if (content.Publisher_Meta_Tag) updateMeta('publisher', content.Publisher_Meta_Tag);
        if (content.Canonical_URL) updateCanonical(content.Canonical_URL);
        
        // Update body content if provided
        if (content.bodyContent) {
            console.log('📝 Body content from Strapi:', content.bodyContent);
            updateBodyContent(content.bodyContent);
        } else {
            console.log('⚠️ No bodyContent field in Strapi');
        }
    }
    
    function updateMeta(name, content) {
        let meta = document.head.querySelector(`meta[name="${name}"]`);
        if (meta) {
            meta.content = content;
        } else {
            meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
        }
    }
    
    function updateCanonical(url) {
        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = url;
        } else {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = url;
            document.head.appendChild(canonical);
        }
    }
    
    function updateBodyContent(newContent) {
        console.log('🔍 Starting body content update...');
        
        // Parse Strapi content
        const temp = document.createElement('div');
        temp.innerHTML = newContent;
        
        // Get h tags and p tags from Strapi content
        const newElements = temp.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        console.log('🔍 Found', newElements.length, 'elements in Strapi content');
        
        // For each element in Strapi content
        newElements.forEach((newEl, index) => {
            const tag = newEl.tagName.toLowerCase();
            const newText = newEl.textContent.trim();
            if (!newText) return;
            
            console.log(`🔍 Processing ${tag} #${index}: "${newText.substring(0, 50)}..."`);
            
            // Find all elements of same tag in main content area
            const mainContent = document.querySelector('article') || document.querySelector('main') || document.body;
            const pageElements = mainContent.querySelectorAll(tag);
            
            console.log(`🔍 Found ${pageElements.length} ${tag} elements in page`);
            
            // Update element at same position
            if (pageElements[index]) {
                const oldText = pageElements[index].textContent.trim();
                pageElements[index].textContent = newText;
                console.log(`✅ Updated ${tag} #${index}: "${oldText.substring(0, 30)}..." -> "${newText.substring(0, 30)}..."`);
            } else {
                console.log(`⚠️ No ${tag} element at position ${index}`);
            }
        });
        
        console.log('✅ Body content update complete');
    }
    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();