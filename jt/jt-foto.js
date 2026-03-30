(function () {

 if (document.getElementById('lb-gallery')) {
  const images = document.querySelectorAll('.post-body img');
  if (!images.length) return;

  let tutorialShown = false; 

  const gallery = document.getElementById('lb-gallery');
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbIndicator = document.getElementById('lightbox-indicator');

  let index = 0;
  let startX = 0;

  const data = [];

  images.forEach((img) => {
    let caption = '';

    // ambil caption dari berbagai kemungkinan
    const fig = img.closest('figure');
    if (fig && fig.querySelector('figcaption')) {
      caption = fig.querySelector('figcaption').innerText;
    }

    const imageCaption = img.closest('.coverImage')?.querySelector('.image-caption');
    if (!caption && imageCaption) caption = imageCaption.innerText;

    const trCaption = img.closest('table')?.querySelector('.tr-caption');
    if (!caption && trCaption) caption = trCaption.innerText;

    if (!caption) caption = img.alt || '';

    data.push({
      src: img.src,
      caption: caption
    });

    // pindahkan ke gallery
    const clone = img.cloneNode(true);
    clone.removeAttribute('loading');
    gallery.appendChild(clone);

    // hapus wrapper lama
    const separator = img.closest('.separator');
    if (separator) separator.remove();

    const table = img.closest('table.tr-caption-container');
    if (table) table.remove();

    const cover = img.closest('.coverImage');
    if (cover) cover.remove();
  });

  const galleryImages = gallery.querySelectorAll('img');

  galleryImages.forEach((img, i) => {
    img.addEventListener('click', function () {
      index = i;
      show();
    });
  });

 function show() {
   lightbox.style.display = 'flex';
   lbImg.src = data[index].src;
   lbCaption.textContent = data[index].caption;
   lbIndicator.textContent = (index + 1) + ' dari ' + data.length;

   const tutorial = document.getElementById('swipe-tutorial');
   if (!tutorialShown && tutorial) {
     tutorial.style.opacity = 1; 
     setTimeout(() => {
       tutorial.remove();
       tutorialShown = true; 
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

  function next() {
    index = (index + 1) % data.length;
    show();
  }

  function prev() {
    index = (index - 1 + data.length) % data.length;
    show();
  }

  // click background
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) hide();
  });

  // keyboard
  document.addEventListener('keydown', e => {
    if (lightbox.style.display !== 'flex') return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // swipe
  lightbox.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });

  lightbox.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) next();
    if (endX - startX > 50) prev();
  });

 }
})();
