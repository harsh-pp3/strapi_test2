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
        
        // Update body content
        if (content.bodyContent) {
            console.log('📝 Updating body content');
            console.log('📝 Body content from Strapi:', content.bodyContent);
            updateBodyContentSafe(content.bodyContent);
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
    
    function updateBodyContentSafe(newContent) {
        console.log('🔍 Starting body content update...');
        
        // Create a temporary container to parse the new content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newContent;
        
        // Get ALL elements from new content for debugging
        const allNewElements = tempDiv.querySelectorAll('*');
        console.log(`📋 Found ${allNewElements.length} elements in new content`);
        
        // Get text-containing elements from new content
        const newElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, td, th, a, strong, em, b, i, u, div');
        console.log(`📋 Found ${newElements.length} text elements to process`);
        
        newElements.forEach((newEl, newIndex) => {
            const tagName = newEl.tagName.toLowerCase();
            const newTextContent = newEl.textContent.trim();
            
            console.log(`🔍 Processing ${tagName} with text: "${newTextContent.substring(0, 50)}..."`);
            
            // Skip empty elements
            if (!newTextContent) {
                console.log('⚠️ Skipping empty element');
                return;
            }
            
            // If element has an ID, use ID selector for precise matching
            if (newEl.id) {
                console.log(`🎯 Looking for element with ID: #${newEl.id}`);
                const existingEl = document.querySelector(`#${newEl.id}`);
                if (existingEl) {
                    console.log(`✅ Found existing element with ID: #${newEl.id}`);
                    console.log(`🔄 Current text: "${existingEl.textContent.trim().substring(0, 50)}..."`);
                    console.log(`🆕 New text: "${newTextContent.substring(0, 50)}..."`);
                    
                    if (existingEl.textContent.trim() !== newTextContent) {
                        existingEl.textContent = newTextContent;
                        console.log(`✅ Updated text in element: #${newEl.id}`);
                    } else {
                        console.log(`ℹ️ Text already matches for #${newEl.id}`);
                    }
                } else {
                    console.log(`⚠️ Element not found: #${newEl.id}`);
                }
                return;
            }
            
            // For elements without ID, match by tag type and position
            const existingElements = document.querySelectorAll(tagName);
            console.log(`🔍 Found ${existingElements.length} existing ${tagName} elements`);
            
            if (existingElements.length > 0) {
                // Find elements of same type from the new content
                const newElementsOfSameType = Array.from(tempDiv.querySelectorAll(tagName));
                const positionInType = newElementsOfSameType.indexOf(newEl);
                
                console.log(`📍 Position of this ${tagName} in new content: ${positionInType}`);
                
                // Update the corresponding element by position within that tag type
                if (positionInType < existingElements.length) {
                    const existingEl = existingElements[positionInType];
                    console.log(`🔄 Current text: "${existingEl.textContent.trim().substring(0, 50)}..."`);
                    console.log(`🆕 New text: "${newTextContent.substring(0, 50)}..."`);
                    
                    if (existingEl.textContent.trim() !== newTextContent) {
                        existingEl.textContent = newTextContent;
                        console.log(`✅ Updated text in ${tagName} at position ${positionInType}`);
                    } else {
                        console.log(`ℹ️ Text already matches for ${tagName} at position ${positionInType}`);
                    }
                } else {
                    console.log(`⚠️ Position ${positionInType} exceeds available ${tagName} elements`);
                }
            } else {
                console.log(`⚠️ No existing ${tagName} elements found`);
            }
        });
        
        console.log('✅ Body content update completed');
    }
    
    function updateTextNodesOnly(element, newText) {
        // Find and update only text nodes, preserve all HTML structure
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }
        
        // Update the first significant text node
        if (textNodes.length > 0) {
            textNodes[0].textContent = newText;
        }
    }
    
    function getDirectTextContent(element) {
        // Get only direct text nodes, not text from child elements
        let directText = '';
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                directText += node.textContent;
            }
        }
        return directText;
    }
    
    function updateDirectTextContent(element, newText) {
        // Update only direct text nodes, preserve all child elements
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                node.textContent = newText;
                return; // Update only the first text node
            }
        }
        // If no text node exists, create one at the beginning
        element.insertBefore(document.createTextNode(newText), element.firstChild);
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