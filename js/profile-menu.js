/* ============================================================
   profile-menu.js
   يفتح/يسكّر قائمة البروفايل + Sign Out
   مشترك لكل صفحات Dashboard-style
   ============================================================ */

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const logoutBtn = document.getElementById("logoutBtn");

if (profileBtn && profileMenu) {
    // فتح/إغلاق القائمة عند الضغط على الصورة
    profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("open");
    });

    // إغلاق عند الضغط خارج القائمة
    document.addEventListener("click", (event) => {
        if (
            !profileBtn.contains(event.target) &&
            !profileMenu.contains(event.target)
        ) {
            profileMenu.classList.remove("open");
        }
    });

    // إغلاق عند Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            profileMenu.classList.remove("open");
        }
    });
}

// Sign Out
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("instructorId");
        window.location.href = "login.html";
    });
}