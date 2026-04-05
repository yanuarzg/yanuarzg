var uri = window.location.toString();
if (uri.indexOf("?m=1") > 0) {
    var clean_uri = uri.replace("?m=1", "");
    window.history.replaceState({}, document.title, clean_uri);
}

document.addEventListener("DOMContentLoaded", function() {
    var shareLinks = document.querySelectorAll(
        "a.facebook, a.pinterest, a.twitter, a.whatsapp, a.linkedin, a.telegram"
    );
    shareLinks.forEach(function(link) {
        var href = link.getAttribute("href");
        if (href) {
            link.setAttribute("href", href.replace(/\?m=1/g, ""));
        }
    });
});
