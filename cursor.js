/**
 * ========================================================
 * CURSOR.JS - Premium Custom Cursor, Magnetic & Spotlight
 * Vanilla JS, Compositor-only transforms, Accessible
 * ========================================================
 */
(function () {
    'use strict';

    // 1. Accessibility & Hardware Capability Detection
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!hoverQuery.matches || motionQuery.matches) {
        return; // Pure touch / coarse device or reduced motion: keep 100% native cursor
    }

    // 2. State & Geometry Coordinates
    let targetX = -100;
    let targetY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let glowX = -100;
    let glowY = -100;

    let hasReceivedPointer = false;
    let isPointerInside = false;
    let isPressed = false;
    let isTextInput = false;
    let isClickable = false;
    let isCardHover = false;
    let cardLabelText = '';
    let isKeyboardNav = false;

    let isLoopRunning = false;
    let lastFrameTime = performance.now();
    let lastPointerMoveTime = performance.now();

    // Magnetic State
    let activeMagneticEl = null;
    let activeMagneticInner = null;
    let cachedRect = null;
    let magneticCenterX = 0;
    let magneticCenterY = 0;
    let magneticMaxDist = 0;

    // DOM Elements
    let dotEl = null;
    let ringEl = null;
    let ringShapeEl = null;
    let labelEl = null;
    let glowEl = null;

    // 3. Magnetic Selectors for Primary CTAs
    const MAGNETIC_SELECTOR = [
        '[data-magnetic]',
        '.hero-btns .btn',
        '.hero-buttons .btn',
        '#hero-cta-projects',
        '#hero-cta-hire',
        'a[download].btn',
        'a[href*="Resume"].btn',
        '#nav-hire-me',
        '.nav-hire-btn',
        '.navbar .btn-outline-primary',
        '.navbar .btn-primary',
        '.pricing-cta',
        '.pricing-card .btn-primary',
        '#contact-form button[type="submit"]',
        '.contact-form-btn',
        'a[href*="wa.me"].btn',
        'a[href*="whatsapp"].btn',
        '.btn-consultation'
    ].join(', ');

    // 4. Element Construction & Mounting
    function buildElements() {
        if (dotEl) return;

        glowEl = document.createElement('div');
        glowEl.id = 'cursor-glow';
        glowEl.setAttribute('aria-hidden', 'true');

        ringEl = document.createElement('div');
        ringEl.id = 'cursor-ring';
        ringEl.setAttribute('aria-hidden', 'true');

        ringShapeEl = document.createElement('div');
        ringShapeEl.className = 'cursor-ring-shape';

        labelEl = document.createElement('span');
        labelEl.className = 'cursor-label';
        labelEl.setAttribute('aria-hidden', 'true');

        ringEl.appendChild(ringShapeEl);
        ringEl.appendChild(labelEl);

        dotEl = document.createElement('div');
        dotEl.id = 'cursor-dot';
        dotEl.setAttribute('aria-hidden', 'true');

        document.body.appendChild(glowEl);
        document.body.appendChild(ringEl);
        document.body.appendChild(dotEl);

        document.documentElement.classList.add('has-custom-cursor');
    }

    function removeElements() {
        if (!dotEl) return;
        document.documentElement.classList.remove('has-custom-cursor');
        if (glowEl && glowEl.parentNode) glowEl.parentNode.removeChild(glowEl);
        if (ringEl && ringEl.parentNode) ringEl.parentNode.removeChild(ringEl);
        if (dotEl && dotEl.parentNode) dotEl.parentNode.removeChild(dotEl);
        dotEl = null;
        ringEl = null;
        ringShapeEl = null;
        labelEl = null;
        glowEl = null;
    }

    // 5. Delta-Time Independent Smoothing (Lerp)
    function lerp(start, end, baseFactor, dt) {
        // Normalizes to 60fps base reference so 120/144Hz feels identical
        const clampedDt = Math.min(Math.max(dt, 0.001), 0.1);
        const factor = 1 - Math.pow(1 - baseFactor, clampedDt * 60);
        return start + (end - start) * factor;
    }

    // 6. Animation Frame Loop (Single RAF, Compositor-Only)
    function tick(currentTime) {
        if (!isLoopRunning) return;

        const dt = (currentTime - lastFrameTime) / 1000;
        lastFrameTime = currentTime;

        // Smooth coordinates: dot follows almost instantly, ring lags smoothly, glow trails softly
        dotX = lerp(dotX, targetX, 0.88, dt);
        dotY = lerp(dotY, targetY, 0.88, dt);

        ringX = lerp(ringX, targetX, 0.18, dt);
        ringY = lerp(ringY, targetY, 0.18, dt);

        glowX = lerp(glowX, targetX, 0.08, dt);
        glowY = lerp(glowY, targetY, 0.08, dt);

        // Hardware accelerated transforms
        if (dotEl) {
            dotEl.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
        }
        if (ringEl) {
            ringEl.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        }
        if (glowEl) {
            glowEl.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
        }

        // Magnetic CTA updates
        updateMagnetic();

        // Check if cursor has fully settled to pause RAF and save battery/GPU
        const isSettled =
            Math.abs(targetX - dotX) < 0.15 &&
            Math.abs(targetY - dotY) < 0.15 &&
            Math.abs(targetX - ringX) < 0.25 &&
            Math.abs(targetY - ringY) < 0.25 &&
            Math.abs(targetX - glowX) < 0.6 &&
            Math.abs(targetY - glowY) < 0.6 &&
            !activeMagneticEl;

        if (isSettled && (currentTime - lastPointerMoveTime > 1000)) {
            isLoopRunning = false;
            return;
        }

        requestAnimationFrame(tick);
    }

    function wakeLoop() {
        if (!isLoopRunning && hasReceivedPointer && !isKeyboardNav) {
            isLoopRunning = true;
            lastFrameTime = performance.now();
            requestAnimationFrame(tick);
        }
    }

    // 7. Magnetic Target Physics
    function updateMagnetic() {
        if (!activeMagneticEl) return;

        const dx = targetX - magneticCenterX;
        const dy = targetY - magneticCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist <= magneticMaxDist) {
            const strength = 0.32;
            const maxOffset = 10;
            const pullX = Math.max(-maxOffset, Math.min(maxOffset, dx * strength));
            const pullY = Math.max(-maxOffset, Math.min(maxOffset, dy * strength));

            activeMagneticEl.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;

            if (activeMagneticInner) {
                activeMagneticInner.style.transform = `translate3d(${pullX * 0.5}px, ${pullY * 0.5}px, 0)`;
            }
        } else {
            releaseMagnetic(true);
        }
    }

    function releaseMagnetic(smooth = true) {
        if (!activeMagneticEl) return;
        const el = activeMagneticEl;
        const inner = activeMagneticInner;

        activeMagneticEl = null;
        activeMagneticInner = null;
        cachedRect = null;

        if (smooth) {
            el.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)';
            el.style.transform = 'translate3d(0, 0, 0)';
            if (inner) {
                inner.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)';
                inner.style.transform = 'translate3d(0, 0, 0)';
            }
            setTimeout(() => {
                if (el !== activeMagneticEl) {
                    el.style.transition = '';
                    el.style.transform = '';
                    if (inner) {
                        inner.style.transition = '';
                        inner.style.transform = '';
                    }
                }
            }, 400);
        } else {
            el.style.transition = '';
            el.style.transform = '';
            if (inner) {
                inner.style.transition = '';
                inner.style.transform = '';
            }
        }
    }

    function checkMagneticCandidate(target) {
        if (motionQuery.matches) return;
        const btn = target.closest(MAGNETIC_SELECTOR);
        if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
            if (activeMagneticEl) releaseMagnetic(true);
            return;
        }

        // Avoid magnetic effect inside active modal overlays
        if (btn.closest('.modal, .case-study-overlay.is-active')) {
            if (activeMagneticEl) releaseMagnetic(false);
            return;
        }

        if (btn !== activeMagneticEl) {
            if (activeMagneticEl) releaseMagnetic(false);
            activeMagneticEl = btn;
            activeMagneticInner = btn.querySelector('span, i, .btn-text') || null;

            cachedRect = btn.getBoundingClientRect();
            magneticCenterX = cachedRect.left + cachedRect.width / 2;
            magneticCenterY = cachedRect.top + cachedRect.height / 2;
            magneticMaxDist = Math.max(cachedRect.width, cachedRect.height) / 2 + 80;

            btn.style.transition = 'none';
            if (activeMagneticInner) activeMagneticInner.style.transition = 'none';
        }
    }

    // 8. Event Delegation for States
    function evaluateHoverState(target) {
        if (!target) return;

        // A. Functional text / code / system cursor elements (keep native cursor, hide custom)
        const textTarget = target.closest(
            'input, textarea, select, [contenteditable="true"], pre, code, #chat-input, [data-native-cursor], .cursor-text, [style*="cursor: text"], [style*="cursor: not-allowed"], [style*="cursor: wait"], [style*="cursor: help"], [disabled], :disabled'
        );
        if (textTarget) {
            isTextInput = true;
            isClickable = false;
            isCardHover = false;
            applyStateClasses();
            return;
        }
        isTextInput = false;

        // B. Contextual Cards (Projects, Featured Projects, Blog Posts)
        const cardTarget = target.closest(
            '[data-cursor-label], [data-cursor="text"], [data-cursor="card"], .project-card, .blog-card'
        );

        // C. Clickable Links & Buttons (takes priority over card label if hovering inner action)
        const clickableTarget = target.closest(
            'a, button, [role="button"], summary, label[for], .btn, input[type="submit"]'
        );

        if (clickableTarget) {
            isClickable = true;
            isCardHover = false;
            checkMagneticCandidate(clickableTarget);
            applyStateClasses();
            return;
        }

        isClickable = false;
        if (activeMagneticEl) releaseMagnetic(true);

        if (cardTarget) {
            isCardHover = true;
            cardLabelText = cardTarget.getAttribute('data-cursor-label') ||
                (cardTarget.classList.contains('blog-card') ? 'READ POST ↗' : 'VIEW PROJECT ↗');
            applyStateClasses();
            return;
        }

        // D. Disable spotlight when modal or case study overlay is active
        const isModalOrOverlayOpen = !!document.querySelector(
            '.modal.show, .case-study-overlay.is-active, .modal-open, .has-modal-open'
        );
        if (glowEl) {
            glowEl.classList.toggle('is-disabled', isModalOrOverlayOpen);
        }

        isCardHover = false;
        applyStateClasses();
    }

    function applyStateClasses() {
        if (!ringEl || !dotEl || !glowEl) return;

        // Visibility
        if (!isPointerInside || isKeyboardNav) {
            dotEl.classList.remove('is-visible');
            ringEl.classList.remove('is-visible');
            glowEl.classList.remove('is-visible');
            return;
        }

        dotEl.classList.add('is-visible');
        ringEl.classList.add('is-visible');
        glowEl.classList.add('is-visible');

        // Text input state: hide dot and ring
        if (isTextInput) {
            dotEl.classList.add('is-hidden');
            ringEl.classList.add('is-hidden');
            return;
        }
        dotEl.classList.remove('is-hidden');
        ringEl.classList.remove('is-hidden');

        // Pressed state
        if (isPressed) {
            ringEl.classList.add('is-pressed');
            dotEl.classList.add('is-pressed');
        } else {
            ringEl.classList.remove('is-pressed');
            dotEl.classList.remove('is-pressed');
        }

        // Card Hover State
        if (isCardHover) {
            ringEl.classList.add('is-hover-card');
            dotEl.classList.add('is-card-hover');
            if (labelEl) labelEl.textContent = cardLabelText;
        } else {
            ringEl.classList.remove('is-hover-card');
            dotEl.classList.remove('is-card-hover');
            if (labelEl) labelEl.textContent = '';
        }

        // Clickable State
        if (isClickable && !isCardHover) {
            ringEl.classList.add('is-hover-clickable');
        } else {
            ringEl.classList.remove('is-hover-clickable');
        }
    }

    // 9. Pointer Event Handlers
    function onPointerMove(e) {
        targetX = e.clientX;
        targetY = e.clientY;
        lastPointerMoveTime = performance.now();

        if (!hasReceivedPointer) {
            hasReceivedPointer = true;
            dotX = targetX;
            dotY = targetY;
            ringX = targetX;
            ringY = targetY;
            glowX = targetX;
            glowY = targetY;
        }

        if (isKeyboardNav) {
            isKeyboardNav = false;
            document.documentElement.classList.add('has-custom-cursor');
        }

        if (!isPointerInside) {
            isPointerInside = true;
            applyStateClasses();
        }

        wakeLoop();
    }

    function onPointerOver(e) {
        evaluateHoverState(e.target);
    }

    function onPointerDown() {
        isPressed = true;
        applyStateClasses();
        wakeLoop();
    }

    function onPointerUp() {
        isPressed = false;
        applyStateClasses();
        wakeLoop();
    }

    function onPointerLeave() {
        isPointerInside = false;
        if (activeMagneticEl) releaseMagnetic(false);
        applyStateClasses();
    }

    function onWindowBlur() {
        isPointerInside = false;
        if (activeMagneticEl) releaseMagnetic(false);
        applyStateClasses();
    }

    function onKeyDown(e) {
        if (e.key === 'Tab') {
            isKeyboardNav = true;
            document.documentElement.classList.remove('has-custom-cursor');
            if (activeMagneticEl) releaseMagnetic(false);
            applyStateClasses();
        }
    }

    function onVisibilityChange() {
        if (document.hidden) {
            isLoopRunning = false;
            if (activeMagneticEl) releaseMagnetic(false);
        } else {
            lastPointerMoveTime = performance.now();
            wakeLoop();
        }
    }

    function onWindowResize() {
        if (activeMagneticEl) {
            cachedRect = activeMagneticEl.getBoundingClientRect();
            magneticCenterX = cachedRect.left + cachedRect.width / 2;
            magneticCenterY = cachedRect.top + cachedRect.height / 2;
        }
    }

    // 10. Lifecycle Management & Dynamic Query Watcher
    function init() {
        try {
            buildElements();

            window.addEventListener('pointermove', onPointerMove, { passive: true });
            document.addEventListener('pointerover', onPointerOver, { passive: true });
            window.addEventListener('pointerdown', onPointerDown, { passive: true });
            window.addEventListener('pointerup', onPointerUp, { passive: true });
            document.addEventListener('pointerleave', onPointerLeave, { passive: true });
            window.addEventListener('blur', onWindowBlur, { passive: true });
            document.addEventListener('keydown', onKeyDown, { passive: true });
            document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
            window.addEventListener('resize', onWindowResize, { passive: true });

            // Watch for environment changes (connecting mouse / toggling reduced motion)
            hoverQuery.addEventListener('change', checkSupport);
            motionQuery.addEventListener('change', checkSupport);
        } catch (e) {
            console.warn('[Cursor] Fallback to native cursor:', e);
            removeElements();
        }
    }

    function teardown() {
        window.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerover', onPointerOver);
        window.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('blur', onWindowBlur);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('resize', onWindowResize);
        removeElements();
    }

    function checkSupport() {
        if (!hoverQuery.matches || motionQuery.matches) {
            teardown();
        } else if (!dotEl) {
            init();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
