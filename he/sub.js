document.querySelectorAll('.news-subdomain-title').forEach(span => {
    const city = span.textContent.trim();
    
    if (span.children.length === 0) {
        const link = document.createElement('a');
        
        link.href = `https://${city.toLowerCase()}.harianexpress.com`;
        link.textContent = city;
        
        span.textContent = '';
        span.appendChild(link);
    }
});

(function () {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const sub = (parts.length >= 3 && parts[0] !== "www") ? parts[0] : null;

  if (sub) {
    localStorage.setItem("he_last_sub", sub);
  }

  const patchLinks = () => {
    const savedSub = localStorage.getItem("he_last_sub");
    if (!savedSub) return;

    document.querySelectorAll('a[href*="harianexpress.com/indeks/"]').forEach((a) => {
      try {
        const url = new URL(a.href);
        if (!url.searchParams.get("ref")) {
          url.searchParams.set("ref", savedSub);
          a.href = url.toString();
        }
      } catch (e) {}
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchLinks);
  } else {
    patchLinks();
  }
})();
