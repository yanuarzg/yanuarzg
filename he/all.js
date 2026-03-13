/**
 * OPTIMIZED FEEDS LOADER WITH SKELETON
 * Fitur optimasi:
 * - localStorage cache (5 menit)
 * - Lazy loading (IntersectionObserver)
 * - Parallel fetch dengan AbortController
 * - Fetch hanya field penting (tanpa _embed)
 * - Preconnect DNS
 * - Skeleton loader responsif (4 desktop, 2 mobile)
 */

(() => {
  'use strict';
  const TARGET_URL = 'https://harianexpress.com';
  const links = document.querySelectorAll('.logo_link');
  Array.from(links).forEach(link => {
    if (link.getAttribute('href') !== TARGET_URL) {
      link.href = TARGET_URL;
    }
  });
})();

document.addEventListener("DOMContentLoaded", function () {

  // ============================================================
  // CONFIG
  // ============================================================
  const config = {
    CACHE_DURATION: 5 * 60 * 1000, // 5 menit
    LAZY_LOAD_THRESHOLD: '200px',  // mulai load saat 200px dari viewport
    ERROR_MESSAGE: '<p>Gagal memuat konten. Silakan coba lagi nanti.</p>'
  };

  // ============================================================
  // HELPER: Escape HTML
  // ============================================================
  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ============================================================
  // SKELETON LOADER HTML
  // ============================================================
  function renderSkeleton() {
    const skeletonHTML = `
      <li style="display:flex;gap:12px;margin-bottom:15px;align-items:center;">
        <div class="skeleton-img" style="aspect-ratio:16/9;width:-moz-available;width:-webkit-fill-available;height:auto;max-height:124px!important;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:skeleton-loading 1.5s infinite;border-radius:4px;"></div>
        <div class='dn' style="flex:1;">
          <div class="skeleton-title" style="height:14px;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:skeleton-loading 1.5s infinite;border-radius:3px;width:80%;margin-bottom:8px;"></div>
          <div class="skeleton-date" style="height:10px;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:skeleton-loading 1.5s infinite;border-radius:3px;width:40%;"></div>
        </div>
      </li>
    `;

    // Desktop: 4, Mobile: 2 (bisa diadjust dengan media query jika perlu)
    const count = window.innerWidth >= 768 ? 4 : 2;
    const items = Array(count).fill(skeletonHTML).join('');

    return `
      <style>
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>
      <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
    `;
  }

  // ============================================================
  // HELPER: Render List
  // ============================================================  
  function renderList(items) {
    if (!items.length) return '<p>Tidak ada konten.</p>';
    return '<ul style="list-style:none;padding:0;margin:0;">' +
      items.map(item => `
        <li style="display:flex;gap:12px;margin-bottom:15px;align-items:center;">
          <a href="${escapeHTML(item.link)}" aria-label="${escapeHTML(item.title)}" class="post-img">
            <img src="${item.img}"
               alt="${escapeHTML(item.title)}"
               style="width:70px;height:50px;object-fit:cover;border-radius:4px;"
               onerror="this.src='https://placehold.co/70x50'"/>
          </a>
          <div style="flex:1;">
            <h3 class="jl_fe_title jl_txt_2row" style="text-decoration:none;font-size:18px;display:block;line-height:1.5;">
              <a href="${escapeHTML(item.link)}" target="_blank">
                ${escapeHTML(item.title)}
              </a>
            </h3>
            <small style="font-size:11px;">
              <time datetime="${item.rawDate}">${item.date}</time>
            </small>
          </div>
        </li>`).join('') +
      '</ul>';
  }

  // ============================================================
  // CACHE HELPER
  // ============================================================
  function getCached(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const data = JSON.parse(item);
      if (Date.now() - data.timestamp > config.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      return data.value;
    } catch {
      return null;
    }
  }

  function setCache(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify({
        value: value,
        timestamp: Date.now()
      }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        localStorage.clear(); // atau hapus selective jika perlu
      }
    }
  }

  // ============================================================
  // DNS PRECONNECT (jalankan sekali saat load)
  // ============================================================
  function addPreconnect(domains) {
    const head = document.head;
    domains.forEach(domain => {
      if (!document.querySelector(`link[href*="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = `https://${domain}`;
        link.crossOrigin = 'anonymous';
        head.appendChild(link);

        // Fallback dns-prefetch
        const dnsLink = document.createElement('link');
        dnsLink.rel = 'dns-prefetch';
        dnsLink.href = `https://${domain}`;
        head.appendChild(dnsLink);
      }
    });
  }

  // ============================================================
  // LAZY LOAD OBSERVER
  // ============================================================
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const loader = container.dataset.loader;

        // Tampilkan skeleton dan set aria-busy
        container.innerHTML = renderSkeleton();
        container.setAttribute('aria-busy', 'true');

        if (loader && window[loader]) {
          window[loader](container);
          delete container.dataset.loader; // jangan load ulang
        }

        lazyLoadObserver.unobserve(container);
      }
    });
  }, { rootMargin: config.LAZY_LOAD_THRESHOLD });

  // ============================================================
  // WORDPRESS OPTIMIZED FETCH
  // ============================================================
  async function fetchWPOptimized(source, catId, count, container) {
    const cacheKey = `wp_${source}_${catId || 'all'}_${count}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let url = `https://${source}/wp-json/wp/v2/posts?per_page=${count}&_fields=id,title,link,date,featured_media&orderby=date&order=desc`;
    if (catId) url += `&categories=${catId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const res = await fetch(url, { 
        signal: controller.signal,
        mode: 'cors',
        cache: 'force-cache'
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error('HTTP error');
      const posts = await res.json();

      // Ambil thumbnail hanya untuk post yang punya featured_media
      const mediaIds = [...new Set(posts.filter(p => p.featured_media).map(p => p.featured_media))];
      let mediaMap = {};

      if (mediaIds.length > 0) {
        try {
          const mediaUrl = `https://${source}/wp-json/wp/v2/media?include=${mediaIds.join(',')}&_fields=id,source_url`;
          const mediaRes = await fetch(mediaUrl, { cache: 'force-cache' });
          const mediaData = await mediaRes.json();
          mediaData.forEach(m => {
            mediaMap[m.id] = m.source_url;
          });
        } catch {
          // jika gagal ambil media, lanjut tanpa thumbnail
        }
      }

      const mapped = posts.map(post => ({
        title   : post.title.rendered || post.title,
        link    : post.link,
        rawDate : post.date,
        date    : new Date(post.date).toLocaleDateString('id-ID'),
        source  : source,
        img     : mediaMap[post.featured_media] || 'https://placehold.co/70x50'
      }));

      setCache(cacheKey, mapped);
      return mapped;

    } catch (err) {
      clearTimeout(timeout);
      console.error(`WP fetch failed for ${source}:`, err.message);
      if (container) container.innerHTML = config.ERROR_MESSAGE;
      return [];
    }
  }

  async function fetchWPCategory(source, categoryName) {
    const cacheKey = `wp_cat_${source}_${categoryName}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(
        `https://${source}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}&per_page=5&_fields=id,slug,name`,
        { cache: 'force-cache' }
      );
      const cats = await res.json();
      if (!cats.length) return null;

      const bySlug = cats.find(c => c.slug === categoryName.toLowerCase());
      const byName = cats.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      const catId = (bySlug || byName || cats[0]).id;

      setCache(cacheKey, catId);
      return catId;
    } catch {
      return null;
    }
  }

  // ============================================================
  // BLOGGER OPTIMIZED (sudah cepat, tambah cache)
  // ============================================================
  function loadBloggerOptimized(source, category, count, callback, container) {
    const cacheKey = `blg_${source}_${category || 'all'}_${count}`;
    const cached = getCached(cacheKey);

    if (cached) {
      callback(cached);
      return;
    }

    const cbName = 'blgCb_' + Math.random().toString(36).slice(2);

    window[cbName] = function (data) {
      const scriptEl = document.getElementById(cbName);
      if (scriptEl) scriptEl.remove();
      delete window[cbName];

      const entries = data.feed.entry || [];
      const mapped = entries.map(entry => ({
        title   : entry.title.$t,
        link    : entry.link.find(l => l.rel === 'alternate').href,
        rawDate : entry.published.$t,
        date    : new Date(entry.published.$t).toLocaleDateString('id-ID'),
        source  : source,
        img     : entry.media$thumbnail
                    ? entry.media$thumbnail.url.replace(/\/s\d+-c\//, '/s320-c/')
                    : 'https://placehold.co/70x50'
      }));

      setCache(cacheKey, mapped);
      callback(mapped);
    };

    const labelPath = category ? `/-/${encodeURIComponent(category)}/` : '/';
    const script = document.createElement('script');
    script.id = cbName;
    script.src = `https://${source}/feeds/posts/default${labelPath}?alt=json&max-results=${count}&callback=${cbName}`;
    script.onerror = () => {
      const scriptEl = document.getElementById(cbName);
      if (scriptEl) scriptEl.remove();
      delete window[cbName];
      if (container) container.innerHTML = config.ERROR_MESSAGE;
      callback([]);
    };
    document.body.appendChild(script);
  }

  // ============================================================
  // SINGLE WP (lazy load)
  // ============================================================
  window.loadSingleWP = async function(container) {
    const source = container.getAttribute('data-source');
    const count = parseInt(container.getAttribute('data-items')) || 5;

    const posts = await fetchWPOptimized(source, null, count, container);
    container.innerHTML = renderList(posts);
    container.removeAttribute('aria-busy');
  };

  document.querySelectorAll('.recent-wp').forEach(container => {
    container.dataset.loader = 'loadSingleWP';
    lazyLoadObserver.observe(container);
  });

  // ============================================================
  // SINGLE BLOGGER (lazy load)
  // ============================================================
  window.loadSingleBlogger = function(container) {
    const source = container.getAttribute('data-source');
    const count = parseInt(container.getAttribute('data-items')) || 5;

    loadBloggerOptimized(source, null, count, posts => {
      container.innerHTML = renderList(posts);
      container.removeAttribute('aria-busy');
    }, container);
  };

  document.querySelectorAll('.recent-blg').forEach(container => {
    container.dataset.loader = 'loadSingleBlogger';
    lazyLoadObserver.observe(container);
  });

  // ============================================================
  // MULTI-SOURCE WP (lazy load)
  // ============================================================
  window.loadMultiWP = async function(container) {
    const sourceAttr = container.getAttribute('data-sources');
    if (!sourceAttr) return;
    const sources = sourceAttr.split(',').map(s => s.trim()).filter(Boolean);
    const category = container.getAttribute('data-category') || '';
    const total = parseInt(container.getAttribute('data-items')) || 10;
    const sort = container.getAttribute('data-sort') || 'date';

    if (!sources.length) return;

    addPreconnect(sources);

    let allPosts = [];

    const promises = sources.map(async (source) => {
      let catId = null;
      if (category) {
        catId = await fetchWPCategory(source, category);
        if (!catId) return [];
      }
      return fetchWPOptimized(source, catId, total, container);
    });

    const results = await Promise.allSettled(promises);
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allPosts = allPosts.concat(result.value);
      }
    });

    if (sort === 'date') {
      allPosts.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    }

    const slicedPosts = allPosts.slice(0, total);
    container.innerHTML = slicedPosts.length ? renderList(slicedPosts) : config.ERROR_MESSAGE;
    container.removeAttribute('aria-busy');
  };

  document.querySelectorAll('.recent-wp-multi').forEach(container => {
    container.dataset.loader = 'loadMultiWP';
    lazyLoadObserver.observe(container);
  });

  // ============================================================
  // MULTI-SOURCE BLOGGER (lazy load)
  // ============================================================
  window.loadMultiBlogger = function(container) {
    const sourceAttr = container.getAttribute('data-sources');
    if (!sourceAttr) return;
    const sources = sourceAttr.split(',').map(s => s.trim()).filter(Boolean);
    const category = container.getAttribute('data-category') || '';
    const total = parseInt(container.getAttribute('data-items')) || 10;
    const sort = container.getAttribute('data-sort') || 'date';

    if (!sources.length) return;

    addPreconnect(sources);

    let allEntries = [];
    let completed = 0;

    sources.forEach(source => {
      loadBloggerOptimized(source, category, total, entries => {
        allEntries = allEntries.concat(entries);
        completed++;

        if (completed === sources.length) {
          if (sort === 'date') {
            allEntries.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
          }
          const slicedEntries = allEntries.slice(0, total);
          container.innerHTML = slicedEntries.length ? renderList(slicedEntries) : config.ERROR_MESSAGE;
          container.removeAttribute('aria-busy');
        }
      }, container);
    });
  };

  document.querySelectorAll('.recent-blg-multi').forEach(container => {
    container.dataset.loader = 'loadMultiBlogger';
    lazyLoadObserver.observe(container);
  });

});


/**
 * CENTRALIZED BANNER WIDGET
 * Pasang script ini di semua website (20+ sites)
 * Banner akan auto-update dari central config
 * 
 * IMPORTANT: Script ini HANYA memproses <div id="banner-event">
 * Tidak akan interferensi dengan widget lain seperti .recent-wp-multi
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const CONFIG_URL = 'https://yanuarzg.github.io/cc/he/banner-config.json';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 menit cache
  const BANNER_NAMESPACE = 'centralizedBanner'; // Unique namespace

  // ============================================================
  // CACHE HELPER (Namespaced untuk avoid conflict)
  // ============================================================
  function getCachedConfig() {
    try {
      const cached = localStorage.getItem(BANNER_NAMESPACE + '_config');
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(BANNER_NAMESPACE + '_config');
        return null;
      }
      return data.config;
    } catch {
      return null;
    }
  }

  function setCachedConfig(config) {
    try {
      localStorage.setItem(BANNER_NAMESPACE + '_config', JSON.stringify({
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
    // HANYA proses container dengan ID spesifik 'banner-event'
    const container = document.getElementById('banner-event');
    if (!container) {
      // Tidak ada banner-event container, skip
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
  // BLOGGER LOADER (dengan unique callback name)
  // ============================================================
  function loadBloggerArticles(config) {
    return new Promise((resolve) => {
      const cbName = BANNER_NAMESPACE + '_blg_' + Math.random().toString(36).slice(2);

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

/* Scroll Control (Passive for Performance) */
(function() {
  let lastS = 0;
  let timeout;
  window.addEventListener('scroll', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      let currS = window.pageYOffset;
      if (Math.abs(currS - lastS) < 50) return;
      document.body.classList.toggle('dw', currS > lastS && currS > 100);
      document.body.classList.toggle('up', currS < lastS);
      lastS = currS;
    }, 100);
  }, { passive: true });
})();

var d = new Date(); var n = d.getFullYear(); var yearElement = document.getElementById('getYear'); if (yearElement) { yearElement.innerHTML = n; }

document.addEventListener('DOMContentLoaded', function() {
    const target = document.querySelector('#redaksi');      // elemen tujuan
    const elementToMove = document.querySelector('.lh-normal'); // elemen yang dipindah

    if (target && elementToMove) {
        // Pindahkan elemen .lh-normal ke dalam #redaksi
        target.appendChild(elementToMove);
    }
});
