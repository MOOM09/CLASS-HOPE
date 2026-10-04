// ============================================
// Scroll Reveal — يظهر السكشنات بحركة عند النزول
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // 1) السكشنات اللي رح تظهر بحركة fade-up
    const revealTargets = document.querySelectorAll(
        '.about-intro, .section-heading, .why-edutrack, .about-final, ' +
        '.contact-section, .contact-hero, .features'
    );
    revealTargets.forEach(el => el.classList.add('reveal'));

    // 2) الحاويات اللي أولادها رح يظهروا واحد ورا الثاني (Stagger)
    const staggerTargets = document.querySelectorAll(
        '.feature-cards, .contact-details'
    );
    staggerTargets.forEach(el => el.classList.add('reveal-stagger'));

    // 3) Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    });

    document
        .querySelectorAll('.reveal, .reveal-stagger')
        .forEach(el => observer.observe(el));
});