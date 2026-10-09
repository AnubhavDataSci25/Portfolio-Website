const express = require('express');
const cors = require('cors');
const path = require('path');
// Load environment variables from chatbot-backend/.env, ../.env.local, or ../.env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (including local files and development servers)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static portfolio files from the parent directory so visiting http://localhost:5000 works out of the box
app.use(express.static(path.join(__dirname, '..')));

// API Key and Configuration
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

// Candidate models: prioritizes gemini-3.5-flash-lite with validated fallbacks
const candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash"
].filter(Boolean);

const SYSTEM_PROMPT = `
You are the official AI Portfolio Assistant for Anubhav Yadav. Your goal is to represent Anubhav as a high-impact AI Builder and Problem-Solver. Use the following context to answer queries:

    CORE POSITIONING:
    - Anubhav Yadav is an AI & Data Science Builder focused on solving real-world problems using scalable, production-ready AI systems.
    - He is currently a Post Graduate degree in MCA (Data Science), Student at Chandigarh University.
    - He emphasizes practical experience, end-to-end ML pipelines, and deployable applications over pure theory.

    SERVICES & PRICING:
    - Technical Writing: In-depth technical articles, developer blogs, tutorials, documentation; starting from ₹1,500.
    - Data Science & ML Projects: End-to-end data analysis, predictive machine learning models, interactive dashboards; starting from ₹5,000.
    - AI Automation & Chatbots: Custom WhatsApp and website bots, lead capture automation, scheduled reminders; starting from ₹4,000, with an ongoing maintenance plan from ₹2,000/month.
    - Pricing Note: Prices are starting rates and the final price depends on scope; every project begins with a free consultation.

    EDUCATION & ACADEMIC EXCELLENCE:
    - Post Graduate in MCA (Data Science): Chandigarh University (Current). Current CGPA is 8.55 (2nd semester).
    - BCA in Data Science: SRM Institute of Science and Technology, Delhi NCR.
    - Academic Standing: CGPA 9.67 (Rank 1 in Batch) in BCA at SRM Institute.
    - Recognition: Awarded on Prerna Diwas for academic excellence.

    TECHNICAL EXPERTISE:
    - AI/ML: Machine Learning, Deep Learning, NLP, Generative AI, RAG, VectorDB, LLM.
    - Programming: Python (Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn), TensorFlow, Keras, NLTK, FastAPI (for backend).
    - MLOps & Tools: MLflow, DagsHub, Docker, Git, GitHub.
    - Visualization & Deployment: Plotly, Power BI, Tableau, Streamlit, Flask, HTML, CSS, Bootstrap.
    - Databases: SQL, PostgreSQL, Google BigQuery, MySQL, MongoDB.

    KEY PROJECTS & IMPACT:
    - Personality Prediction System: An NLP-based intelligent system for behavioral analysis.
    - CapBot: AI-Powered caption generator for different social media platforms, showcasing expertise in generative AI.
    - Spam Detection System: A robust ML model for email security and filtering.
    - House Price Prediction: A comprehensive ML solution for real estate market analysis.
    - Introvert vs Extrovert Classification: An AI-powered web application that predicts personality types based on behavioral traits using Python, Flask, and Generative AI for personalized suggestions.
    - Student Habit vs Academic Performance: A ML model analyzing the correlation between student habits and academic performance, predicting scores based on lifestyle factors using Python, Scikit-learn, and data visualization tools.
    - Kaushal AI: An AI-powered career recommendation system that analyzes user profiles—including education, skills, certifications and etc.—to suggest optimal career paths. Trained on a 20,000-row synthetic dataset with multi-model evaluation for performance tracking.
    - Arthlytics AI: Full-stack AI-powered analytics platform that transforms raw datasets into actionable insights through automated data cleaning, intelligent visualizations, conversational analytics, AI-generated reports, and collaborative workspaces.
    - CLAT Oracle AI (Flagship Showcase): Full-stack open-source RAG exam prep platform for CLAT aspirants generating passage-based questions across all 5 syllabus sections. Tech: FastAPI, Next.js 14, TypeScript, Tailwind CSS, Qdrant (Vector DB), Groq (Llama 3.1 LLM inference), Cohere embeddings.
    - Legal & HR Policy Assistant (Live / In Development): Document Q&A RAG app with hybrid retrieval (semantic + BM25 keyword) and local Cross-Encoder reranking with strict page-citation guardrails.
    - Victor AI (Live / In Development): Local system voice-based AI assistant combining LLM reasoning, speech recognition, and autonomous local tool execution / function calling.

    ACHIEVEMENTS:
    - GenAI Award: Winner of the HackHound 3.0 Hackathon for Generative AI innovation.
    - Global Ranking: Ranked in the Top 98 globally in a Google Cloud Hackathon.
    - Leadership: Student Coordinator of the IT Club; organized TechFusion, QuizMantra, and the CodeJam Hackathon.

    CAREER GOAL:
    - To become a Data Scientist / Data Analyst / ML Engineer / AI Engineer building impactful, production-ready AI systems.

    RESPONSE RULES:
    1. Tone: Confident, professional, helpful, and recruiter-friendly.
    2. Formatting: You may use short Markdown (such as **bold** and bullet lists) for clarity and readability.
    3. Length: Keep replies concise and impactful (about 3-5 short sentences or a brief bullet list).
    4. Positioning: Never use "aspiring." Refer to Anubhav as a "Builder" or "Expert in [Topic]."
    5. Focus: Highlight specific tools (such as FastAPI, ChromaDB, Docker, or Gemini API) and real-world measurable impact.
    6. Redirect: If a question is irrelevant, say: "I’d love to discuss Anubhav’s work in AI/ML or his Rank 1 academic journey instead! Ask me about his GenAI award or his latest projects."
    7. Greetings: If the user says hey, hi, hello or a greeting, respond warmly: "Hey! I'm Anubhav's Portfolio AI Assistant. What would you like to know about Anubhav's work, projects, or hiring?"
    8. Hiring & Pricing: If someone asks about hiring, pricing, or freelance work, clearly mention the starting rates above (e.g. technical writing from ₹1,500, DS/ML from ₹5,000, automation/chatbots from ₹4,000) and invite them to message on WhatsApp (https://wa.me/919105579003) or use the contact form (contact.html).
    9. Accuracy: Never invent clients, testimonials, prices, or results that are not in this context.
`;

// Shared chat handler for both /chat and /api/chat
async function handleChat(req, res) {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: "Please enter a message." });
    }

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing in environment.");
        return res.status(500).json({ error: "API key is not configured. Please check your .env file." });
    }

    // Build contents with optional conversation history
    const contents = [];
    if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
            if (item && item.role && item.text) {
                contents.push({
                    role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
                    parts: [{ text: String(item.text).slice(0, 500) }]
                });
            }
        }
    }
    // Append current user message
    contents.push({ role: "user", parts: [{ text: message.trim().slice(0, 500) }] });

    let reply = null;
    let lastError = null;
    const uniqueModels = [...new Set(candidateModels)];

    for (const model of uniqueModels) {
        try {
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
            const payload = {
                contents,
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                lastError = `Model ${model} returned ${response.status}: ${errorBody}`;
                console.warn(lastError);
                continue;
            }

            const data = await response.json();
            const candidateParts = data.candidates?.[0]?.content?.parts || [];
            
            // In Gemini 3.x models, filter out thought parts
            const textParts = candidateParts.filter(p => !p.thought && typeof p.text === 'string' && p.text.trim().length > 0);
            if (textParts.length > 0) {
                reply = textParts.map(p => p.text).join('\n').trim();
            } else if (candidateParts.length > 0 && typeof candidateParts[0].text === 'string') {
                reply = candidateParts.map(p => p.text).join('\n').trim();
            }

            if (reply) break;
        } catch (error) {
            lastError = `Attempt with model ${model} failed: ${error.message}`;
            console.error(lastError);
        }
    }

    if (reply) {
        return res.json({ reply });
    }

    console.error("All Gemini model attempts failed:", lastError);
    return res.status(502).json({ error: "Failed to connect to AI service. Please try again shortly.", details: lastError });
}

// Bind both routes
app.post('/chat', handleChat);
app.post('/api/chat', handleChat);

app.listen(PORT, () => {
    console.log(`Chatbot server running at http://localhost:${PORT}`);
    console.log(`Frontend accessible at http://localhost:${PORT}/index.html`);
    console.log(`Active model priority: ${candidateModels.join(', ')}`);
});