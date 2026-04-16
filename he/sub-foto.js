(function () {
  let tutorialShown = false;
  function initLightbox() {
    const images = document.querySelectorAll(
      '.entry-content img, .post-content img, .post-body img, .post_content.jl_content img'
    );
    if (!images.length) return;

    const gallery = document.createElement('div');
    gallery.id = 'lb-gallery';
    gallery.className = 'lb-gallery';

    const container = images[0].closest('.entry-content, .post-content, .post-body, .post_content.jl_content');
    if (container) container.prepend(gallery);

    const lightbox    = document.getElementById('lightbox');
    const lbImg       = document.getElementById('lightbox-img');
    const lbCaption   = document.getElementById('lightbox-caption');
    const lbIndicator = document.getElementById('lightbox-indicator');

    let index = 0;
    let startX = 0;
    const data = [];

    images.forEach((img) => {
      const realSrc = img.getAttribute('data-src') || img.src;
      if (!realSrc || realSrc.startsWith('data:')) return;

      let caption = '';
      const fig = img.closest('figure');
      if (fig && fig.querySelector('figcaption')) {
        caption = fig.querySelector('figcaption').innerText;
      }
      if (!caption) caption = img.alt || '';

      data.push({ src: realSrc, caption });

      const thumb = document.createElement('img');
      thumb.src = realSrc;
      thumb.alt = caption;
      gallery.appendChild(thumb);

      const figure = img.closest('figure');
      if (figure) figure.remove(); else img.remove();
    });

    if (!data.length) return;

    if (!document.getElementById('lb-swipe-style')) {
      const style = document.createElement('style');
      style.id = 'lb-swipe-style';
      style.textContent = `
        .swipe-tutorial {
          display: none;
          opacity: 0;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .swipe-tutorial.visible {
          display: flex;
          opacity: 1;
        }
        .swipe-tutorial.fade-out {
          opacity: 0;
        }
        .hand-icon {
          font-size: 50px;
          animation: swipeMove 1.2s ease-in-out infinite;
        }
        .swipe-tutorial p {
          color: white;
          background: rgba(0,0,0,0.5);
          padding: 5px 15px;
          border-radius: 20px;
          margin-top: 10px;
          font-size: 14px;
        }
        @media only screen and (min-width: 769px) {
          .swipe-tutorial { display: none !important; }
        }
        @keyframes swipeMove {
          0%   { transform: translateX(40px); opacity: 0; }
          20%  { opacity: 1; }
          80%  { transform: translateX(-40px); opacity: 1; }
          100% { transform: translateX(-40px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById('swipe-tutorial')) {
      const tutorial = document.createElement('div');
      tutorial.id = 'swipe-tutorial';
      tutorial.className = 'swipe-tutorial';
      tutorial.innerHTML = `
        <div class="hand-icon">&#9757;&#65039;</div>
        <p>Geser untuk melihat</p>
      `;
      document.body.appendChild(tutorial);
    }

    const galleryImages = gallery.querySelectorAll('img');
    galleryImages.forEach((img, i) => {
      img.addEventListener('click', () => { index = i; show(); });
    });

    function show() {
      lightbox.style.display = 'flex';
      lbImg.src = data[index].src;
      lbCaption.textContent = data[index].caption;
      lbIndicator.textContent = (index + 1) + ' dari ' + data.length;

      const tutorial = document.getElementById('swipe-tutorial');
      if (!tutorialShown && tutorial) {
        tutorial.classList.add('visible');
        setTimeout(() => {
          tutorial.classList.add('fade-out');
          setTimeout(() => {
            tutorial.remove();
            tutorialShown = true;
          }, 500);
        }, 3000);
      }

      requestAnimationFrame(() => {
        lightbox.classList.add('show-caption');
      });
    }

    function hide() {
      lightbox.style.display = 'none';
      lightbox.classList.remove('show-caption');
    }

    function next() { index = (index + 1) % data.length; show(); }
    function prev() { index = (index - 1 + data.length) % data.length; show(); }

    lightbox.addEventListener('click', e => { if (e.target === lightbox) hide(); });

    document.addEventListener('keydown', e => {
      if (lightbox.style.display !== 'flex') return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    lightbox.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    lightbox.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) next();
      if (endX - startX > 50) prev();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    setTimeout(initLightbox, 300);
  }
})();
