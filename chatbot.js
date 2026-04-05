document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('chat-trigger');
    const windowEl = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-chat');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    // Toggle Chat Window
    trigger.addEventListener('click', () => {
        windowEl.classList.toggle('d-none');
        if (!windowEl.classList.contains('d-none')) {
            input.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('d-none');
    });

    // Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';
        typingIndicator.classList.remove('d-none');
        scrollToBottom();

        try {
            // UPDATED: Pointing to relative Vercel API path
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            typingIndicator.classList.add('d-none');
            addMessage(data.reply || data.error, 'bot');

        } catch (error) {
            typingIndicator.classList.add('d-none');
            addMessage("The assistant is currently offline. Please try again later.", 'bot');
        }
    });

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}-msg`;
        div.textContent = text;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});