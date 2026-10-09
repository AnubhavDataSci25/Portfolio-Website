/**
 * MOBILE.JS - Mobile UX, Touch Behaviors & Stacking Management
 * Strictly runs on mobile screens (max-width: 991.98px)
 * DESKTOP FUNCTIONALITY IS COMPLETELY PRESERVED
 */

(function () {
    'use strict';

    const isMobile = () => window.matchMedia('(max-width: 991.98px)').matches;

    // Helper to lock/unlock body scroll safely
    let scrollLockCount = 0;
    const lockBodyScroll = () => {
        if (!isMobile()) return;
        scrollLockCount++;
        if (scrollLockCount === 1) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        }
    };

    const unlockBodyScroll = () => {
        if (!isMobile()) return;
        scrollLockCount = Math.max(0, scrollLockCount - 1);
        if (scrollLockCount === 0) {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
    };

    /**
     * Mobile Touch Swipe Gesture for Bottom Sheets
     * Allows user to pull down from the header/drag handle to dismiss.
     */
    function initSwipeToDismiss(sheetElement, closeCallback) {
        if (!sheetElement) return;
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        sheetElement.addEventListener('touchstart', (e) => {
            if (!isMobile()) return;
            // Only allow dragging if touching near the top or if scrollable body is at top
            const scrollBody = sheetElement.querySelector('.chat-body') || sheetElement;
            if (scrollBody && scrollBody.scrollTop > 10) return;

            startY = e.touches[0].clientY;
            currentY = startY;
            isDragging = true;
        }, { passive: true });

        sheetElement.addEventListener('touchmove', (e) => {
            if (!isDragging || !isMobile()) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            if (deltaY > 0) {
                // Dragging downwards
                sheetElement.style.transform = `translateY(${deltaY}px)`;
                sheetElement.style.transition = 'none';
            }
        }, { passive: true });

        sheetElement.addEventListener('touchend', () => {
            if (!isDragging || !isMobile()) return;
            isDragging = false;
            const deltaY = currentY - startY;

            sheetElement.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
            if (deltaY > 90) {
                // Dragged sufficiently downwards: animate dismiss
                sheetElement.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    closeCallback();
                    sheetElement.style.transform = '';
                    sheetElement.style.transition = '';
                }, 220);
            } else {
                // Snap back to normal
                sheetElement.style.transform = 'translateY(0)';
                setTimeout(() => {
                    sheetElement.style.transform = '';
                    sheetElement.style.transition = '';
                }, 220);
            }
        }, { passive: true });
    }

    /* --------------------------------------------------------
       1. STICKY HIRE BAR COORDINATION (services.html)
       -------------------------------------------------------- */
    function initStickyHireBarSync() {
        const hireBar = document.getElementById('sticky-hire-bar');
        if (!hireBar) return;

        const updateBodyClass = () => {
            if (isMobile() && hireBar.classList.contains('visible')) {
                document.body.classList.add('has-sticky-hire-bar');
            } else {
                document.body.classList.remove('has-sticky-hire-bar');
            }
        };

        // Observe class changes on #sticky-hire-bar
        const observer = new MutationObserver(updateBodyClass);
        observer.observe(hireBar, { attributes: true, attributeFilter: ['class'] });

        window.addEventListener('resize', updateBodyClass, { passive: true });
        updateBodyClass();
    }

    /* --------------------------------------------------------
       2. MOBILE NAVBAR DRAWER ENHANCEMENT (PHASE 3)
       -------------------------------------------------------- */
    function initMobileNav() {
        const navCollapse = document.getElementById('navbarNav');
        const toggler = document.querySelector('.navbar-toggler');
        const mainNav = document.getElementById('mainNav');

        if (!navCollapse || !toggler) return;

        // Ensure mobile backdrop element exists
        let backdrop = document.querySelector('.navbar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'navbar-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            document.body.appendChild(backdrop);
        }

        // Auto close helper
        const closeNav = () => {
            if (navCollapse.classList.contains('show')) {
                if (window.bootstrap && window.bootstrap.Collapse) {
                    const bsCollapse = window.bootstrap.Collapse.getInstance(navCollapse) || new window.bootstrap.Collapse(navCollapse, { toggle: false });
                    bsCollapse.hide();
                } else {
                    navCollapse.classList.remove('show');
                    toggler.setAttribute('aria-expanded', 'false');
                }
                backdrop.classList.remove('is-active');
                unlockBodyScroll();
            }
        };

        // Lock scroll on Bootstrap show, unlock on hide
        navCollapse.addEventListener('show.bs.collapse', () => {
            if (isMobile()) {
                lockBodyScroll();
                backdrop.classList.add('is-active');
                toggler.setAttribute('aria-expanded', 'true');
            }
        });

        navCollapse.addEventListener('hide.bs.collapse', () => {
            if (isMobile()) {
                unlockBodyScroll();
                backdrop.classList.remove('is-active');
                toggler.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on backdrop tap
        backdrop.addEventListener('click', () => {
            if (isMobile()) closeNav();
        });

        // Close when clicking any nav link
        navCollapse.querySelectorAll('.nav-link, .nav-hire-btn').forEach(link => {
            link.addEventListener('click', () => {
                if (isMobile()) closeNav();
            });
        });

        // Close on outside tap
        document.addEventListener('click', (e) => {
            if (!isMobile()) return;
            if (navCollapse.classList.contains('show') && !mainNav.contains(e.target)) {
                closeNav();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navCollapse.classList.contains('show')) {
                closeNav();
            }
        });
    }

    /* --------------------------------------------------------
       3. HORIZONTAL SCROLLABLE FILTER ROWS (CENTER ACTIVE CHIP)
       -------------------------------------------------------- */
    function initFilterChipsScroll() {
        const filterContainers = document.querySelectorAll('.project-filter-row, .cert-filter-row, .blog-filter-row');

        filterContainers.forEach(container => {
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn || !isMobile()) return;

                // Center active chip smoothly into view
                setTimeout(() => {
                    btn.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }, 50);
            });
        });
    }

    /* --------------------------------------------------------
       4. MOBILE CHATBOT BOTTOM SHEET & BACK-TO-TOP COORDINATION
       -------------------------------------------------------- */
    function initChatbotMobile() {
        const chatWindow = document.getElementById('chat-window');
        const chatTrigger = document.getElementById('chat-trigger');
        const chatClose = document.getElementById('close-chat') || document.getElementById('chat-close');

        if (!chatWindow || !chatTrigger) return;

        // When chat opens on mobile, lock body scroll
        const checkChatVisibility = () => {
            if (!isMobile()) return;
            const isOpen = !chatWindow.classList.contains('d-none');
            if (isOpen) {
                lockBodyScroll();
            } else {
                unlockBodyScroll();
            }
        };

        const observer = new MutationObserver(checkChatVisibility);
        observer.observe(chatWindow, { attributes: true, attributeFilter: ['class', 'style'] });

        if (chatClose) {
            chatClose.addEventListener('click', () => {
                if (isMobile()) unlockBodyScroll();
            });
        }

        // Close chat on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMobile() && !chatWindow.classList.contains('d-none')) {
                chatWindow.classList.add('d-none');
                unlockBodyScroll();
            }
        });

        // Close chat on outside tap on mobile
        document.addEventListener('click', (e) => {
            if (!isMobile()) return;
            if (!chatWindow.classList.contains('d-none')) {
                if (!chatWindow.contains(e.target) && !chatTrigger.contains(e.target)) {
                    chatWindow.classList.add('d-none');
                    unlockBodyScroll();
                }
            }
        });

        // Enable pull-down-to-dismiss gesture on mobile bottom sheet
        initSwipeToDismiss(chatWindow, () => {
            chatWindow.classList.add('d-none');
            unlockBodyScroll();
        });
    }

    /* --------------------------------------------------------
       5. MOBILE MODALS (DETAILS & LIGHTBOXES)
       -------------------------------------------------------- */
    function initMobileModals() {
        // Project Details Case Study Modal
        const overlay = document.getElementById('caseStudyOverlay');
        const closeBtn = document.getElementById('closeCaseStudy') || document.getElementById('caseStudyClose');

        if (overlay) {
            const checkOverlay = () => {
                if (!isMobile()) return;
                if (overlay.classList.contains('is-active')) {
                    lockBodyScroll();
                } else {
                    unlockBodyScroll();
                }
            };

            const modalObserver = new MutationObserver(checkOverlay);
            modalObserver.observe(overlay, { attributes: true, attributeFilter: ['class'] });

            // Dismiss when tapping outside the modal content container
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay && isMobile()) {
                    overlay.classList.remove('is-active');
                    unlockBodyScroll();
                }
            });

            // Swipe to dismiss bottom sheet modal
            const container = overlay.querySelector('.case-study-container');
            if (container) {
                initSwipeToDismiss(container, () => {
                    overlay.classList.remove('is-active');
                    unlockBodyScroll();
                });
            }
        }

        // Achievement Lightbox Modals
        const checkLightboxElements = () => {
            const lightboxes = document.querySelectorAll('#imageLightboxOverlay, #achievementLightbox');
            lightboxes.forEach(lb => {
                if (lb.dataset.mobileObserved) return;
                lb.dataset.mobileObserved = 'true';

                const checkLb = () => {
                    if (!isMobile()) return;
                    if (lb.classList.contains('is-active')) {
                        lockBodyScroll();
                    } else {
                        unlockBodyScroll();
                    }
                };
                const lbObserver = new MutationObserver(checkLb);
                lbObserver.observe(lb, { attributes: true, attributeFilter: ['class'] });

                lb.addEventListener('click', (e) => {
                    if (e.target === lb && isMobile()) {
                        lb.classList.remove('is-active');
                        unlockBodyScroll();
                    }
                });
            });
        };

        checkLightboxElements();
        // Re-check after dynamic creation if needed
        setTimeout(checkLightboxElements, 1000);
    }

    /* --------------------------------------------------------
       6. BLOG TABLE OF CONTENTS COLLAPSIBLE ACCORDION ON MOBILE
       -------------------------------------------------------- */
    function initBlogMobileTOC() {
        const tocContainer = document.getElementById('toc-container');
        const tocList = document.getElementById('toc-list');
        if (!tocContainer || !tocList || !isMobile()) return;

        const heading = tocContainer.querySelector('h6');
        if (!heading || tocContainer.querySelector('.toc-toggle-btn')) return;

        // Transform heading into interactive mobile toggle button
        const titleText = heading.innerHTML;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'toc-toggle-btn';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = `<span>${titleText}</span><i class="fas fa-chevron-down toc-toggle-icon ms-2"></i>`;

        // Hide list initially on mobile
        tocList.style.display = 'none';

        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
            tocList.style.display = isExpanded ? 'none' : 'flex';
        });

        // Replace heading with toggle button
        heading.replaceWith(toggleBtn);

        // When a TOC link is clicked, smooth scroll and close dropdown
        tocList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                toggleBtn.setAttribute('aria-expanded', 'false');
                tocList.style.display = 'none';
            }
        });
    }

    /* --------------------------------------------------------
       7. MOBILE INPUT FOCUS & VIRTUAL KEYBOARD ADAPTATION (PHASE 4)
       -------------------------------------------------------- */
    function initMobileInputFocus() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (!isMobile()) return;
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    }

    function initVisualViewportSync() {
        if (!window.visualViewport) return;

        const handleViewportResize = () => {
            if (!isMobile()) return;
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
                // If keyboard reduced viewport height by 120px+
                if (window.visualViewport.height < window.innerHeight - 120) {
                    setTimeout(() => {
                        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }
            }
        };

        window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    /* --------------------------------------------------------
       8. MOBILE PROJECT & ACHIEVEMENT IMAGE RECOVERY
       -------------------------------------------------------- */
    function initMobileProjectImages() {
        if (!isMobile()) return;

        const containers = document.querySelectorAll('.project-img-container, .achievement-img-container');
        containers.forEach(container => {
            const img = container.querySelector('img');
            const placeholder = container.querySelector('.project-img-placeholder, .achievement-img-placeholder');
            if (!img || !placeholder) return;

            const revealPlaceholder = () => {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
            };

            // If the image already finished loading or failed
            if (img.complete) {
                if (img.naturalWidth === 0) {
                    revealPlaceholder();
                }
            } else {
                img.addEventListener('error', revealPlaceholder, { once: true });
                img.addEventListener('load', () => {
                    if (img.naturalWidth === 0) {
                        revealPlaceholder();
                    }
                }, { once: true });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initStickyHireBarSync();
            initMobileNav();
            initFilterChipsScroll();
            initChatbotMobile();
            initMobileModals();
            initBlogMobileTOC();
            initMobileInputFocus();
            initVisualViewportSync();
            initMobileProjectImages();
        });
    } else {
        initStickyHireBarSync();
        initMobileNav();
        initFilterChipsScroll();
        initChatbotMobile();
        initMobileModals();
        initBlogMobileTOC();
        initMobileInputFocus();
        initVisualViewportSync();
        initMobileProjectImages();
    }

    window.addEventListener('resize', () => {
        if (isMobile()) {
            initMobileProjectImages();
        }
    }, { passive: true });
})();
