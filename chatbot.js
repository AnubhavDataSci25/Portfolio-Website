/**
 * CHATBOT.JS - Production Upgraded Conversational AI Widget
 * Single Source of Truth: Dynamically mounts the entire widget into #portfolio-chatbot
 * Multi-turn history, Safe Markdown formatting, Streamlined mobile bottom sheet,
 * Session persistence, WCAG AA accessibility, Reduced motion compliance.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'ay_chat_session_v2';
    const TEASER_KEY = 'ay_chat_teaser_dismissed_v2';
    const MAX_HISTORY = 6;
    const MAX_STORED_MSGS = 30;
    const MAX_CHAR_LIMIT = 500;
    const REQUEST_TIMEOUT_MS = 20000;

    const isMobile = () => window.matchMedia('(max-width: 575.98px)').matches;
    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Helper: Safe HTML Escaping
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Helper: Safe Markdown Formatter (bold, italic, code, lists, linebreaks, safe links)
    function formatBotMarkdown(rawText) {
        if (!rawText) return '';
        const escaped = escapeHtml(rawText);

        // 1. Fenced Code Blocks (```code```)
        let out = escaped.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // 2. Inline Code (`code`)
        out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

        // 3. Bold (**text**)
        out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

        // 4. Italic (*text* or _text_)
        out = out.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
        out = out.replace(/\b_([^_\n]+)_\b/g, '<em>$1</em>');

        // 5. Links [text](url) - strictly whitelist https:, mailto:, tel:
        out = out.replace(/\[([^\]]+)\]\(((?:https:\/\/|mailto:|tel:)[^\s)]+)\)/g, (match, txt, url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
        });

        // 6. Lists (bullet and numbered)
        const lines = out.split('\n');
        const formatted = [];
        let inUl = false;
        let inOl = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
            const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

            if (ulMatch) {
                if (inOl) { formatted.push('</ol>'); inOl = false; }
                if (!inUl) { formatted.push('<ul>'); inUl = true; }
                formatted.push(`<li>${ulMatch[2]}</li>`);
            } else if (olMatch) {
                if (inUl) { formatted.push('</ul>'); inUl = false; }
                if (!inOl) { formatted.push('<ol>'); inOl = true; }
                formatted.push(`<li>${olMatch[2]}</li>`);
            } else {
                if (inUl) { formatted.push('</ul>'); inUl = false; }
                if (inOl) { formatted.push('</ol>'); inOl = false; }
                formatted.push(line);
            }
        }
        if (inUl) formatted.push('</ul>');
        if (inOl) formatted.push('</ol>');

        // 7. Paragraphs & Line Breaks
        const joined = formatted.join('\n');
        const paragraphs = joined.split(/\n{2,}/);
        return paragraphs.map(p => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
                return trimmed;
            }
            return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        }).filter(Boolean).join('');
    }

    // Helper: Format Time (e.g. 2:45 PM)
    function getFormattedTime() {
        try {
            return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date());
        } catch (e) {
            return '';
        }
    }

    // Keyword detection for contextual actions & chips
    const HIRING_KEYWORDS = /(hir(e|ing)|pric(e|ing)|cost|quot(e|ation)|rate|contact|freelance|reach out|talk)/i;
    const PROJECT_KEYWORDS = /(project|rag|ml|ai|vector|groq|llama|nlp|pipeline)/i;
    const SKILL_KEYWORDS = /(skill|tech|stack|python|docker|cloud|bigquery|database)/i;

    function getContextualChips(lastText) {
        if (HIRING_KEYWORDS.test(lastText)) {
            return [
                "Chat on WhatsApp",
                "View Services & Rates",
                "How do we start a project?"
            ];
        }
        if (PROJECT_KEYWORDS.test(lastText)) {
            return [
                "Tell me more about CLAT Oracle AI",
                "Show me the Legal RAG Assistant",
                "How can I hire you?"
            ];
        }
        if (SKILL_KEYWORDS.test(lastText)) {
            return [
                "What are your best ML projects?",
                "What services do you offer?",
                "How can I hire you?"
            ];
        }
        return [
            "What services do you offer?",
            "Show me your top projects",
            "How can I hire you?"
        ];
    }

    // Session State Management
    function loadSession() {
        try {
            const data = sessionStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {}
        return {
            isOpen: false,
            messages: [],
            unreadCount: 0
        };
    }

    function saveSession(state) {
        try {
            const toSave = {
                isOpen: state.isOpen,
                unreadCount: state.unreadCount,
                messages: state.messages.slice(-MAX_STORED_MSGS)
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {}
    }

    // Initialize Widget
    function mountChatbot() {
        const mount = document.getElementById('portfolio-chatbot');
        if (!mount || mount.dataset.mounted === 'true') return;
        mount.dataset.mounted = 'true';

        const sessionState = loadSession();
        let isWaitingResponse = false;
        let lastUserMessage = '';
        let previousScrollY = 0;

        // Build Complete Widget HTML
        mount.innerHTML = `
            <!-- Mobile Dimmed Backdrop -->
            <div id="chat-backdrop" aria-hidden="true"></div>

            <!-- Greeting Teaser Bubble -->
            <div id="chat-teaser" class="d-none" role="status" aria-live="polite">
                <span class="chat-teaser-text">Hi! Ask me about Anubhav's work or hiring</span>
                <button type="button" class="chat-teaser-close" aria-label="Dismiss greeting">&times;</button>
            </div>

            <!-- Floating Launcher Button -->
            <button id="chat-trigger" class="chat-attention-pulse" aria-label="Open AI Assistant" aria-haspopup="dialog" aria-expanded="false">
                <i class="fas fa-comment-dots chat-trigger-icon chat-trigger-icon-open" aria-hidden="true"></i>
                <i class="fas fa-times chat-trigger-icon chat-trigger-icon-close" aria-hidden="true"></i>
                <span class="chat-unread-badge d-none" id="chat-unread-badge">0</span>
            </button>

            <!-- Main Chat Window -->
            <div id="chat-window" class="is-closed d-none shadow-lg" role="dialog" aria-label="Anubhav's AI Assistant" aria-modal="false">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header-profile">
                        <div class="bot-avatar">
                            <img src="images/profile.jpg" alt="Anubhav Yadav" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
                            <span style="display: none;">AY</span>
                        </div>
                        <div>
                            <h2 class="chat-header-title">Anubhav's AI Assistant</h2>
                            <div class="chat-header-subtitle">
                                <span class="chat-status-dot" aria-hidden="true"></span>
                                <span>Typically replies instantly</span>
                            </div>
                        </div>
                    </div>
                    <div class="chat-header-controls">
                        <button type="button" id="chat-clear-btn" class="chat-header-btn" aria-label="Clear chat conversation" title="Clear chat">
                            <i class="fas fa-trash-alt" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="chat-minimize-btn" class="chat-header-btn" aria-label="Minimize chat" title="Minimize">
                            <i class="fas fa-minus" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="close-chat" class="chat-header-btn" aria-label="Close chat" title="Close">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>

                    <!-- Clear Confirmation Step Popover -->
                    <div id="chat-clear-confirm" class="chat-clear-confirm d-none" role="alertdialog" aria-label="Confirm clear conversation">
                        <span>Clear conversation history?</span>
                        <div class="chat-clear-confirm-actions">
                            <button type="button" id="chat-clear-cancel" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 11px;">Cancel</button>
                            <button type="button" id="chat-clear-yes" class="btn btn-sm btn-danger py-0 px-2" style="font-size: 11px;">Clear</button>
                        </div>
                    </div>
                </div>

                <!-- Chat Body (Messages) -->
                <div id="chat-messages" class="chat-body" role="log" aria-live="polite" aria-relevant="additions text">
                    <div class="chat-date-divider">
                        <span>Today</span>
                    </div>
                </div>

                <!-- Scroll to bottom button -->
                <button type="button" id="chat-scroll-bottom" class="d-none" aria-label="Scroll to newest message">
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </button>

                <!-- Footer / Input Form -->
                <div class="chat-footer">
                    <div id="chat-offline-banner" class="d-none" role="alert">
                        <i class="fas fa-wifi-slash" aria-hidden="true"></i>
                        <span>You're offline. Reconnecting...</span>
                    </div>

                    <form id="chat-form" novalidate>
                        <div class="chat-input-wrapper">
                            <textarea id="chat-input" rows="1" maxlength="500" placeholder="Ask about projects, skills, or hiring..." aria-label="Chat input message"></textarea>
                            <span id="chat-char-counter" class="chat-char-counter d-none">0 / 500</span>
                            <button type="submit" id="chat-send-btn" aria-label="Send message" disabled>
                                <i class="fas fa-paper-plane" aria-hidden="true"></i>
                            </button>
                        </div>
                    </form>

                    <div class="chat-footer-note">
                        AI-generated answers may be inaccurate. For quotes, <a href="contact.html">contact Anubhav directly</a>.
                    </div>
                </div>
            </div>
        `;

        // Cache DOM Elements
        const trigger = document.getElementById('chat-trigger');
        const windowEl = document.getElementById('chat-window');
        const backdrop = document.getElementById('chat-backdrop');
        const teaser = document.getElementById('chat-teaser');
        const teaserClose = teaser.querySelector('.chat-teaser-close');
        const unreadBadge = document.getElementById('chat-unread-badge');
        const closeBtn = document.getElementById('close-chat');
        const minimizeBtn = document.getElementById('chat-minimize-btn');
        const clearBtn = document.getElementById('chat-clear-btn');
        const clearConfirm = document.getElementById('chat-clear-confirm');
        const clearCancel = document.getElementById('chat-clear-cancel');
        const clearYes = document.getElementById('chat-clear-yes');
        const messagesContainer = document.getElementById('chat-messages');
        const scrollBottomBtn = document.getElementById('chat-scroll-bottom');
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        const charCounter = document.getElementById('chat-char-counter');
        const sendBtn = document.getElementById('chat-send-btn');
        const offlineBanner = document.getElementById('chat-offline-banner');

        // Typing Indicator Element
        let typingIndicatorEl = null;

        function createTypingIndicator() {
            const row = document.createElement('div');
            row.className = 'chat-msg-row bot-row chat-typing-row';
            row.setAttribute('role', 'status');
            row.setAttribute('aria-label', 'Assistant is typing');
            row.innerHTML = `
                <div class="chat-bot-avatar-mini" aria-hidden="true">AY</div>
                <div class="chat-typing-bubble" aria-hidden="true">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            `;
            return row;
        }

        // Toggle Open/Close Window
        function openChat() {
            if (!windowEl.classList.contains('is-closed') && !windowEl.classList.contains('d-none')) return;

            windowEl.classList.remove('is-closed', 'd-none');
            windowEl.classList.add('is-open');
            trigger.classList.add('is-active');
            trigger.setAttribute('aria-expanded', 'true');

            // Hide teaser
            teaser.classList.add('d-none');

            // Clear unread badge
            sessionState.unreadCount = 0;
            unreadBadge.textContent = '0';
            unreadBadge.classList.add('d-none');

            // Mobile Bottom Sheet Handling
            if (isMobile()) {
                windowEl.setAttribute('aria-modal', 'true');
                backdrop.classList.add('is-active');
                previousScrollY = window.scrollY;
                document.body.style.overflow = 'hidden';
                document.body.style.touchAction = 'none';
            } else {
                windowEl.setAttribute('aria-modal', 'false');
            }

            sessionState.isOpen = true;
            saveSession(sessionState);

            // Focus textarea after smooth scale
            setTimeout(() => {
                input.focus();
                scrollToBottom(false);
            }, 250);

            // Analytics Hook
            window.dispatchEvent(new CustomEvent('chatbot:open'));
        }

        function closeChat() {
            if (windowEl.classList.contains('is-closed') || windowEl.classList.contains('d-none')) return;

            windowEl.classList.remove('is-open');
            windowEl.classList.add('is-closed', 'd-none');
            trigger.classList.remove('is-active');
            trigger.setAttribute('aria-expanded', 'false');
            backdrop.classList.remove('is-active');

            if (clearConfirm) clearConfirm.classList.add('d-none');

            // Restore body scroll on mobile
            if (isMobile()) {
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
                window.scrollTo(0, previousScrollY);
            }

            sessionState.isOpen = false;
            saveSession(sessionState);

            trigger.focus();

            // Analytics Hook
            window.dispatchEvent(new CustomEvent('chatbot:close'));
        }

        trigger.addEventListener('click', () => {
            if (windowEl.classList.contains('is-open')) {
                closeChat();
            } else {
                openChat();
            }
        });

        closeBtn.addEventListener('click', closeChat);
        minimizeBtn.addEventListener('click', closeChat);
        backdrop.addEventListener('click', closeChat);

        // Clear Chat History Confirmation
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearConfirm.classList.toggle('d-none');
        });

        clearCancel.addEventListener('click', () => {
            clearConfirm.classList.add('d-none');
        });

        clearYes.addEventListener('click', () => {
            clearConfirm.classList.add('d-none');
            sessionState.messages = [];
            sessionState.unreadCount = 0;
            saveSession(sessionState);
            renderAllMessages();
        });

        document.addEventListener('click', (e) => {
            if (clearConfirm && !clearConfirm.contains(e.target) && e.target !== clearBtn) {
                clearConfirm.classList.add('d-none');
            }
        });

        // Keyboard Handling (Esc closes, Tab trap on mobile)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && windowEl.classList.contains('is-open')) {
                closeChat();
            }
        });

        // Visual Viewport Sync for Mobile Keyboard
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                if (isMobile() && windowEl.classList.contains('is-open')) {
                    const offset = window.innerHeight - window.visualViewport.height;
                    if (offset > 100) {
                        windowEl.style.height = `${window.visualViewport.height}px`;
                        scrollToBottom(false);
                    } else {
                        windowEl.style.height = '';
                    }
                }
            });
        }

        // Greeting Teaser Logic (appears 6-8s after load, once per session)
        function initTeaser() {
            if (sessionStorage.getItem(TEASER_KEY) || sessionState.isOpen) return;

            const delay = 6000 + Math.random() * 2000;
            setTimeout(() => {
                if (!sessionState.isOpen && !sessionStorage.getItem(TEASER_KEY)) {
                    teaser.classList.remove('d-none');
                }
            }, delay);
        }

        teaser.addEventListener('click', (e) => {
            if (e.target.closest('.chat-teaser-close')) return;
            sessionStorage.setItem(TEASER_KEY, 'true');
            teaser.classList.add('d-none');
            openChat();
        });

        teaserClose.addEventListener('click', (e) => {
            e.stopPropagation();
            sessionStorage.setItem(TEASER_KEY, 'true');
            teaser.classList.add('d-none');
        });

        // Online / Offline Detection
        function syncOnlineStatus() {
            if (navigator.onLine) {
                offlineBanner.classList.add('d-none');
            } else {
                offlineBanner.classList.remove('d-none');
            }
        }
        window.addEventListener('online', syncOnlineStatus);
        window.addEventListener('offline', syncOnlineStatus);
        syncOnlineStatus();

        // Textarea Auto-Growing & Character Counter
        input.addEventListener('input', () => {
            // Auto grow
            input.style.height = 'auto';
            const newHeight = Math.min(input.scrollHeight, 110);
            input.style.height = `${newHeight}px`;

            // Char counter
            const len = input.value.length;
            if (len > 400) {
                charCounter.classList.remove('d-none');
                charCounter.textContent = `${len} / 500`;
                if (len >= 480) {
                    charCounter.className = 'chat-char-counter is-danger';
                } else {
                    charCounter.className = 'chat-char-counter is-warning';
                }
            } else {
                charCounter.classList.add('d-none');
            }

            // Enable / Disable Send
            sendBtn.disabled = !input.value.trim() || isWaitingResponse;
        });

        // Enter submits (Shift+Enter newline)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });

        // Scroll to Bottom Handler & Scroll-To-Latest Button
        function scrollToBottom(smooth = true) {
            if (!messagesContainer) return;
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto'
            });
        }

        messagesContainer.addEventListener('scroll', () => {
            const distance = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
            if (distance > 120) {
                scrollBottomBtn.classList.remove('d-none');
            } else {
                scrollBottomBtn.classList.add('d-none');
            }
        });

        scrollBottomBtn.addEventListener('click', () => {
            scrollToBottom(true);
        });

        // Copy-to-Clipboard Handler
        function handleCopy(btn, rawText) {
            if (!navigator.clipboard) {
                const ta = document.createElement('textarea');
                ta.value = rawText;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch (err) {}
                document.body.removeChild(ta);
            } else {
                navigator.clipboard.writeText(rawText);
            }

            btn.classList.add('copied');
            btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
            btn.setAttribute('title', 'Copied!');

            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<i class="fas fa-clone" aria-hidden="true"></i>';
                btn.setAttribute('title', 'Copy response');
            }, 2000);
        }

        // Render Action Buttons under Bot Messages
        function renderActionButtons(container) {
            const row = document.createElement('div');
            row.className = 'chat-action-row';
            row.innerHTML = `
                <a href="https://wa.me/919105579003" target="_blank" rel="noopener noreferrer" class="chat-action-btn whatsapp-action">
                    <i class="fab fa-whatsapp" aria-hidden="true"></i> Chat on WhatsApp
                </a>
                <a href="contact.html" class="chat-action-btn contact-action">
                    <i class="fas fa-envelope" aria-hidden="true"></i> Open Contact Form
                </a>
                <a href="services.html" class="chat-action-btn services-action">
                    <i class="fas fa-briefcase" aria-hidden="true"></i> View Services & Rates
                </a>
            `;
            container.appendChild(row);
        }

        // Render Suggestion Chips
        function renderSuggestionChips(chips, isInitial = false) {
            // Remove existing chip row if any
            const existing = messagesContainer.querySelector('.chat-suggestions-container');
            if (existing) existing.remove();

            if (!chips || chips.length === 0) return;

            const container = document.createElement('div');
            container.className = 'chat-suggestions-container';
            if (!isInitial) {
                container.innerHTML = `<div class="chat-suggestions-title">Suggested follow-ups</div>`;
            }

            const chipRow = document.createElement('div');
            chipRow.className = 'chat-suggestions-chips';

            chips.forEach(text => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'chat-suggestion-chip';
                chip.textContent = text;
                chip.addEventListener('click', () => {
                    input.value = text;
                    container.remove();
                    window.dispatchEvent(new CustomEvent('chatbot:chip-click', { detail: { text } }));
                    form.dispatchEvent(new Event('submit'));
                });
                chipRow.appendChild(chip);
            });

            container.appendChild(chipRow);
            messagesContainer.appendChild(container);
            scrollToBottom();
        }

        // Render Message Row in DOM
        function renderMessageDOM(msg, options = {}) {
            const { isNew = false, animateTypewriter = false } = options;
            const row = document.createElement('div');
            row.className = `chat-msg-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`;
            row.id = `chat-msg-${msg.id}`;

            const bubbleContainer = document.createElement('div');
            bubbleContainer.className = 'chat-bubble-container';

            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`;

            if (msg.sender === 'bot') {
                const avatar = document.createElement('div');
                avatar.className = 'chat-bot-avatar-mini';
                avatar.setAttribute('aria-hidden', 'true');
                avatar.innerHTML = `<img src="images/profile.jpg" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" loading="lazy"><span style="display:none;">AY</span>`;
                row.appendChild(avatar);

                // Copy button
                const copyBtn = document.createElement('button');
                copyBtn.type = 'button';
                copyBtn.className = 'chat-copy-btn';
                copyBtn.setAttribute('aria-label', 'Copy response to clipboard');
                copyBtn.setAttribute('title', 'Copy response');
                copyBtn.innerHTML = '<i class="fas fa-clone" aria-hidden="true"></i>';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleCopy(copyBtn, msg.text);
                });
                bubbleContainer.appendChild(copyBtn);

                // Typewriter effect on new bot messages
                if (isNew && animateTypewriter && !prefersReducedMotion()) {
                    bubble.innerHTML = '';
                    bubbleContainer.appendChild(bubble);
                    row.appendChild(bubbleContainer);
                    messagesContainer.appendChild(row);

                    const fullFormattedHtml = formatBotMarkdown(msg.text);
                    const words = msg.text.split(' ');
                    let currentWordIdx = 0;
                    let isSkipped = false;

                    const skipTypewriter = () => {
                        isSkipped = true;
                        bubble.innerHTML = fullFormattedHtml;
                        bubble.removeEventListener('click', skipTypewriter);
                        if (msg.showActions) renderActionButtons(bubbleContainer);
                        scrollToBottom();
                    };

                    bubble.addEventListener('click', skipTypewriter);

                    const typeInterval = setInterval(() => {
                        if (isSkipped) {
                            clearInterval(typeInterval);
                            return;
                        }
                        currentWordIdx += 2;
                        if (currentWordIdx >= words.length) {
                            clearInterval(typeInterval);
                            bubble.innerHTML = fullFormattedHtml;
                            bubble.removeEventListener('click', skipTypewriter);
                            if (msg.showActions) renderActionButtons(bubbleContainer);
                            scrollToBottom();
                        } else {
                            bubble.textContent = words.slice(0, currentWordIdx).join(' ') + ' ...';
                            scrollToBottom(false);
                        }
                    }, 35);

                } else {
                    bubble.innerHTML = formatBotMarkdown(msg.text);
                    bubbleContainer.appendChild(bubble);
                    if (msg.showActions) {
                        renderActionButtons(bubbleContainer);
                    }
                    row.appendChild(bubbleContainer);
                    messagesContainer.appendChild(row);
                }
            } else {
                bubble.textContent = msg.text;
                bubbleContainer.appendChild(bubble);
                row.appendChild(bubbleContainer);
                messagesContainer.appendChild(row);
            }

            // Timestamp
            if (msg.time) {
                const timeEl = document.createElement('div');
                timeEl.className = 'chat-msg-time';
                timeEl.textContent = msg.time;
                bubbleContainer.appendChild(timeEl);
            }

            scrollToBottom();
        }

        // Render Error Bubble with Retry
        function renderErrorDOM(errorText, retryText) {
            const row = document.createElement('div');
            row.className = 'chat-msg-row bot-row';

            const avatar = document.createElement('div');
            avatar.className = 'chat-bot-avatar-mini';
            avatar.innerHTML = `<span style="font-weight: bold;">!</span>`;

            const container = document.createElement('div');
            container.className = 'chat-bubble-container';

            const errorBubble = document.createElement('div');
            errorBubble.className = 'chat-error-bubble';
            errorBubble.innerHTML = `
                <div><i class="fas fa-exclamation-circle me-1"></i> ${escapeHtml(errorText)}</div>
                <button type="button" class="chat-retry-btn">
                    <i class="fas fa-redo-alt" aria-hidden="true"></i> Retry
                </button>
            `;

            errorBubble.querySelector('.chat-retry-btn').addEventListener('click', () => {
                row.remove();
                if (retryText) {
                    input.value = retryText;
                    form.dispatchEvent(new Event('submit'));
                }
            });

            container.appendChild(errorBubble);
            row.appendChild(avatar);
            row.appendChild(container);
            messagesContainer.appendChild(row);
            scrollToBottom();
        }

        // Render All Messages from Session
        function renderAllMessages() {
            messagesContainer.innerHTML = `
                <div class="chat-date-divider">
                    <span>Today</span>
                </div>
            `;

            if (sessionState.messages.length === 0) {
                // Add default welcome message
                const welcomeMsg = {
                    id: 'welcome',
                    sender: 'bot',
                    text: "Hello! I'm Anubhav's AI assistant. Ask me anything about his projects, skills, or hiring!",
                    time: getFormattedTime(),
                    showActions: false
                };
                sessionState.messages.push(welcomeMsg);
                saveSession(sessionState);
                renderMessageDOM(welcomeMsg, { isNew: false });
                renderSuggestionChips([
                    "What services do you offer?",
                    "Show me your best projects",
                    "What are your skills?",
                    "How can I hire you?"
                ], true);
            } else {
                sessionState.messages.forEach(msg => {
                    renderMessageDOM(msg, { isNew: false });
                });
                const lastMsg = sessionState.messages[sessionState.messages.length - 1];
                if (lastMsg && lastMsg.sender === 'bot') {
                    renderSuggestionChips(getContextualChips(lastMsg.text), false);
                }
            }
        }

        // Handle Form Submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text || isWaitingResponse) return;

            if (text.length > MAX_CHAR_LIMIT) {
                renderErrorDOM("Message is too long. Please keep your message under 500 characters.", text);
                return;
            }

            lastUserMessage = text;

            // Remove previous suggestion chips
            const chips = messagesContainer.querySelector('.chat-suggestions-container');
            if (chips) chips.remove();

            // 1. Add User Message
            const userMsg = {
                id: Date.now().toString(),
                sender: 'user',
                text: text,
                time: getFormattedTime()
            };
            sessionState.messages.push(userMsg);
            saveSession(sessionState);
            renderMessageDOM(userMsg, { isNew: true });

            // Clear Input
            input.value = '';
            input.style.height = 'auto';
            charCounter.classList.add('d-none');
            sendBtn.disabled = true;

            // Show Typing Indicator
            isWaitingResponse = true;
            sendBtn.innerHTML = '<span class="chat-send-spinner" aria-hidden="true"></span>';
            typingIndicatorEl = createTypingIndicator();
            messagesContainer.appendChild(typingIndicatorEl);
            scrollToBottom();

            // Analytics Hook
            window.dispatchEvent(new CustomEvent('chatbot:message', { detail: { sender: 'user', text } }));

            // 2. Prepare Multi-turn History (last 6 turns)
            const recentHistory = sessionState.messages
                .slice(-MAX_HISTORY - 1, -1)
                .map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    text: m.text.slice(0, 500)
                }));

            // 3. Send API Request with AbortController Timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            const isFileProtocol = window.location.protocol === 'file:';

            // Endpoint Resolution:
            // - file:/// origin blocks relative '/api/chat'; route directly to local backend on port 5000.
            // - http:/https: uses '/api/chat', falling back to localhost:5000 if running a static dev server (e.g. Live Server).
            const candidateEndpoints = isFileProtocol
                ? ['http://localhost:5000/api/chat', 'http://127.0.0.1:5000/api/chat']
                : ['/api/chat', 'http://localhost:5000/api/chat'];

            try {
                let response = null;
                let lastFetchError = null;

                for (const endpoint of candidateEndpoints) {
                    try {
                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: text,
                                history: recentHistory
                            }),
                            signal: controller.signal
                        });
                        if (res.ok || (res.status !== 404 && res.status !== 502)) {
                            response = res;
                            break;
                        }
                    } catch (fErr) {
                        lastFetchError = fErr;
                        if (fErr.name === 'AbortError') throw fErr;
                    }
                }

                if (!response) {
                    if (lastFetchError) throw lastFetchError;
                    throw new Error("Unable to connect to chatbot server.");
                }

                clearTimeout(timeoutId);

                if (typingIndicatorEl) {
                    typingIndicatorEl.remove();
                    typingIndicatorEl = null;
                }
                isWaitingResponse = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>';
                sendBtn.disabled = !input.value.trim();

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    let errMsg = data.error || (response.status === 429 
                        ? "You're sending messages too fast. Please wait a minute before sending another message." 
                        : "Something went wrong on our end. Please try again.");
                    renderErrorDOM(errMsg, lastUserMessage);
                    return;
                }

                const botReplyText = data.reply || "I'm sorry, I couldn't formulate a response. Please try asking again.";
                const shouldShowActions = HIRING_KEYWORDS.test(text) || HIRING_KEYWORDS.test(botReplyText);

                const botMsg = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: botReplyText,
                    time: getFormattedTime(),
                    showActions: shouldShowActions
                };

                sessionState.messages.push(botMsg);

                // If window closed while bot answered, bump unread badge
                if (windowEl.classList.contains('is-closed')) {
                    sessionState.unreadCount = (sessionState.unreadCount || 0) + 1;
                    unreadBadge.textContent = sessionState.unreadCount;
                    unreadBadge.classList.remove('d-none');
                }

                saveSession(sessionState);

                // Render with typewriter effect
                renderMessageDOM(botMsg, { isNew: true, animateTypewriter: true });

                // Render follow-up suggestion chips
                setTimeout(() => {
                    renderSuggestionChips(getContextualChips(botReplyText), false);
                }, 400);

                // Analytics Hook
                window.dispatchEvent(new CustomEvent('chatbot:message', { detail: { sender: 'bot', text: botReplyText } }));

            } catch (err) {
                clearTimeout(timeoutId);
                if (typingIndicatorEl) {
                    typingIndicatorEl.remove();
                    typingIndicatorEl = null;
                }
                isWaitingResponse = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i>';
                sendBtn.disabled = !input.value.trim();

                let errorMsg = "The assistant is currently offline or unreachable. Please try again shortly.";
                if (err.name === 'AbortError') {
                    errorMsg = "The request timed out. Please check your connection and retry.";
                } else if (!navigator.onLine) {
                    errorMsg = "You appear to be offline. Please check your internet connection.";
                } else if (isFileProtocol) {
                    errorMsg = "Local Setup Notice: You are viewing this page directly via local files (`file:///`). Browsers block API requests on `file://`. To chat with the AI assistant locally, run `npm start` in the `chatbot-backend` folder and open http://localhost:5000, or view the live deployed site.";
                }
                renderErrorDOM(errorMsg, lastUserMessage);
            }
        });

        // Initial Render
        renderAllMessages();
        initTeaser();

        // Restore Open State if user was in chat before navigating
        if (sessionState.isOpen) {
            openChat();
        } else if (sessionState.unreadCount > 0) {
            unreadBadge.textContent = sessionState.unreadCount;
            unreadBadge.classList.remove('d-none');
        }
    }

    // Lazy Initialization: RequestIdleCallback with fallback after page load
    function init() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(mountChatbot, { timeout: 800 });
        } else {
            setTimeout(mountChatbot, 200);
        }
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init, { once: true });
    }
})();