document.addEventListener("DOMContentLoaded", () => { 

  const authorLabels = document.querySelectorAll('.byline.post-author .post-author-label');
  
  if (authorLabels.length > 0) {
    authorLabels.forEach(element => {
      element.innerHTML = element.innerHTML.replace(
        /HarianExpress\.com/g,
        '<a href="https://www.harianexpress.com" rel="noopener noreferrer">HarianExpress.com</a>'
      );
    });
  }
  
  setTimeout(() => { 
    function yzRecHL(e, element) { 
      const s = element.getAttribute("data-items"), label = element.getAttribute("data-label"); 
      let i = '<div class="cont flex wrap">'; 
      if (e.feed && e.feed.entry && e.feed.entry.length > 0) { 
        e.feed.entry.forEach((e, t) => { 
          if (t >= s) return; 
          const l = e.title.$t; 
          
          let a = e.media$thumbnail ? e.media$thumbnail.url : null;
          
          if (!a) {
            const contentText = e.content?.$t || e.summary?.$t || "";
            const imgMatch = contentText.match(/<img.*?src="(.*?)"/);
            if (imgMatch && imgMatch[1]) {
              a = imgMatch[1];
            }
          }
          
          if (!a) {
            a = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjOcKGhyphenhyphenvwYzqkKXFe56WXVJjVA8uEP2VQjStHfCb42EndnkvtBqaaWHfpuJjoPqFXeIowa6-PkCCIopD_3GW-wXz1GeGJGxCDPgXMZW7hhEMEdZ03tWODIbUs9Jr-Zm8WnXduWUq2cFSyuylQioMl5pxMzkJ_u49FZsTBBymOzAUY3V0qfsVoYgG8Pi-U6/rw/JTI-Hi-Res.jpg.jpeg";
          }
          
          a = updateImageUrls(a); 
          const n = e.link.find((e) => "alternate" === e.rel).href, r = e.published.$t, c = e.category ? e.category[0].term : ""; 
          i += '<article class="items post relative w-fill">'; 
          i += '<div class="post-img relative">'; 
          i += `<a href="${n}"><img src="${a}" class="img-thumb br-05"/></a>`; 
          i += "</div>"; 
          i += '<div class="info flex column w-fill">'; 
          i += '<div class="titlendesc flex column">'; 
          i += `<span class="post-title max-line-3 relative"><a href="${n}">${l}</a></span>`; 
          i += "</div>"; 
          i += '<div class="meta relative g-05 mt-05 fs-09 flex wrap w-fill ai-c">'; 
          if (c) { 
            i += `<div class="post-labels"><a href="/search/label/${c}?&max-results=${s}">${c}</a></div>`; 
          } 
          i += `<time class="publish-date timeago fs-08" title="${r}"></time>`; 
          i += '<span class="yz-share pointer absolute zindex-1" title="share" onclick="shareM(this.closest(\'.items\'))">'; 
          i += '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">'; 
          i += '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m20 12l-6.4-7v3.5C10.4 8.5 4 10.6 4 19c0-1.167 1.92-3.5 9.6-3.5V19z"/>'; 
          i += "</svg></span>"; 
          i += "</div>"; 
          i += "</div>"; 
          i += "</article>"; 
        }); 
      } else { 
        i = '<div class="cont flex wrap"></div>'; 
      } 
      i += "</div>"; 
      element.innerHTML = i; 
      initSwipe(); 
      updateTimeAgo(); 
    } 
    (function () { 
      document.querySelectorAll(".recHL").forEach((recHL, index) => { 
        const items = recHL.getAttribute("data-items"), label = recHL.getAttribute("data-label"), dataSource = recHL.getAttribute("data-source"); 
        if (!dataSource) { 
          return; 
        } 
        const cbName = `yzRecHL_${index}`; 
        const blogUrl = dataSource.startsWith("http") ? dataSource : `https://${dataSource}`; 
        const loadFeed = (url, callbackName) => { 
          window[callbackName] = function (data) { 
            yzRecHL(data, recHL); 
          }; 
          const t = document.createElement("script"); 
          t.src = url; 
          t.onerror = () => { 
            if (label) { 
              const recentUrl = `${blogUrl.replace(/\/$/, "")}/feeds/posts/default?orderby=published&alt=json-in-script&max-results=${items}&callback=${callbackName}`; 
              loadFeed(recentUrl, callbackName); 
            } else { 
              yzRecHL({ feed: { entry: [] } }, recHL); 
            } 
          }; 
          document.body.appendChild(t); 
        }; 
        let scriptUrl = `${blogUrl.replace(/\/$/, "")}/feeds/posts/default${ label ? `/-/${encodeURIComponent(label)}` : "" }?orderby=published&alt=json-in-script&max-results=${items}&callback=${cbName}`; 
        loadFeed(scriptUrl, cbName); 
      }); 
    })(); 
  }, 1000); 
});

// Hanya aktif di mobile
if (window.innerWidth <= 768) {

  document.addEventListener('DOMContentLoaded', function() {
    function cleanUrl(url) {
      return url
        .replace(/[?&]m=1/gi, '');
    }
  
    // Cari semua link share di dalam #share
    var shareLinks = document.querySelectorAll('#share a');
  
    shareLinks.forEach(function(link) {
      var originalHref = link.getAttribute('href');
      if (originalHref) {
        var cleanedHref = cleanUrl(originalHref);
        link.setAttribute('href', cleanedHref);
      }
    });
  });

}

const loadWordpressPosts = async () => {
  const wpElements = document.querySelectorAll(".recent-wp");
  if (wpElements.length === 0) return;

  // Daftar Proxy untuk fallback jika salah satu timeout
  const proxies = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://thingproxy.freeboard.io/fetch/"
  ];

  for (const el of wpElements) {
    let rawUrl = el.dataset.url ? el.dataset.url.replace(/\/$/, "") : "";
    const items = parseInt(el.dataset.items) || 4;
    const startIndex = parseInt(el.dataset.index) || 0;
    const style = el.dataset.style || "";

    if (!rawUrl) continue;

    // Optimasi: Hanya minta data sebanyak yang dibutuhkan (index + items)
    // Ini jauh lebih cepat daripada meminta 50 data sekaligus
    const totalNeeded = startIndex + items;

    try {
      let baseUrl = rawUrl;
      let categorySlug = "";
      let categoryId = "";

      if (rawUrl.includes("/category/")) {
        const parts = rawUrl.split("/category/");
        baseUrl = parts[0];
        categorySlug = parts[1].split("/")[0];
      }

      // Fungsi Helper untuk Fetch dengan Timeout & Proxy Fallback
      const fetchWithProxy = async (targetUrl) => {
        let lastError;
        for (let proxy of proxies) {
          try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 8000); // Timeout 8 detik

            const res = await fetch(proxy + encodeURIComponent(targetUrl), { signal: controller.signal });
            clearTimeout(id);
            if (res.ok) return await res.json();
          } catch (err) {
            lastError = err;
            console.warn(`Proxy ${proxy} gagal, mencoba lainnya...`);
          }
        }
        throw lastError;
      };

      // 1. Cari Category ID jika diperlukan
      if (categorySlug) {
        const catData = await fetchWithProxy(`${baseUrl}/wp-json/wp/v2/categories?slug=${categorySlug}`);
        if (catData && catData.length > 0) categoryId = catData[0].id;
      }

      // 2. Ambil Postingan (Hanya sebanyak totalNeeded)
      let postApi = `${baseUrl}/wp-json/wp/v2/posts?_embed&per_page=${totalNeeded}`;
      if (categoryId) postApi += `&categories=${categoryId}`;

      const posts = await fetchWithProxy(postApi);

      if (!posts || posts.length === 0) {
        el.innerHTML = "No Posts Found.";
        continue;
      }

      // 3. Slicing
      const toDisplay = posts.slice(startIndex, totalNeeded);

      // 4. Render
      const html = toDisplay.map(post => {
        const title = post.title?.rendered || "No Title";
        const link = post.link || "#";
        const thumb = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || "https://via.placeholder.com/300x200?text=No+Image";
        const labels = post._embedded?.['wp:term']?.[0]?.map(term => term.name) || [];
        const dateObj = new Date(post.date);
        const dateFormatted = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        return createPostTemplate({
          title, link, thumb,
          date: dateFormatted,
          desc: post.excerpt?.rendered ? post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 100) + "..." : "",
          labels, style, hasDesc: true
        });
      }).join("");

      el.innerHTML = html;

    } catch (error) {
      console.error("WP API Error:", error);
      el.innerHTML = "<div class='error-msg'>Server lambat merespons. Silakan segarkan halaman.</div>";
    }
  }
};

document.addEventListener("DOMContentLoaded", loadWordpressPosts);
