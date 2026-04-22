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
            title: "Introvert vs Extrovert Classification",
            tagline: "ML Model for Personality Type Prediction",
            description: "A research-driven project that utilizes Machine Learning to classify personality types (Introvert vs Extrovert) based on digital footprints.",
            objectives: [
                "Extract meaningful linguistic patterns from input user data.",
                "Build a classification model using advanced ML techniques.",
                "Integrate Generative AI to provide personalized improvement tips."
            ],
            approach: "Utilized Machine Learning preprocessing and prediction techniques. We implemented a Flask-based backend to serve the model and used the Gemini API for feedback generation.",
            results: "Delivered a user-friendly application that provides instant psychological insights with high predictive reliability.",
            stack: ["Python", "Flask", "Scikit-Learn", "GenAI", "Gemini API"],
            links: [{ label: "View Code", url: "https://github.com/AnubhavDataSci25/Introvert-vs-Extrovert-Classification-Project", icon: "fab fa-github" }]
        },
        'student-performance': {
            title: "Student Habit vs Academic Performance Prediction",
            tagline: "Predictive Analytics for Student Success",
            description: "This project analyzes the correlation between student habits (like study time, sleep patterns) and their academic performance using machine learning techniques.",
            objectives: [
                "Identify key habits that influence academic success.",
                "Build a predictive model to forecast student performance.",
                "Provide actionable insights for students and educators."
            ],
            approach: "We adopted a modular coding approach, starting with data collection and preprocessing. We then trained various regression models and implemented a form which allows users to input their habits and receive performance predictions (marks).",
            results: "The model achieved an R² score of 0.85, indicating strong predictive power. The project has been well-received for its practical application in educational settings.",
            stack: ["Python", "Scikit-Learn", "Pandas", "Matplotlib", "Flask", "HTML/CSS/Bootstrap", "Docker"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/Student-Habit-vs-Academic-Performance-Prediction", icon: "fab fa-github" }]
        },
        'aurora-ai': {
            title: "Aurora AI",
            tagline: "AI-Powered Data Analysis and Visualization Tool",
            description: "Aurora AI is a comprehensive data analysis and visualization tool that leverages AI to provide insights and recommendations based on user-uploaded datasets.",
            objectives: [
                "Develop an intuitive interface for data upload and analysis.",
                "Utilize pandas cleaning and preprocessing techniques to handle diverse datasets.",
                "Implement visualization capabilities using Matplotlib and Seaborn for insightful data representation, without writing custom code.",
                "LLM and RAG integration for natural language querying and insights generation."
            ],
            approach: "We developed a user-friendly interface for data upload and analysis. Utilizing pandas for data cleaning and preprocessing, we implemented visualization capabilities using Matplotlib and Seaborn. Additionally, we integrated LLM and RAG technologies for natural language querying and insights generation.",
            results: "Aurora AI successfully provides actionable insights from diverse datasets, enhancing the data analysis process with AI-driven automation.",
            stack: ["Python", "Pandas", "Matplotlib", "Seaborn", "Streamlit", "Gemini API", "RAG"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/Aurora-AI-Project", icon: "fab fa-github" }]
        },
        'capbot': {
            title: "CapBot",
            tagline: "AI-Powered Caption Generation for Images",
            description: "AI-driven caption generator for social media. Generates creative content from images using image-to-text models. Built with Gemini AI Model and Streamlit for a seamless user experience.",
            objectives: [
                "Implement image-to-text models to generate captions from user-uploaded images.",
                "Create a user-friendly interface using Streamlit for easy image upload and caption retrieval.",
                "Integrate Gemini AI Model to enhance caption creativity and relevance."
            ],
            approach: "We utilized image-to-text models to generate captions from user-uploaded images. A user-friendly interface was created using Streamlit for easy image upload and caption retrieval. The Gemini AI Model was integrated to enhance caption creativity and relevance.",
            results: "CapBot successfully generates creative and relevant captions for a wide range of images, providing users with engaging content for their social media posts.",
            stack: ["Python", "Gemini AI Model", "Streamlit", "PIL"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/Caption-Generator-Project", icon: "fab fa-github" }]
        },
        'salary-analysis': {
            title: "Data Professionals Salary Analysis",
            tagline: "Interactive Salary Analysis Dashboard for Data Professionals",
            description: "Analysis of data professional salaries (2020-2023) featuring interactive Power BI and Streamlit dashboards.",
            objectives: [
                "Create interactive dashboards to visualize salary trends and insights.",
                "Utilize Power BI for data visualization and reporting.",
                "Implement Streamlit for a user-friendly interface for exploring salary data."
            ],
            approach: "Collected data from kaggle and developed interactive dashboards using Power BI and Streamlit to visualize salary trends and insights. The dashboards allow users to explore salary data across different dimensions such as experience, location, and industry.",
            results: "The salary analysis dashboard provides valuable insights into data professional compensation trends, enabling informed decision-making for career development and negotiation.",
            stack: ["Python", "Power BI", "Streamlit", "Pandas", "Plotly"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/Data-Professionals-Salaries-2020-to-2023-Analysis", icon: "fab fa-github" }]
        },
        'spam-classification': {
            title: "Spam vs Ham Classification",
            tagline: "ML Model for Spam Detection in Emails",
            description: "A machine learning project that classifies emails as spam or ham (not spam) using natural language processing techniques.",
            objectives: [
                "Preprocess email text data for feature extraction.",
                "Train a classification model to distinguish between spam and ham emails.",
                "Evaluate model performance and optimize for accuracy."
            ],
            approach: "We utilized natural language processing techniques to preprocess email text data, including tokenization and vectorization. A classification model was trained using algorithms such as Naive Bayes and Support Vector Machines. Model performance was evaluated using metrics like accuracy, precision, and recall.",
            results: "The spam classification model achieved an accuracy of 95%, effectively distinguishing between spam and ham emails. This project demonstrates the application of machine learning in email filtering and cybersecurity.",
            stack: ["Python", "Scikit-Learn", "NLTK", "Pandas", "Matplotlib", "Streamlit"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/Spam-Classification-Project", icon: "fab fa-github" }]
        },
        'house-price-prediction': {
            title: "House Price Prediction",
            tagline: "Predictive Model for Real Estate Valuation",
            description: "Leveraging King County dataset to identify key market factors and predict sale prices using advanced regression techniques.",
            objectives: [
                "Collect and preprocess real estate data.",
                "Develop a predictive model for house price estimation.",
                "Evaluate model performance and refine for accuracy."
            ],
            approach: "We utilized the King County dataset to analyze key market factors influencing house prices. A regression model was developed using advanced techniques to predict sale prices. Model performance was evaluated using metrics like RMSE and R².",
            results: "The house price prediction model achieved a high level of accuracy in estimating sale prices, providing valuable insights for real estate professionals and homebuyers.",
            stack: ["Python", "Scikit-Learn", "Pandas", "NumPy", "Matplotlib", "Streamlit"],
            links: [{ label: "GitHub Repository", url: "https://github.com/AnubhavDataSci25/House-Price-Prediction", icon: "fab fa-github" }]
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