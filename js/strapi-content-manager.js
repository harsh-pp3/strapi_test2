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
        console.log('📝 Applying Strapi content:', content);
        
        // Update document title
        if (content.htmlTitle) {
            console.log('✅ Updating title to:', content.htmlTitle);
            document.title = content.htmlTitle;
        }
        
        // Update meta description
        if (content.metaDescription) {
            console.log('✅ Updating meta description to:', content.metaDescription);
            updateMeta('description', content.metaDescription);
        }
        
        // Update meta keywords
        if (content.metaKeywords) {
            console.log('✅ Updating meta keywords to:', content.metaKeywords);
            updateMeta('keywords', content.metaKeywords);
        }
        
        // Update Meta_Title
        if (content.Meta_Title) {
            console.log('✅ Updating meta title to:', content.Meta_Title);
            updateMeta('title', content.Meta_Title);
        }
        
        // Update Meta_Description
        if (content.Meta_Description) {
            console.log('✅ Updating meta description to:', content.Meta_Description);
            updateMeta('description', content.Meta_Description);
        }
        
        // Update Keywords
        if (content.Keywords) {
            console.log('✅ Updating keywords to:', content.Keywords);
            updateMeta('keywords', content.Keywords);
        }
        
        // Update Robots_Tag
        if (content.Robots_Tag) {
            console.log('✅ Updating robots tag to:', content.Robots_Tag);
            updateMeta('robots', content.Robots_Tag);
        }
        
        // Update Author_Meta_Tag
        if (content.Author_Meta_Tag) {
            console.log('✅ Updating author tag to:', content.Author_Meta_Tag);
            updateMeta('author', content.Author_Meta_Tag);
        }
        
        // Update Publisher_Meta_Tag
        if (content.Publisher_Meta_Tag) {
            console.log('✅ Updating publisher tag to:', content.Publisher_Meta_Tag);
            updateMeta('publisher', content.Publisher_Meta_Tag);
        }
        
        // Update Canonical_URL
        if (content.Canonical_URL) {
            console.log('✅ Updating canonical URL to:', content.Canonical_URL);
            updateCanonical(content.Canonical_URL);
        }
        
        // Update body content
        if (content.bodyContent) {
            console.log('✅ Updating body content');
            updateBodyContent(content.bodyContent);
        }
    }
    
    function updateMeta(name, content) {
        // Only look for meta tags in head
        let meta = document.head.querySelector(`meta[name="${name}"]`);
        
        if (meta) {
            // Update existing meta tag
            meta.content = content;
            console.log(`✅ Updated existing meta ${name}`);
        } else {
            // Create new meta tag only in head
            meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
            console.log(`✅ Created new meta ${name}`);
        }
    }
    
    function updateCanonical(url) {
        let canonical = document.head.querySelector('link[rel="canonical"]');
        
        if (canonical) {
            canonical.href = url;
            console.log('✅ Updated canonical URL');
        } else {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = url;
            document.head.appendChild(canonical);
            console.log('✅ Created canonical URL');
        }
    }
    
    function updateBodyContent(newContent) {
        console.log('📝 Body content from Strapi:', newContent);
        
        // Parse new content
        const temp = document.createElement('div');
        temp.innerHTML = newContent;
        
        // Get all text nodes from new content
        const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT);
        const newTexts = [];
        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            if (text) newTexts.push(text);
        }
        
        console.log('🔍 Found', newTexts.length, 'text nodes in new content');
        
        // Get all text nodes from body
        const bodyWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const bodyTexts = [];
        while (node = bodyWalker.nextNode()) {
            const text = node.textContent.trim();
            if (text && !node.parentElement.closest('script, style, noscript')) {
                bodyTexts.push(node);
            }
        }
        
        console.log('🔍 Found', bodyTexts.length, 'text nodes in body');
        
        // Replace only changed text nodes
        let updated = 0;
        newTexts.forEach((newText, index) => {
            if (bodyTexts[index]) {
                const oldText = bodyTexts[index].textContent.trim();
                if (oldText !== newText) {
                    bodyTexts[index].textContent = newText;
                    updated++;
                    console.log(`✅ Updated text ${index + 1}: "${oldText}" -> "${newText}"`);
                }
            }
        });
        
        console.log(`✅ Updated ${updated} text nodes`);
    }
    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();