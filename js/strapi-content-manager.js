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
            console.log('🔍 Available files:', data.data?.map(item => item.attributes.fileName));
            console.log('📋 All entries with details:');
            data.data?.forEach((item, index) => {
                console.log(`  ${index + 1}. fileName: "${item.attributes.fileName}" | Published: ${!!item.attributes.publishedAt}`);
            });
            
            if (data.data && data.data.length > 0) {
                // Try exact match first, then try with/without .html
                let content = data.data.find(item => item.attributes.fileName === fileName);
                
                if (!content) {
                    // Try without .html extension
                    const baseFileName = fileName.replace('.html', '');
                    content = data.data.find(item => item.attributes.fileName === baseFileName);
                }
                
                if (!content) {
                    // Try with .html extension
                    const fullFileName = fileName.includes('.html') ? fileName : fileName + '.html';
                    content = data.data.find(item => item.attributes.fileName === fullFileName);
                }
                
                console.log('🔎 Found matching content:', !!content);
                if (content) {
                    console.log('📄 Matched entry:', content.attributes.fileName, 'Published:', !!content.attributes.publishedAt);
                }
                
                if (content && content.attributes.publishedAt) {
                    console.log('📝 Content to apply:', content.attributes);
                    applyContent(content.attributes);
                    console.log('✅ Content applied');
                } else if (content) {
                    console.log('ℹ️ Content found but NOT PUBLISHED for:', content.attributes.fileName);
                    console.log('🔒 To fix: Go to Strapi admin and click PUBLISH button');
                } else {
                    console.log('ℹ️ No content found for:', fileName);
                    console.log('💡 Create Strapi entry with fileName: "' + fileName + '" and publish it');
                }
            } else {
                console.log('ℹ️ No entries found');
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }
    
    function applyContent(content) {
        console.log('🔍 Applying content:', content);
        
        // Update HTML title (keep htmlTitle separate)
        if (content.htmlTitle) {
            console.log('📝 Updating HTML title from:', document.title, 'to:', content.htmlTitle);
            document.title = content.htmlTitle;
            console.log('✅ HTML title updated to:', document.title);
        }
        
        // Update meta title (separate from HTML title)
        if (content.Meta_Title) {
            console.log('📝 Updating meta title to:', content.Meta_Title);
            updateMeta('title', content.Meta_Title);
        }
        
        // Update meta description (use only new field)
        if (content.Meta_Description) {
            console.log('📝 Updating meta description to:', content.Meta_Description);
            updateMeta('description', content.Meta_Description);
        }
        
        // Update meta keywords (use only new field)
        if (content.Keywords) {
            console.log('📝 Updating meta keywords to:', content.Keywords);
            updateMeta('keywords', content.Keywords);
        }
        
        // Update canonical URL
        if (content.Canonical_URL) {
            console.log('📝 Updating canonical URL to:', content.Canonical_URL);
            updateCanonical(content.Canonical_URL);
        }
        
        // Update robots tag
        if (content.Robots_Tag) {
            console.log('📝 Updating robots tag to:', content.Robots_Tag);
            updateMeta('robots', content.Robots_Tag);
        }
        
        // Update author tag
        if (content.Author_Meta_Tag) {
            console.log('📝 Updating author tag to:', content.Author_Meta_Tag);
            updateMeta('author', content.Author_Meta_Tag);
        }
        
        // Update publisher tag
        if (content.Publisher_Meta_Tag) {
            console.log('📝 Updating publisher tag to:', content.Publisher_Meta_Tag);
            updateMeta('publisher', content.Publisher_Meta_Tag);
        }
        
        // Update body content selectively
        if (content.bodyContent) {
            console.log('📝 Updating body content selectively');
            updateBodyContent(content.bodyContent);
        }
    }
    
    function updateMeta(name, content) {
        // Remove all existing meta tags with this name to avoid duplicates
        const existingMetas = document.querySelectorAll(`meta[name="${name}"]`);
        existingMetas.forEach(meta => meta.remove());
        
        // Create new meta tag
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
        console.log(`✅ Updated meta ${name}:`, content);
    }
    
    function updateCanonical(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.href = url;
            console.log('✅ Updated canonical URL:', url);
        } else {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = url;
            document.head.appendChild(canonical);
            console.log('✅ Created canonical URL:', url);
        }
    }
    
    function updateBodyContent(newContent) {
        // Create a temporary container to parse the new content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newContent;
        
        // Get all elements with IDs or specific selectors from new content
        const newElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div[id], section[id], article[id]');
        
        newElements.forEach(newEl => {
            let selector;
            
            // If element has an ID, use ID selector
            if (newEl.id) {
                selector = `#${newEl.id}`;
            } else {
                // For headings and paragraphs, try to match by content or position
                const tagName = newEl.tagName.toLowerCase();
                const textContent = newEl.textContent.trim().substring(0, 50);
                
                // Try to find existing element with same tag and similar content
                const existingElements = document.querySelectorAll(tagName);
                let matchFound = false;
                
                existingElements.forEach((existingEl, index) => {
                    const existingText = existingEl.textContent.trim().substring(0, 50);
                    if (existingText === textContent) {
                        existingEl.innerHTML = newEl.innerHTML;
                        console.log(`✅ Updated ${tagName} with matching content`);
                        matchFound = true;
                    }
                });
                
                if (!matchFound) {
                    console.log(`ℹ️ No matching ${tagName} found for selective update`);
                }
                return;
            }
            
            // Update element if it exists
            const existingEl = document.querySelector(selector);
            if (existingEl) {
                existingEl.innerHTML = newEl.innerHTML;
                console.log(`✅ Updated element: ${selector}`);
            } else {
                console.log(`ℹ️ Element not found: ${selector}`);
            }
        });
    }
    
    function getCurrentMetaTags() {
        const metaTags = {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            canonical: document.querySelector('link[rel="canonical"]')?.href || '',
            robots: document.querySelector('meta[name="robots"]')?.content || '',
            author: document.querySelector('meta[name="author"]')?.content || '',
            publisher: document.querySelector('meta[name="publisher"]')?.content || ''
        };
        console.log('📋 Current meta tags:', metaTags);
        return metaTags;
    }
    

    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    window.getCurrentMetaTags = getCurrentMetaTags;
    
})();