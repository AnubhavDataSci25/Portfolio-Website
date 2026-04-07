document.addEventListener('DOMContentLoaded', () => {
    // --- Typing Effect for Hero Section ---
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
        const words = ["Aspiring Data Analyst", "Data Science Enthusiast", "Insight Seeker"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentWord = words[wordIndex];
            if (isDeleting) {
                typingElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                typingElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typeSpeed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }
        type();
    }

    // --- Dark Mode Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-fade-in').forEach(el => {
        observer.observe(el);
    });

    // --- Navbar dynamic background on scroll ---
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('mainNav');
        if (window.scrollY > 50) {
            nav.classList.add('py-2', 'bg-white', 'shadow-sm');
        } else {
            nav.classList.remove('py-2', 'bg-white', 'shadow-sm');
        }
    });
});

document.getElementById('contactForm').addEventListener('submit', function(event) {
event.preventDefault();

// Basic Frontend Validation
const name = document.getElementById('fullName').value.trim();
const email = document.getElementById('emailAddr').value.trim();
const message = document.getElementById('message').value.trim();

if (name && email && message) {
    // Success feedback using a custom UI alert (replacing browser alerts)
    const successMsg = document.createElement('div');
    successMsg.className = 'alert alert-success mt-4 animate-fade-in shadow-sm rounded-pill py-2';
    successMsg.innerHTML = '<i class="fas fa-check-circle me-2"></i> Thank you, ' + name + '! Your message has been sent successfully.';
    
    const form = document.getElementById('contactForm');
    form.parentElement.appendChild(successMsg);
    
    // Clear form
    form.reset();
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        successMsg.style.opacity = '0';
        setTimeout(() => successMsg.remove(), 6000);
    }, 5000);
}
});

// EmailJS Integration for Contact Form
(function(){
emailjs.init("bHA0zHbNhtt2JnLH1");
})();

document.getElementById("contactForm").addEventListener("submit", function(e) {
e.preventDefault();

emailjs.sendForm("service_oa59x3h", "template_yf1rj3k", this)
    .then(function() {
    alert("Message sent successfully!");
    }, function(error) {
    alert("Failed to send message. Try again.");
    });
});