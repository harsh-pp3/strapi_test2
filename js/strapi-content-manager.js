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
        
        // Update title
        if (content.Meta_Title || content.htmlTitle) {
            const newTitle = content.Meta_Title || content.htmlTitle;
            console.log('📝 Updating title from:', document.title, 'to:', newTitle);
            document.title = newTitle;
            console.log('✅ Title updated to:', document.title);
        }
        
        // Update meta description
        if (content.Meta_Description || content.metaDescription) {
            const desc = content.Meta_Description || content.metaDescription;
            console.log('📝 Updating meta description to:', desc);
            updateMeta('description', desc);
        }
        
        // Update meta keywords
        if (content.Keywords || content.metaKeywords) {
            const keywords = content.Keywords || content.metaKeywords;
            console.log('📝 Updating meta keywords to:', keywords);
            updateMeta('keywords', keywords);
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
    }
    
    function updateMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) {
            meta.content = content;
            console.log(`✅ Updated meta ${name}:`, content);
        } else {
            // Create meta tag if it doesn't exist
            meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
            console.log(`✅ Created meta ${name}:`, content);
        }
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