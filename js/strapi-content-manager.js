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
            
            // Find matching file (case-insensitive)
            let content = data.data.find(item => 
                item.attributes.fileName.toLowerCase() === fileName.toLowerCase()
            );
            if (!content) {
                const baseFileName = fileName.replace('.html', '');
                content = data.data.find(item => 
                    item.attributes.fileName.toLowerCase() === baseFileName.toLowerCase()
                );
            }
            if (!content) {
                const fullFileName = fileName.includes('.html') ? fileName : fileName + '.html';
                content = data.data.find(item => 
                    item.attributes.fileName.toLowerCase() === fullFileName.toLowerCase()
                );
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
        console.log('🔍 Starting smart diff-based update...');
        
        // Parse Strapi content
        const strapiDoc = document.createElement('div');
        strapiDoc.innerHTML = newContent;
        
        // Get h and p tags from Strapi
        const strapiElements = strapiDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        
        // Get h and p tags from current page
        const mainContent = document.querySelector('article') || document.querySelector('main') || document.body;
        const pageElements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        
        console.log(`🔍 Strapi has ${strapiElements.length} elements, Page has ${pageElements.length} elements`);
        
        let updated = 0;
        
        // Compare each Strapi element with page elements
        strapiElements.forEach((strapiEl) => {
            const strapiTag = strapiEl.tagName.toLowerCase();
            const strapiText = strapiEl.textContent.trim();
            if (!strapiText) return;
            
            // Find matching element in page by comparing text similarity
            for (let pageEl of pageElements) {
                if (pageEl.tagName.toLowerCase() !== strapiTag) continue;
                
                const pageText = pageEl.textContent.trim();
                
                // Check if texts are similar (first 20 chars match) but not identical
                const minLength = Math.min(20, strapiText.length, pageText.length);
                const strapiStart = strapiText.substring(0, minLength).toLowerCase();
                const pageStart = pageText.substring(0, minLength).toLowerCase();
                
                // Only update if: same start AND different full text
                if (strapiStart === pageStart && strapiText !== pageText) {
                    // Found a match - text starts the same but has been edited
                    pageEl.textContent = strapiText;
                    updated++;
                    console.log(`✅ Updated ${strapiTag}: "${pageText.substring(0, 40)}..." -> "${strapiText.substring(0, 40)}..."`);
                    break;
                }
            }
        });
        
        console.log(`✅ Updated ${updated} elements based on changes`);
    }
    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();