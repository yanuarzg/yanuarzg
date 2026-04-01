document.querySelectorAll('.news-subdomain-title').forEach(span => {
    // Ambil teks dan hilangkan spasi tambahan
    const city = span.textContent.trim();
    
    // Pastikan hanya memproses jika belum ada link di dalamnya
    if (span.children.length === 0) {
        const link = document.createElement('a');
        
        // Mengubah teks menjadi lowercase untuk URL (misal: Tangsel -> tangsel)
        link.href = `https://${city.toLowerCase()}.harianexpress.com`;
        link.textContent = city;
        
        // Kosongkan isi span dan masukkan link yang baru dibuat
        span.textContent = '';
        span.appendChild(link);
    }
});
