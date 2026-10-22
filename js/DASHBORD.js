
(function () {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) return;

   
    menuBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });

   
    document.addEventListener("click", function (event) {
        if ( !menuBtn.contains(event.target) &&!sidebar.contains(event.target))
             {
            sidebar.classList.remove("open");
        }
    });
})();