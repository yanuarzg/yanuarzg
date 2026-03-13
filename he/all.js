/**
 * CENTRALIZED BANNER WIDGET
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const CONFIG_URL = 'https://yanuarzg.github.io/cc/he/banner-config.json';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 menit cache

  // ============================================================
  // CACHE HELPER
  // ============================================================
  function getCachedConfig() {
    try {
      const cached = localStorage.getItem('banner_config');
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem('banner_config');
        return null;
      }
      return data.config;
    } catch {
      return null;
    }
  }

  function setCachedConfig(config) {
    try {
      localStorage.setItem('banner_config', JSON.stringify({
        config: config,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Storage full or disabled
    }
  }

  // ============================================================
  // LOAD CONFIG
  // ============================================================
  async function loadBannerConfig() {
    const container = document.getElementById('banner-event');
    if (!container) {
      console.warn('Banner container #banner-event not found');
      return;
    }

    // Try cache first
    let config = getCachedConfig();
    
    if (!config) {
      try {
        const response = await fetch(CONFIG_URL + '?v=' + Date.now(), {
          cache: 'no-cache'
        });
        config = await response.json();
        setCachedConfig(config);
      } catch (err) {
        console.error('Failed to load banner config:', err);
        return;
      }
    }

    renderBanner(container, config);
  }

  // ============================================================
  // RENDER BANNER
  // ============================================================
  function renderBanner(container, config) {
    // Check if should display on this site
    const currentHost = window.location.hostname;
    if (config.display.showOnSites && config.display.showOnSites.length > 0) {
      const shouldShow = config.display.showOnSites.some(site => 
        currentHost.includes(site.trim())
      );
      if (!shouldShow) {
        container.style.display = 'none';
        return;
      }
    }

    // Responsive height
    const isMobile = window.innerWidth < 768;
    const height = isMobile ? config.display.heightMobile : config.display.heightDesktop;

    // Build banner HTML
    let html = `
      <div class="centralized-banner" style="
        position: relative;
        width: 100%;
        height: ${height};
        border-radius: ${config.display.borderRadius};
        overflow: hidden;
        background-image: url('${config.background.image}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      ">
    `;

    // Event banner overlay
    if (config.event.image) {
      const position = getPositionStyles(config.event.position);
      html += `
        <img 
          src="${config.event.image}" 
          alt="Event Banner"
          style="
            position: absolute;
            ${position}
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            pointer-events: none;
          "
        >
      `;
    }

    // Article slider container
    if (config.slider && config.slider.enabled && config.slider.subdomain) {
      html += `
        <div id="banner-slider" style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          overflow: hidden;
        ">
          <div style="flex-shrink: 0; font-size: 12px; opacity: 0.7;">BERITA</div>
          <div id="slider-content" style="flex: 1; overflow: hidden;">
            <div style="font-size: 14px; font-weight: 600;">Memuat artikel...</div>
          </div>
          <div id="slider-nav" style="display: flex; gap: 8px; flex-shrink: 0;">
            <button onclick="window.bannerSlider.prev()" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 16px;
            ">‹</button>
            <button onclick="window.bannerSlider.next()" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 16px;
            ">›</button>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Initialize slider if enabled
    if (config.slider && config.slider.enabled && config.slider.subdomain) {
      initSlider(config.slider);
    }
  }

  // ============================================================
  // POSITION HELPER
  // ============================================================
  function getPositionStyles(position) {
    let horizontal = '';
    let vertical = '';

    switch (position.horizontal) {
      case 'left':
        horizontal = 'left: 20px;';
        break;
      case 'right':
        horizontal = 'right: 20px;';
        break;
      case 'center':
        horizontal = 'left: 50%; transform: translateX(-50%);';
        break;
    }

    switch (position.vertical) {
      case 'top':
        vertical = 'top: 20px;';
        break;
      case 'bottom':
        vertical = 'bottom: 20px;';
        break;
      case 'center':
        vertical = 'top: 50%; transform: translateY(-50%);';
        if (position.horizontal === 'center') {
          vertical = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
        }
        break;
    }

    return horizontal + vertical;
  }

  // ============================================================
  // SLIDER LOGIC
  // ============================================================
  function initSlider(sliderConfig) {
    // Validation
    if (!sliderConfig.subdomain || !sliderConfig.filterType || !sliderConfig.filterValue) {
      console.warn('Slider config incomplete - subdomain, filterType, and filterValue required');
      return;
    }

    const articles = [];
    let currentIndex = 0;
    let autoplayTimer = null;

    window.bannerSlider = {
      next: () => {
        if (articles.length === 0) return;
        currentIndex = (currentIndex + 1) % articles.length;
        renderSlide();
        resetAutoplay();
      },
      prev: () => {
        if (articles.length === 0) return;
        currentIndex = (currentIndex - 1 + articles.length) % articles.length;
        renderSlide();
        resetAutoplay();
      }
    };

    function renderSlide() {
      const content = document.getElementById('slider-content');
      if (!content || articles.length === 0) return;

      const article = articles[currentIndex];
      content.innerHTML = `
        <a href="${article.link}" target="_blank" style="
          color: white;
          text-decoration: none;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">
            ${article.title}
          </div>
          <div style="font-size: 11px; opacity: 0.7;">
            ${article.source} • ${article.date}
          </div>
        </a>
      `;
    }

    function startAutoplay() {
      if (sliderConfig.autoplaySpeed && sliderConfig.autoplaySpeed > 0) {
        autoplayTimer = setInterval(() => {
          window.bannerSlider.next();
        }, sliderConfig.autoplaySpeed);
      }
    }

    function resetAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        startAutoplay();
      }
    }

    // Load articles based on type
    if (sliderConfig.type === 'wordpress') {
      loadWordPressArticles(sliderConfig).then(data => {
        articles.push(...data);
        if (articles.length > 0) {
          renderSlide();
          startAutoplay();
        } else {
          document.getElementById('slider-content').innerHTML = 
            '<div style="font-size:12px; opacity:0.7;">Tidak ada artikel</div>';
        }
      });
    } else if (sliderConfig.type === 'blogger') {
      loadBloggerArticles(sliderConfig).then(data => {
        articles.push(...data);
        if (articles.length > 0) {
          renderSlide();
          startAutoplay();
        } else {
          document.getElementById('slider-content').innerHTML = 
            '<div style="font-size:12px; opacity:0.7;">Tidak ada artikel</div>';
        }
      });
    }
  }

  // ============================================================
  // WORDPRESS LOADER
  // ============================================================
  async function loadWordPressArticles(config) {
    try {
      let url = `https://${config.subdomain}/wp-json/wp/v2/posts?per_page=${config.count}&_fields=id,title,link,date`;
      
      // Get filter ID based on filterType
      if (config.filterType === 'category') {
        const catRes = await fetch(
          `https://${config.subdomain}/wp-json/wp/v2/categories?search=${encodeURIComponent(config.filterValue)}&per_page=1&_fields=id`
        );
        const cats = await catRes.json();
        if (cats.length > 0) {
          url += `&categories=${cats[0].id}`;
        }
      } else if (config.filterType === 'tags') {
        const tagRes = await fetch(
          `https://${config.subdomain}/wp-json/wp/v2/tags?search=${encodeURIComponent(config.filterValue)}&per_page=1&_fields=id`
        );
        const tags = await tagRes.json();
        if (tags.length > 0) {
          url += `&tags=${tags[0].id}`;
        }
      }

      const res = await fetch(url);
      const posts = await res.json();

      return posts.map(post => ({
        title: post.title.rendered,
        link: post.link,
        date: new Date(post.date).toLocaleDateString('id-ID'),
        source: config.subdomain
      }));
    } catch (err) {
      console.warn(`Failed to load from ${config.subdomain}:`, err);
      return [];
    }
  }

  // ============================================================
  // BLOGGER LOADER
  // ============================================================
  function loadBloggerArticles(config) {
    return new Promise((resolve) => {
      const cbName = 'blgSlider_' + Math.random().toString(36).slice(2);

      window[cbName] = function(data) {
        document.getElementById(cbName)?.remove();
        delete window[cbName];

        const entries = data.feed.entry || [];
        resolve(entries.map(entry => ({
          title: entry.title.$t,
          link: entry.link.find(l => l.rel === 'alternate').href,
          date: new Date(entry.published.$t).toLocaleDateString('id-ID'),
          source: config.subdomain
        })));
      };

      // Blogger uses labels (same as category)
      const labelPath = config.filterValue ? `/-/${encodeURIComponent(config.filterValue)}/` : '/';
      const script = document.createElement('script');
      script.id = cbName;
      script.src = `https://${config.subdomain}/feeds/posts/default${labelPath}?alt=json&max-results=${config.count}&callback=${cbName}`;
      script.onerror = () => {
        document.getElementById(cbName)?.remove();
        delete window[cbName];
        resolve([]);
      };
      document.body.appendChild(script);
    });
  }

  // ============================================================
  // INITIALIZE ON PAGE LOAD
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBannerConfig);
  } else {
    loadBannerConfig();
  }

})();
