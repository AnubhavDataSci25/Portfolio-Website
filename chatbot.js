document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('chat-trigger');
    const windowEl = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-chat');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    if (input) {
        input.maxLength = 500;
    }

    // Toggle Chat Window
    if (trigger && windowEl) {
        trigger.addEventListener('click', () => {
            windowEl.classList.toggle('d-none');
            if (!windowEl.classList.contains('d-none') && input) {
                input.focus();
            }
        });
    }

    if (closeBtn && windowEl) {
        closeBtn.addEventListener('click', () => {
            windowEl.classList.add('d-none');
        });
    }

    // Handle Form Submission
    if (form && input) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;

            if (text.length > 500) {
                addMessage(text, 'user');
                input.value = '';
                addMessage("Message is too long. Please keep your message under 500 characters.", 'bot');
                scrollToBottom();
                return;
            }

            addMessage(text, 'user');
            input.value = '';
            typingIndicator.classList.remove('d-none');
            scrollToBottom();

            try {
                // Pointing to relative Vercel API path
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                const data = await response.json();
                typingIndicator.classList.add('d-none');

                if (!response.ok) {
                    const errorMsg = data.error || (response.status === 429 
                        ? "Too many requests. Please wait a minute before sending another message." 
                        : "Something went wrong. Please try again later.");
                    addMessage(errorMsg, 'bot');
                } else {
                    addMessage(data.reply || "I'm sorry, I couldn't process that right now.", 'bot');
                }

            } catch (error) {
                typingIndicator.classList.add('d-none');
                addMessage("The assistant is currently offline. Please try again later.", 'bot');
            }
        });
    }

    function addMessage(text, sender) {
        if (!messagesContainer) return;
        const div = document.createElement('div');
        div.className = `message ${sender}-msg`;
        div.textContent = text;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        if (!messagesContainer) return;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});