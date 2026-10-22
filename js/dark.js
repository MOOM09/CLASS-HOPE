const darkModeBtn = document.getElementById('darkModeBtn');
const logo = document.querySelector('.logo img, .university-brand img');

if (darkModeBtn) {
    darkModeBtn.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');

        if (document.body.classList.contains('dark-mode')) {
            darkModeBtn.textContent = '☀️';
            if (logo) logo.src = 'photo/darkLogo.jpg';   // ✅ حماية
            localStorage.setItem('darkMode', 'enabled');
        } else {
            darkModeBtn.textContent = '🌙';
            if (logo) logo.src = 'photo/logo.jpg';        // ✅ حماية
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    if (darkModeBtn) darkModeBtn.textContent = '☀️';
    if (logo) logo.src = 'photo/darkLogo.jpg';
}