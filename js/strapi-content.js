// strapi-content.js - Universal Strapi Content Manager
(function() {
    const STRAPI_URL = 'http://localhost:1337';
    
    // Get page slug from current URL
    function getPageSlug() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'index';
    }
    
    // Load and apply content from Strapi
    async function loadStrapiContent() {
        try {
            const slug = getPageSlug();
            const response = await fetch(`${STRAPI_URL}/api/github-html-files?filters[slug][$eq]=${slug}&populate=*`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const page = data.data[0].attributes;
                
                // Only update if published
                if (page.publishedAt) {
                    updatePageMeta(page);
                    updatePageContent(page);
                    console.log('✅ Strapi content loaded for:', slug);
                } else {
                    console.log('📝 Page exists but not published:', slug);
                }
            } else {
                console.log('❌ No Strapi content found for:', slug);
            }
        } catch (error) {
            console.error('🚫 Strapi content load failed:', error);
        }
    }
    
    // Update meta tags
    function updatePageMeta(page) {
        // Update title
        if (page.metaTitle) {
            document.title = page.metaTitle;
        } else if (page.title) {
            document.title = page.title;
        }
        
        // Update meta tags
        updateMeta('description', page.metaDescription);
        updateMeta('keywords', page.metaKeywords);
        updateMeta('robots', page.robots || 'index,follow');
        
        // Open Graph tags
        updateMetaProperty('og:title', page.ogTitle || page.title);
        updateMetaProperty('og:description', page.ogDescription || page.metaDescription);
        updateMetaProperty('og:type', 'website');
        
        if (page.ogImage?.data) {
            updateMetaProperty('og:image', `${STRAPI_URL}${page.ogImage.data.attributes.url}`);
        }
        
        // Canonical URL
        if (page.canonicalUrl) {
            updateCanonical(page.canonicalUrl);
        }
        
        console.log('🏷️ Meta tags updated');
    }
    
    // Update page content areas
    function updatePageContent(page) {
        let updatedElements = 0;
        
        // Method 1: Update elements with data-strapi attributes
        document.querySelectorAll('[data-strapi]').forEach(el => {
            const field = el.getAttribute('data-strapi');
            if (page[field]) {
                el.innerHTML = page[field];
                updatedElements++;
            }
        });
        
        // Method 2: Update elements by ID matching Strapi field names
        Object.keys(page).forEach(key => {
            const element = document.getElementById(key);
            if (element && page[key] && typeof page[key] === 'string') {
                element.innerHTML = page[key];
                updatedElements++;
            }
        });
        
        // Method 3: Update elements by class matching Strapi field names
        Object.keys(page).forEach(key => {
            const elements = document.getElementsByClassName(key);
            if (elements.length > 0 && page[key] && typeof page[key] === 'string') {
                Array.from(elements).forEach(el => {
                    el.innerHTML = page[key];
                    updatedElements++;
                });
            }
        });
        
        // Method 4: Special handling for common content areas
        const contentMappings = {
            'main-content': page.content,
            'page-title': page.title,
            'page-description': page.metaDescription,
            'hero-title': page.title,
            'hero-content': page.content
        };
        
        Object.keys(contentMappings).forEach(selector => {
            const elements = document.querySelectorAll(`#${selector}, .${selector}, [data-content="${selector}"]`);
            if (elements.length > 0 && contentMappings[selector]) {
                elements.forEach(el => {
                    el.innerHTML = contentMappings[selector];
                    updatedElements++;
                });
            }
        });
        
        if (updatedElements > 0) {
            console.log(`📝 Updated ${updatedElements} content elements`);
        }
    }
    
    // Helper functions
    function updateMeta(name, content) {
        if (!content) return;
        
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }
    
    function updateMetaProperty(property, content) {
        if (!content) return;
        
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }
    
    function updateCanonical(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
    }
    
    // Add Strapi admin indicator (only visible when content is managed by Strapi)
    function addStrapiIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'strapi-indicator';
        indicator.innerHTML = '🚀 Powered by Strapi CMS';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #4945ff;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 9999;
            opacity: 0.7;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(indicator);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 500);
        }, 3000);
    }
    
    // Initialize when DOM is ready
    function init() {
        loadStrapiContent();
        
        // Auto-refresh every 30 seconds to check for updates
        setInterval(loadStrapiContent, 30000);
        
        console.log('🎯 Strapi Content Manager initialized for:', getPageSlug());
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose global function for manual refresh
    window.refreshStrapiContent = loadStrapiContent;
    
})();