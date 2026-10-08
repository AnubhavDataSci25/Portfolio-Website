/**
 * polish.js - Advanced UX, Scroll Interactions, Motion & Page Behaviors
 */

(function () {
    'use strict';

    // 1. Progressive enhancement marker: only hide reveals when JS is actually executing
    document.documentElement.classList.add('js-enabled');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    function initAll() {
        initNavbar();
        initBackToTop();
        initScrollReveal();
        initPageTransitions();
        initHeroAmbience();
        initImageFadeIn();
        initTechMarquee();
        initSkillBars();
        initCertCards();
        initProjectSearchAndModal();
        initImageLightbox();
        initServicesQuiz();
        initBlogEnhancements();
        initContactEnhancements();
    }

    /**
     * Phase 1: Navbar Sticky Scrolled State, Scroll Progress, ScrollSpy & Mobile Drawer
     */
    function initNavbar() {
        const mainNav = document.getElementById('mainNav');
        if (!mainNav) return;

        // Ensure scroll progress bar exists
        let progressBar = document.getElementById('navScrollProgress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'navScrollProgress';
            progressBar.className = 'nav-scroll-progress';
            progressBar.setAttribute('aria-hidden', 'true');
            const navContainer = mainNav.querySelector('.container') || mainNav;
            navContainer.appendChild(progressBar);
        }

        // High-performance scroll handler (Scrolled state & Progress bar)
        let ticking = false;

        function updateScrollState() {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Scrolled styling toggle after 20px
            if (scrollY > 20) {
                if (!mainNav.classList.contains('navbar-scrolled')) {
                    mainNav.classList.add('navbar-scrolled');
                }
            } else {
                if (mainNav.classList.contains('navbar-scrolled')) {
                    mainNav.classList.remove('navbar-scrolled');
                }
            }

            // Scroll progress percentage
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                const progress = Math.min(Math.max(scrollY / docHeight, 0), 1);
                progressBar.style.transform = `scaleX(${progress})`;
            } else {
                progressBar.style.transform = 'scaleX(0)';
            }

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollState);
                ticking = true;
            }
        }, { passive: true });

        updateScrollState();

        // Highlight current page active link
        const currentPath = window.location.pathname.replace(/\/$/, '');
        const filename = currentPath.split('/').pop() || 'index.html';
        const isBlogSubpage = currentPath.includes('/blog/');

        const navLinks = mainNav.querySelectorAll('.nav-link');
        let matchedLink = null;

        navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');

            const href = link.getAttribute('href');
            if (!href) return;

            const linkFile = href.replace(/^(\.\.\/)+/, '').split('#')[0].split('/').pop() || 'index.html';

            if (isBlogSubpage && linkFile === 'blog.html') {
                matchedLink = link;
            } else if (filename === linkFile || (filename === '' && linkFile === 'index.html')) {
                matchedLink = link;
            }
        });

        if (matchedLink) {
            matchedLink.classList.add('active');
            matchedLink.setAttribute('aria-current', 'page');
        }

        // Index.html ScrollSpy
        const isIndexPage = filename === 'index.html' || filename === '';
        if (isIndexPage) {
            initIndexScrollSpy(mainNav, navLinks);
        }

        // Mobile hamburger auto-close on link click or outside click
        const navCollapse = document.getElementById('navbarNav');
        if (navCollapse) {
            const clickableItems = navCollapse.querySelectorAll('.nav-link, .nav-hire-btn');
            clickableItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (navCollapse.classList.contains('show') && window.bootstrap && window.bootstrap.Collapse) {
                        const bsCollapse = window.bootstrap.Collapse.getInstance(navCollapse) || 
                                           new window.bootstrap.Collapse(navCollapse, { toggle: false });
                        bsCollapse.hide();
                    }
                });
            });

            document.addEventListener('click', (e) => {
                if (!mainNav.contains(e.target) && navCollapse.classList.contains('show')) {
                    if (window.bootstrap && window.bootstrap.Collapse) {
                        const bsCollapse = window.bootstrap.Collapse.getInstance(navCollapse) || 
                                           new window.bootstrap.Collapse(navCollapse, { toggle: false });
                        bsCollapse.hide();
                    }
                }
            });
        }
    }

    function initIndexScrollSpy(mainNav, navLinks) {
        const sectionsToSpy = [
            { id: 'services-preview', linkHref: 'services.html' },
            { id: 'featured-projects', linkHref: 'projects.html' },
            { id: 'featured-blog', linkHref: 'blog.html' }
        ];

        const homeLink = Array.from(navLinks).find(l => {
            const h = l.getAttribute('href') || '';
            return h === 'index.html' || h === '/' || h === './index.html';
        });

        function updateSpy() {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollY < 400) {
                navLinks.forEach(l => l.classList.remove('active'));
                if (homeLink) homeLink.classList.add('active');
                return;
            }

            let currentActiveHref = null;
            sectionsToSpy.forEach(sec => {
                const el = document.getElementById(sec.id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 200 && rect.bottom >= 150) {
                        currentActiveHref = sec.linkHref;
                    }
                }
            });

            if (currentActiveHref) {
                navLinks.forEach(l => {
                    const h = l.getAttribute('href');
                    if (h === currentActiveHref) {
                        l.classList.add('active');
                    } else {
                        l.classList.remove('active');
                    }
                });
            } else if (scrollY < 800 && homeLink) {
                navLinks.forEach(l => l.classList.remove('active'));
                homeLink.classList.add('active');
            }
        }

        window.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateSpy);
        }, { passive: true });
    }

    /**
     * Phase 2: Back-to-Top Button (Stacked above chatbot)
     */
    function initBackToTop() {
        let btt = document.getElementById('backToTop');
        if (!btt) {
            btt = document.createElement('button');
            btt.id = 'backToTop';
            btt.setAttribute('aria-label', 'Back to top');
            btt.setAttribute('type', 'button');
            btt.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
            document.body.appendChild(btt);
        }

        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollY > 400) {
                btt.classList.add('is-visible');
            } else {
                btt.classList.remove('is-visible');
            }
        }, { passive: true });

        btt.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    /**
     * Phase 2: Progressive Enhancement Scroll Reveal
     */
    function initScrollReveal() {
        if (prefersReducedMotion) {
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-revealed'));
            return;
        }

        // Decorate key content elements with .reveal if not already decorated
        const targets = document.querySelectorAll(
            'section .text-center.mb-5, ' +
            '.card, .project-card, .skill-card, .achievement-card, .stat-card, .pricing-card, ' +
            '.education-timeline, .timeline-item, ' +
            'section h1, section h2, .section-header'
        );

        targets.forEach(el => {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
            }
        });

        // Add staggered delays to sibling columns in rows
        document.querySelectorAll('.row').forEach(row => {
            const cols = row.children;
            if (cols.length > 1) {
                Array.from(cols).forEach((col, idx) => {
                    const delayClass = `reveal-delay-${(idx % 8) + 1}`;
                    const targetEl = col.querySelector('.reveal') || (col.classList.contains('reveal') ? col : null);
                    if (targetEl && !targetEl.className.includes('reveal-delay-')) {
                        targetEl.classList.add(delayClass);
                    }
                });
            }
        });

        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-revealed'));
            return;
        }

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.reveal').forEach(el => {
            revealObserver.observe(el);
        });
    }

    /**
     * Phase 2: Internal Page Navigation Transitions
     */
    function initPageTransitions() {
        if (prefersReducedMotion) return;

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            if (
                e.defaultPrevented ||
                e.button !== 0 ||
                e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
                link.getAttribute('target') === '_blank' ||
                href.startsWith('#') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('javascript:') ||
                link.hasAttribute('download')
            ) {
                return;
            }

            try {
                const targetUrl = new URL(href, window.location.href);
                if (targetUrl.origin === window.location.origin) {
                    if (targetUrl.pathname === window.location.pathname && targetUrl.hash) {
                        return;
                    }
                    e.preventDefault();
                    document.body.classList.add('page-exit');
                    setTimeout(() => {
                        window.location.href = href;
                    }, 200);
                }
            } catch (_) {
                // If URL parsing fails, proceed normally
            }
        });
    }

    /**
     * Phase 2: Hero Section Subtle Ambient Motion
     */
    function initHeroAmbience() {
        if (prefersReducedMotion) return;

        const hero = document.querySelector('header.hero-section, section.hero-section, .hero-section, header.py-5, article > .container');
        if (!hero) return;

        // Give hero title an entrance class
        const heroTitle = hero.querySelector('h1');
        if (heroTitle && !heroTitle.classList.contains('hero-title-entrance')) {
            heroTitle.classList.add('hero-title-entrance');
        }

        // Inject ambient blobs into the hero if not already present
        const heroSection = document.querySelector('.hero-section, header.hero-section, section.py-5.mt-5, header.py-5.mt-5');
        if (heroSection && !heroSection.querySelector('.hero-ambient-container')) {
            heroSection.style.position = 'relative';
            const ambient = document.createElement('div');
            ambient.className = 'hero-ambient-container';
            ambient.setAttribute('aria-hidden', 'true');
            ambient.innerHTML = `
                <div class="hero-blob hero-blob-1"></div>
                <div class="hero-blob hero-blob-2"></div>
            `;
            heroSection.prepend(ambient);

            // Pause animation when off-screen to save battery/GPU
            if ('IntersectionObserver' in window) {
                const ambientObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const blobs = ambient.querySelectorAll('.hero-blob');
                        blobs.forEach(b => {
                            b.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
                        });
                    });
                }, { threshold: 0 });
                ambientObserver.observe(heroSection);
            }
        }
    }

    /**
     * Phase 2: Image Smooth Fade-In Once Loaded
     */
    function initImageFadeIn() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.classList.contains('img-fade-in')) {
                img.classList.add('img-fade-in');
            }

            if (img.complete) {
                img.classList.add('is-loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('is-loaded');
                }, { once: true });
                img.addEventListener('error', () => {
                    img.classList.add('is-loaded');
                }, { once: true });
            }
        });
    }

    /**
     * Phase 3: Infinite Tech Marquee
     */
    function initTechMarquee() {
        const marqueeTrack = document.querySelector('.tech-marquee-track');
        if (!marqueeTrack) return;

        // Duplicate children once if needed so it can seamlessly scroll infinite -50%
        if (!marqueeTrack.dataset.cloned) {
            marqueeTrack.dataset.cloned = 'true';
            const clone = marqueeTrack.innerHTML;
            marqueeTrack.innerHTML += clone;
        }
    }

    /**
     * Phase 3: Animated Skill Progress Bars
     */
    function initSkillBars() {
        const skillFills = document.querySelectorAll('.skill-bar-fill[data-percent]');
        if (skillFills.length === 0) return;

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            skillFills.forEach(bar => {
                const pct = bar.getAttribute('data-percent') || '0';
                bar.style.width = pct + '%';
            });
            return;
        }

        const barObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const pct = bar.getAttribute('data-percent') || '0';
                    bar.style.width = pct + '%';
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.2 });

        skillFills.forEach(bar => barObserver.observe(bar));
    }

    /**
     * Phase 3: Expandable / Interactive Certification Cards
     */
    function initCertCards() {
        const certCards = document.querySelectorAll('.cert-card-interactive');
        certCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // If clicked verify link directly, let it open
                if (e.target.closest('a')) return;
                card.classList.toggle('is-expanded');
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    if (!e.target.closest('a')) {
                        e.preventDefault();
                        card.classList.toggle('is-expanded');
                    }
                }
            });
        });
    }

    /**
     * Phase 3: Projects Live Search, Filters & Modal Next/Prev Controls
     */
    function initProjectSearchAndModal() {
        const searchInput = document.getElementById('projectSearchInput');
        const filterBtns = document.querySelectorAll('.project-filter-btn');
        const projectItems = document.querySelectorAll('.project-item-col');
        const emptyState = document.getElementById('projectEmptyState');

        let currentCategory = 'all';
        let searchQuery = '';

        function filterProjects() {
            let visibleCount = 0;
            projectItems.forEach(item => {
                const category = item.getAttribute('data-category') || '';
                const title = (item.querySelector('h5, h6') || {}).textContent || '';
                const desc = (item.querySelector('p') || {}).textContent || '';
                const badges = Array.from(item.querySelectorAll('.badge')).map(b => b.textContent).join(' ');
                const text = `${title} ${desc} ${badges}`.toLowerCase();

                const matchesCategory = (currentCategory === 'all' || category === currentCategory);
                const matchesSearch = !searchQuery || text.includes(searchQuery);

                if (matchesCategory && matchesSearch) {
                    item.style.display = '';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });

            if (emptyState) {
                emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim().toLowerCase();
                filterProjects();
            });
        }

        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                    });
                    btn.classList.add('active');
                    btn.setAttribute('aria-pressed', 'true');
                    currentCategory = btn.getAttribute('data-filter') || 'all';
                    filterProjects();
                });
            });
        }

        // Modal Next/Prev Navigation & Esc to Close
        const modalOverlay = document.getElementById('caseStudyOverlay');
        if (modalOverlay) {
            // Esc key listener
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modalOverlay.classList.contains('is-active')) {
                    const closeBtn = document.getElementById('closeModalBtn');
                    if (closeBtn) closeBtn.click();
                    else modalOverlay.classList.remove('is-active');
                }
            });

            // Cycle through project modal items
            const modalPrevBtn = document.getElementById('modalPrevBtn');
            const modalNextBtn = document.getElementById('modalNextBtn');

            function getProjectKeys() {
                const btns = Array.from(document.querySelectorAll('.open-case-study'));
                return btns.map(b => b.getAttribute('data-project')).filter(Boolean);
            }

            if (modalPrevBtn && modalNextBtn) {
                modalPrevBtn.addEventListener('click', () => {
                    const keys = getProjectKeys();
                    const currentKey = modalOverlay.dataset.currentProject;
                    if (!currentKey || keys.length <= 1) return;
                    let idx = keys.indexOf(currentKey);
                    idx = (idx - 1 + keys.length) % keys.length;
                    const prevBtn = document.querySelector(`.open-case-study[data-project="${keys[idx]}"]`);
                    if (prevBtn) prevBtn.click();
                });

                modalNextBtn.addEventListener('click', () => {
                    const keys = getProjectKeys();
                    const currentKey = modalOverlay.dataset.currentProject;
                    if (!currentKey || keys.length <= 1) return;
                    let idx = keys.indexOf(currentKey);
                    idx = (idx + 1) % keys.length;
                    const nextBtn = document.querySelector(`.open-case-study[data-project="${keys[idx]}"]`);
                    if (nextBtn) nextBtn.click();
                });
            }

            // Sync currentProject attribute when case study opens
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.open-case-study');
                if (btn) {
                    const key = btn.getAttribute('data-project');
                    if (key) modalOverlay.dataset.currentProject = key;
                }
            });
        }
    }

    /**
     * Phase 3: Image Lightbox Modal for Achievements
     */
    function initImageLightbox() {
        const triggers = document.querySelectorAll('.lightbox-trigger, [data-lightbox-src]');
        if (triggers.length === 0) return;

        let lightbox = document.getElementById('imageLightboxOverlay');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'imageLightboxOverlay';
            lightbox.className = 'image-lightbox-overlay';
            lightbox.setAttribute('role', 'dialog');
            lightbox.setAttribute('aria-modal', 'true');
            lightbox.setAttribute('aria-label', 'Image preview');
            lightbox.innerHTML = `
                <div class="image-lightbox-content">
                    <button type="button" class="image-lightbox-close" aria-label="Close image preview">&times;</button>
                    <img src="" alt="" class="image-lightbox-img" id="lightboxImg">
                    <p class="image-lightbox-caption" id="lightboxCaption"></p>
                </div>
            `;
            document.body.appendChild(lightbox);

            const closeBtn = lightbox.querySelector('.image-lightbox-close');
            function closeLightbox() {
                lightbox.classList.remove('is-active');
                document.body.style.overflow = '';
            }

            if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) closeLightbox();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('is-active')) {
                    closeLightbox();
                }
            });
        }

        const imgEl = document.getElementById('lightboxImg');
        const captionEl = document.getElementById('lightboxCaption');

        triggers.forEach(trigger => {
            trigger.style.cursor = 'zoom-in';
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const src = trigger.getAttribute('data-lightbox-src') || trigger.getAttribute('src') || trigger.getAttribute('href');
                const caption = trigger.getAttribute('data-caption') || trigger.getAttribute('alt') || '';
                if (src && imgEl) {
                    imgEl.src = src;
                    imgEl.alt = caption;
                    if (captionEl) captionEl.textContent = caption;
                    lightbox.classList.add('is-active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });
    }

    /**
     * Phase 3: Services 3-Question Recommendation Quiz
     */
    function initServicesQuiz() {
        const quizContainer = document.getElementById('serviceQuizContainer');
        if (!quizContainer) return;

        let answers = { goal: null, timeline: null, assets: null };

        const options = quizContainer.querySelectorAll('.quiz-option-btn');
        options.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                const value = btn.getAttribute('data-value');
                if (!question || !value) return;

                // Mark selected in same group
                const siblings = quizContainer.querySelectorAll(`.quiz-option-btn[data-question="${question}"]`);
                siblings.forEach(s => s.classList.remove('selected'));
                btn.classList.add('selected');

                answers[question] = value;
                calculateQuizResult();
            });
        });

        function calculateQuizResult() {
            if (!answers.goal || !answers.timeline || !answers.assets) return;

            const resultBox = document.getElementById('quizResultBox');
            const resultTitle = document.getElementById('quizResultTitle');
            const resultDesc = document.getElementById('quizResultDesc');
            const resultCta = document.getElementById('quizResultCta');

            if (!resultBox || !resultTitle || !resultDesc || !resultCta) return;

            let recService = 'ai-automation';
            let title = 'AI Automation & Chatbots';
            let desc = 'Your workflow needs custom automation and intelligent AI bots to streamline repetitive tasks and save valuable hours.';

            if (answers.goal === 'data' || answers.assets === 'raw-data') {
                recService = 'data-science';
                title = 'Data Science & Machine Learning';
                desc = 'You have datasets ready for predictive models, feature analysis, and data-driven intelligence.';
            } else if (answers.goal === 'writing' || answers.assets === 'docs') {
                recService = 'technical-writing';
                title = 'Technical Writing & Documentation';
                desc = 'You need clear, developer-focused technical guides and SEO-optimized documentation that rank and educate.';
            }

            resultTitle.textContent = title;
            resultDesc.textContent = desc;
            resultCta.href = `contact.html?service=${recService}`;
            resultCta.textContent = `Get Started with ${title} →`;
            resultBox.style.display = 'block';
            resultBox.classList.add('reveal', 'is-revealed');
        }
    }

    /**
     * Phase 3: Blog Enhancements (Reading Progress, Code Copy, Share Buttons)
     */
    function initBlogEnhancements() {
        const isBlog = window.location.pathname.includes('/blog') || document.querySelector('.post-content') || document.querySelector('article.post-content');
        if (!isBlog) return;

        // 1. Reading progress bar below navbar
        let bar = document.querySelector('.post-reading-progress');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'post-reading-progress';
            bar.setAttribute('aria-hidden', 'true');
            document.body.appendChild(bar);
        }

        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                const progress = Math.min(Math.max(scrollY / docHeight, 0), 1);
                bar.style.transform = `scaleX(${progress})`;
            }
        }, { passive: true });

        // 2. Code Block Copy Button
        const codeBlocks = document.querySelectorAll('pre code, pre');
        codeBlocks.forEach(code => {
            const pre = code.tagName.toLowerCase() === 'pre' ? code : code.parentElement;
            if (pre && !pre.querySelector('.code-copy-btn')) {
                pre.style.position = 'relative';
                const copyBtn = document.createElement('button');
                copyBtn.type = 'button';
                copyBtn.className = 'code-copy-btn';
                copyBtn.innerHTML = '<i class="far fa-copy me-1"></i>Copy';
                copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

                copyBtn.addEventListener('click', async () => {
                    const text = code.innerText || code.textContent;
                    try {
                        await navigator.clipboard.writeText(text);
                        copyBtn.innerHTML = '<i class="fas fa-check me-1 text-success"></i>Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="far fa-copy me-1"></i>Copy';
                        }, 2000);
                    } catch (_) {
                        copyBtn.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="far fa-copy me-1"></i>Copy';
                        }, 2000);
                    }
                });

                pre.appendChild(copyBtn);
            }
        });

        // 3. Share Buttons
        const shareBtns = document.querySelectorAll('.blog-share-btn');
        shareBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = btn.getAttribute('data-platform');
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);

                if (platform === 'linkedin') {
                    e.preventDefault();
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,width=600,height=500');
                } else if (platform === 'x' || platform === 'twitter') {
                    e.preventDefault();
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'noopener,width=600,height=500');
                } else if (platform === 'whatsapp') {
                    e.preventDefault();
                    window.open(`https://api.whatsapp.com/send?text=${title}%20${url}`, '_blank', 'noopener');
                } else if (platform === 'copy') {
                    e.preventDefault();
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        const originalHTML = btn.innerHTML;
                        btn.innerHTML = '<i class="fas fa-check text-success"></i>';
                        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
                    });
                }
            });
        });
    }

    /**
     * Phase 3: Contact Form Improvements
     */
    function initContactEnhancements() {
        const contactForm = document.getElementById('contact-form') || document.querySelector('form[action*="formspree.io"]');
        if (!contactForm) return;

        // 1. Service parameter auto-selection (?service=ai-automation, ?service=data-science, ?service=technical-writing)
        const params = new URLSearchParams(window.location.search);
        const serviceParam = params.get('service');
        const serviceSelect = contactForm.querySelector('select[name="service"], #service');

        if (serviceParam && serviceSelect) {
            const paramLower = serviceParam.toLowerCase();
            Array.from(serviceSelect.options).forEach(opt => {
                const optVal = opt.value.toLowerCase();
                const optText = opt.text.toLowerCase();
                if (optVal.includes(paramLower) || optText.includes(paramLower) ||
                    (paramLower === 'ai-automation' && (optVal.includes('automation') || optText.includes('automation'))) ||
                    (paramLower === 'data-science' && (optVal.includes('science') || optText.includes('data'))) ||
                    (paramLower === 'technical-writing' && (optVal.includes('writing') || optText.includes('technical')))) {
                    opt.selected = true;
                }
            });
        }

        // 2. Character counter for message textarea (up to 500 chars)
        const messageTextarea = contactForm.querySelector('textarea[name="message"], #message');
        const charCountEl = document.getElementById('charCount');

        if (messageTextarea && charCountEl) {
            function updateCount() {
                const len = messageTextarea.value.length;
                charCountEl.textContent = len;
                if (len > 450) {
                    charCountEl.parentElement.classList.add('near-limit');
                } else {
                    charCountEl.parentElement.classList.remove('near-limit');
                }
            }
            messageTextarea.addEventListener('input', updateCount);
            updateCount();
        }

        // 3. Formspree submit enhancement with loading and animated checkmark feedback
        contactForm.addEventListener('submit', async (e) => {
            // If already processed or handled, return
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            e.preventDefault();
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    contactForm.reset();
                    if (charCountEl) charCountEl.textContent = '0';
                    const successModalEl = document.getElementById('successModal');
                    if (successModalEl && window.bootstrap && window.bootstrap.Modal) {
                        const modal = new window.bootstrap.Modal(successModalEl);
                        modal.show();
                    } else {
                        // Inline animated checkmark card
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'alert alert-success mt-4 p-4 rounded-4 text-center';
                        alertDiv.innerHTML = `
                            <svg class="checkmark mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style="width: 50px; height: 50px; display: inline-block;">
                                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                            <h5 class="fw-bold text-success mb-2">Message Sent Successfully!</h5>
                            <p class="small text-secondary mb-0">Thank you for reaching out. I typically respond within 24 hours.</p>
                        `;
                        contactForm.style.display = 'none';
                        contactForm.parentNode.appendChild(alertDiv);
                    }
                } else {
                    const data = await response.json();
                    alert(data.error || 'Oops! There was a problem submitting your form. Please try again or email directly.');
                }
            } catch (err) {
                alert('Connection error. Please try again or contact me directly via email.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });
    }
})();

