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
                typeSpeed = 2000;
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
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            document.documentElement.setAttribute('data-theme', currentTheme);
            themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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
    }

    // --- Scroll Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-fade-in').forEach(el => observer.observe(el));

    // --- Navbar Scroll ---
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('mainNav');
        if (nav) {
            window.scrollY > 50 ? nav.classList.add('py-2', 'bg-white', 'shadow-sm') : nav.classList.remove('py-2', 'bg-white', 'shadow-sm');
        }
    });

    // --- Project Case Study Logic ---
    const projectData = {
        'kaushal-ai': {
            title: "Kaushal AI",
            tagline: "Flagship AI Career Recommendation System",
            description: "Kaushal AI is an intelligent platform designed to bridge the gap between academic education and industry requirements. By processing multi-dimensional user data, it provides personalized career roadmaps and skill suggestions.",
            objectives: [
                "Develop an automated profiling engine for students and professionals.",
                "Implement a multi-model evaluation system to select the best predictive model dynamically.",
                "Scale recommendations based on a 20,000+ row synthetic career dataset."
            ],
            approach: "We adopted a modular architecture. First, data preprocessing handled sparse feature sets from diverse backgrounds. Then, we trained multiple classifiers (Random Forest, XGBoost, and SVM) and implemented a voting ensemble.",
            results: "The system successfully achieves 92% accuracy in career path matching during validation. It significantly reduces the 'choice paralysis' faced by fresh graduates.",
            stack: ["Python", "Scikit-Learn", "XGBoost", "Pandas", "MLflow"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/Kaushal-AI", icon: "fab fa-github" }]
        },
        'personality-prediction': {
            title: "Personality Prediction System",
            tagline: "NLP-based Behavioral Analysis Tool",
            description: "A research-driven project that utilizes Natural Language Processing to classify personality types (Introvert vs Extrovert) based on digital footprints.",
            objectives: [
                "Extract meaningful linguistic patterns from textual input.",
                "Build a classification model using advanced NLP techniques.",
                "Integrate Generative AI to provide personalized improvement tips."
            ],
            approach: "Utilized NLTK and SpaCy for deep text preprocessing. We implemented a Flask-based backend to serve the model and used the Gemini API for feedback generation.",
            results: "Delivered a user-friendly application that provides instant psychological insights with high predictive reliability.",
            stack: ["NLP", "Flask", "NLTK", "GenAI", "Python"],
            links: [{ label: "View Code", url: "https://github.com/AnubhavDataSci25/Introvert-vs-Extrovert-Classification-Project", icon: "fab fa-github" }]
        }
    };

    const modal = document.getElementById('caseStudyModal');
    const closeBtn = document.getElementById('closeCaseStudy');
    const openBtns = document.querySelectorAll('.open-case-study');

    if (modal && openBtns.length > 0) {
        const openModal = (projectId) => {
            const data = projectData[projectId];
            if (!data) return;

            document.getElementById('modalTitle').textContent = data.title;
            document.getElementById('modalTagline').textContent = data.tagline;
            document.getElementById('modalDescription').textContent = data.description;
            document.getElementById('modalApproach').textContent = data.approach;
            document.getElementById('modalResults').textContent = data.results;

            const objList = document.getElementById('modalObjectives');
            objList.innerHTML = '';
            data.objectives.forEach(obj => {
                const li = document.createElement('li');
                li.className = "mb-2";
                li.textContent = obj;
                objList.appendChild(li);
            });

            const stackDiv = document.getElementById('modalStack');
            stackDiv.innerHTML = '';
            data.stack.forEach(tech => {
                const span = document.createElement('span');
                span.className = "badge rounded-pill bg-primary px-3 py-2 small";
                span.textContent = tech;
                stackDiv.appendChild(span);
            });

            const linksDiv = document.getElementById('modalLinks');
            linksDiv.innerHTML = '';
            data.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = "_blank";
                a.className = "btn btn-sm btn-outline-primary rounded-pill text-start w-100 mb-2";
                a.innerHTML = `<i class="${link.icon} me-2"></i> ${link.label}`;
                linksDiv.appendChild(a);
            });

            modal.classList.remove('d-none');
            document.body.classList.add('modal-open');
        };

        const closeModal = () => {
            modal.classList.add('d-none');
            document.body.classList.remove('modal-open');
        };

        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-project');
                openModal(id);
            });
        });

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
});

// --- Contact Form Handling ---
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    // Init EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("bHA0zHbNhtt2JnLH1");
    }

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('emailAddr').value.trim();
        const message = document.getElementById('message').value.trim();

        if (name && email && message) {
            // Send via EmailJS
            emailjs.sendForm("service_oa59x3h", "template_yf1rj3k", this)
                .then(() => {
                    const successMsg = document.createElement('div');
                    successMsg.className = 'alert alert-success mt-4 animate-fade-in shadow-sm rounded-pill py-2';
                    successMsg.innerHTML = `<i class="fas fa-check-circle me-2"></i> Thank you, ${name}! Your message has been sent.`;
                    contactForm.parentElement.appendChild(successMsg);
                    contactForm.reset();
                    setTimeout(() => successMsg.remove(), 5000);
                }, (error) => {
                    alert("Failed to send message. Please reach out via LinkedIn.");
                });
        }
    });
}