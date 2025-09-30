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
        
        // Only update meta tags - no content replacement
        if (content.htmlTitle) {
            console.log('📝 Updating title from:', document.title, 'to:', content.htmlTitle);
            document.title = content.htmlTitle;
            console.log('✅ Title updated to:', document.title);
        }
        
        if (content.metaDescription) {
            console.log('📝 Updating meta description to:', content.metaDescription);
            updateMeta('description', content.metaDescription);
        }
        
        if (content.metaKeywords) {
            console.log('📝 Updating meta keywords to:', content.metaKeywords);
            updateMeta('keywords', content.metaKeywords);
        }
    }
    
    function updateMeta(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) {
            meta.content = content;
            console.log(`✅ Updated meta ${name}:`, content);
        } else {
            console.log(`⚠️ Meta tag ${name} not found`);
        }
    }
    

    
    document.addEventListener('DOMContentLoaded', loadContent);
    window.refreshCMS = loadContent;
    
})();