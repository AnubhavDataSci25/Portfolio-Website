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

    // Render Quick Suggestion Pills
    if (messagesContainer && !messagesContainer.querySelector('.chat-suggestions')) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'chat-suggestions d-flex flex-wrap gap-1 mt-2';
        const suggestions = [
            "What are your services?",
            "Tell me about your top projects",
            "How can I contact you?"
        ];
        suggestions.forEach(text => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'btn btn-outline-primary btn-sm rounded-pill chat-suggestion-chip';
            chip.textContent = text;
            chip.addEventListener('click', () => {
                if (input) {
                    input.value = text;
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            });
            suggestionsDiv.appendChild(chip);
        });
        messagesContainer.appendChild(suggestionsDiv);
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