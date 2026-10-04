/* ============================================================
   DASHBORD.js
   Sidebar toggle للداشبورد
   (profile menu + logout صاروا بـ profile-menu.js)
   ============================================================ */

(function () {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) return;

    // فتح/إغلاق الـ sidebar
    menuBtn.addEventListener("click", function () {
        
        sidebar.classList.toggle("open");
    });

    // إغلاق عند الضغط خارج الـ sidebar
    document.addEventListener("click", function (event) {
        if (
            !menuBtn.contains(event.target) &&
            !sidebar.contains(event.target)
        ) {
            sidebar.classList.remove("open");
        }
    });
})();