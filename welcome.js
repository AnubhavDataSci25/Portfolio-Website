/**
 * ========================================================
 * WELCOME.JS - Cinematic Welcome Controller & Scroll Parallax
 * Zero-Scroll-Hijack, Hardware-Accelerated, Session-Aware
 * ========================================================
 */
(function () {
    'use strict';

    // 1. Feature & Environment Checks
    const welcomeSection = document.getElementById('welcome');
    if (!welcomeSection) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hasHash = window.location.hash && window.location.hash !== '#';
    const hasSkipQuery = window.location.search.includes('skipintro');
    const isReturning = sessionStorage.getItem('welcome_seen') === '1';
    const isRestoredScroll = window.scrollY > 40;

    // If returning in session, arriving with hash/query, or restored scroll position: collapse immediately
    if (isReturning || hasHash || hasSkipQuery || isRestoredScroll) {
        document.documentElement.classList.add('intro-seen');
        return;
    }

    // 2. State & DOM Nodes
    const sigWrap = welcomeSection.querySelector('.welcome-signature-wrap');
    const welcomeCopy = welcomeSection.querySelector('.welcome-copy');
    const welcomeExplore = welcomeSection.querySelector('.welcome-explore');
    const bgGlow = welcomeSection.querySelector('.welcome-bg-glow');
    const skipLink = document.getElementById('skip-intro');
    const exploreLink = welcomeSection.querySelector('.scroll-explore-link');

    let welcomeHeight = welcomeSection.offsetHeight || window.innerHeight;
    let isIntroFinished = false;
    let isSectionVisible = true;
    let isTicking = false;
    let lastScrollY = window.scrollY;

    // Mark body so navbar & widgets synchronize
    document.body.classList.add('welcome-at-top');

    // 3. Skip to Finished Animation State (Non-blocking)
    function finishIntroInstantly() {
        if (isIntroFinished) return;
        isIntroFinished = true;
        welcomeSection.classList.remove('intro-active');
        welcomeSection.classList.add('intro-completed');
        sessionStorage.setItem('welcome_seen', '1');
    }

    // 4. Start Signature Writing Timeline (if motion allowed)
    if (prefersReducedMotion.matches) {
        finishIntroInstantly();
    } else {
        welcomeSection.classList.add('intro-active');
        // Total sequence duration ~4.3s
        const autoFinishTimer = setTimeout(finishIntroInstantly, 4300);

        // Immediate skip if visitor interacts during animation
        const onEarlyInteract = function (e) {
            // Ignore Tab key so user can focus skip link without jarring layout
            if (e.type === 'keydown' && e.key === 'Tab') return;
            clearTimeout(autoFinishTimer);
            finishIntroInstantly();
            window.removeEventListener('pointerdown', onEarlyInteract);
            window.removeEventListener('keydown', onEarlyInteract);
        };

        window.addEventListener('pointerdown', onEarlyInteract, { once: true, passive: true });
        window.addEventListener('keydown', onEarlyInteract, { once: true });
    }

    // 5. Native Progress-Linked Scroll Animation (No Hijacking)
    function updateScrollProgress() {
        const scrollY = window.scrollY;
        lastScrollY = scrollY;
        const p = Math.min(Math.max(scrollY / welcomeHeight, 0), 1);

        // A. Background Orbs Parallax
        if (bgGlow) {
            bgGlow.style.transform = `translate3d(0, ${p * 55}px, 0)`;
        }

        // B. Signature Lift, Shrink & Fade
        if (sigWrap) {
            const sigTranslateY = -p * 60;
            const sigScale = 1 - p * 0.08;
            const sigOpacity = p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.65);
            sigWrap.style.transform = `translate3d(0, ${sigTranslateY}px, 0) scale(${sigScale}) rotate(-3.5deg)`;
            sigWrap.style.opacity = sigOpacity.toFixed(3);
        }

        // C. Welcome Text Lift & Fade
        if (welcomeCopy) {
            const copyTranslateY = -p * 90;
            const copyOpacity = p < 0.1 ? 1 : Math.max(0, 1 - (p - 0.1) / 0.55);
            welcomeCopy.style.transform = `translate3d(0, ${copyTranslateY}px, 0)`;
            welcomeCopy.style.opacity = copyOpacity.toFixed(3);
        }

        // D. Scroll Indicator Fade (Fast exit on first scroll)
        if (welcomeExplore) {
            const exploreOpacity = Math.max(0, 1 - p / 0.08);
            welcomeExplore.style.opacity = exploreOpacity.toFixed(3);
            welcomeExplore.style.pointerEvents = exploreOpacity <= 0 ? 'none' : 'auto';
        }

        // E. Coexistence with Navbar
        if (p >= 1) {
            document.body.classList.remove('welcome-at-top');
            document.body.style.removeProperty('--nav-welcome-opacity');
            document.body.style.removeProperty('--nav-welcome-translate');
            document.body.style.removeProperty('--nav-welcome-pointer');
            document.body.style.removeProperty('--widget-welcome-opacity');
            document.body.style.removeProperty('--widget-welcome-pointer');
            sessionStorage.setItem('welcome_seen', '1');
        } else {
            document.body.classList.add('welcome-at-top');
            // Navbar fades in smoothly between p = 0.25 and p = 0.70
            const navOpacity = Math.max(0, Math.min(1, (p - 0.25) / 0.45));
            const navTranslate = (1 - navOpacity) * -12;
            document.body.style.setProperty('--nav-welcome-opacity', navOpacity.toFixed(3));
            document.body.style.setProperty('--nav-welcome-translate', `${navTranslate.toFixed(1)}px`);
            document.body.style.setProperty('--nav-welcome-pointer', navOpacity > 0.4 ? 'auto' : 'none');

            // Widgets fade in after 60% scroll
            const widgetOpacity = p >= 0.6 ? '1' : '0';
            const widgetPointer = p >= 0.6 ? 'auto' : 'none';
            document.body.style.setProperty('--widget-welcome-opacity', widgetOpacity);
            document.body.style.setProperty('--widget-welcome-pointer', widgetPointer);
        }

        isTicking = false;
    }

    function onScroll() {
        if (!isIntroFinished && window.scrollY > 15) {
            finishIntroInstantly();
        }
        if (!isSectionVisible) return;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(updateScrollProgress);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // 6. IntersectionObserver to Pause Rendering when Scrolled Past
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isSectionVisible = entry.isIntersecting;
                if (!entry.isIntersecting && window.scrollY > welcomeHeight) {
                    sessionStorage.setItem('welcome_seen', '1');
                } else if (entry.isIntersecting) {
                    welcomeHeight = welcomeSection.offsetHeight || window.innerHeight;
                    if (!isTicking) {
                        isTicking = true;
                        requestAnimationFrame(updateScrollProgress);
                    }
                }
            });
        }, { threshold: [0, 0.1, 0.5, 1] });

        observer.observe(welcomeSection);
    }

    // 7. Resize Handler (Cached Height)
    window.addEventListener('resize', () => {
        welcomeHeight = welcomeSection.offsetHeight || window.innerHeight;
    }, { passive: true });

    // 8. Skip & Explore Click Handlers
    function handleScrollClick(e) {
        e.preventDefault();
        finishIntroInstantly();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    }

    if (skipLink) skipLink.addEventListener('click', handleScrollClick);
    if (exploreLink) exploreLink.addEventListener('click', handleScrollClick);

    // Initial render call
    updateScrollProgress();
})();
