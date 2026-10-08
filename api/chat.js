// Vercel Serverless Function (Node.js 20)

// In-memory rate limiting (per-instance, best effort in serverless environment)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // max 10 requests per minute per IP

function checkRateLimit(ip) {
    const now = Date.now();
    
    // Clean up old entries so memory does not grow forever
    if (rateLimitMap.size > 1000) {
        for (const [key, record] of rateLimitMap.entries()) {
            if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
                rateLimitMap.delete(key);
            }
        }
    }

    const record = rateLimitMap.get(ip);
    if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return { allowed: true };
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false };
    }

    record.count += 1;
    return { allowed: true };
}

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate Limiting by Client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || 'unknown').trim();
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
        return res.status(429).json({ error: "Too many requests. Please wait a minute before sending another message." });
    }

    // Safely parse body (handles both string and pre-parsed object)
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid request format." });
        }
    }

    let rawMessage = body?.message;
    if (typeof rawMessage !== 'string') {
        return res.status(400).json({ error: "Please enter a valid message." });
    }

    const message = rawMessage.trim();
    if (!message) {
        return res.status(400).json({ error: "Please enter a message." });
    }

    if (message.length > 500) {
        return res.status(400).json({ error: "Message is too long. Please keep your message under 500 characters." });
    }

    // Read GEMINI_API_KEY from process.env only
    const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing in process.env");
        return res.status(500).json({ 
            error: "The AI assistant is temporarily unavailable. Please try again later." 
        });
    }

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
        - Post Graduate in MCA (Data Science): Chandigarh University (Current). Current CGPA is 8.55 (2nd semester)
        - BCA in Data Science: SRM Institute of Science and Technology, Delhi NCR.
        - Academic Standing: CGPA 9.67 (Rank 1 in Batch) in BCA at SRM Institute.
        - Recognition: Awarded on Prerna Diwas for academic excellence.

        TECHNICAL EXPERTISE:
        - AI/ML: Machine Learning, Deep Learning, NLP, Generative AI, RAG, VectorDB, LLM.
        - Programming: Python (Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn), TensorFlow, Keras, NLTK, FastAPI (for backend).
        - MLOps & Tools: MLflow, DagsHub, Docker, Git, GitHub.
        - Visualization & Deployment: Ploty, Power BI, Tableau, Streamlit, Flask, HTML, CSS, Bootstrap.
        - Databases: SQL, PostgreSQL, Google BigQuery, MySQL, MongoDB.

        KEY PROJECTS & IMPACT:
        - Personality Prediction System: An NLP-based intelligent system for behavioral analysis.
        - CapBot: AI-Powered caption generator for different social media platforms, showcasing expertise in generative AI.
        - Spam Detection System: A robust ML model for email security and filtering.
        - House Price Prediction: A comprehensive ML solution for real estate market analysis.
        - Introvert vs Extrovert Classification: An AI-powered web application that predicts personality types based on behavioral traits using Python, Flask, and Generative AI for personalized suggestions.
        - Student Habit vs Academic Performance: A ML model analyzing the correlation between student habits and academic performance, predicting scores based on lifestyle factors using Python, Scikit-learn, and data visualization tools.
        - Kaushal AI: An AI-powered career recommendation system that analyzes user profiles—including education, skills, certifications and etc. —to suggest optimal career paths. Trained on a 20,000-row synthetic dataset with multi-model evaluation for performance tracking.
        - Arthlytics AI: Arthlytics AI is a full-stack AI-powered analytics platform that transforms raw datasets into actionable insights through automated data cleaning, intelligent visualizations, conversational analytics, AI-generated reports, and collaborative workspaces. The platform is currently under active development with a modular and scalable architecture.
        - CLAT Oracle AI (Flagship Showcase): Full-stack open-source RAG exam prep platform for CLAT aspirants generating passage-based questions across all 5 syllabus sections. Tech: FastAPI, Next.js 14, TypeScript, Tailwind CSS, Qdrant (Vector DB), Groq (Llama 3.1 LLM inference), Cohere embeddings. Free-tier zero-cost architecture deployed on Vercel and Render.
        - Legal & HR Policy Assistant (Live / In Development): Document Q&A RAG app with hybrid retrieval (semantic + BM25 keyword) and local Cross-Encoder reranking (ms-marco-MiniLM-L-6-v2) with strict page-citation guardrails. Evaluated with RAGAs framework (0.91 faithfulness, 0.87 answer relevancy). Built with React, FastAPI, ChromaDB, and Groq.
        - Victor AI (Live / In Development): Local system voice-based AI assistant combining LLM reasoning, speech recognition, and autonomous local tool execution / function calling.

        ACHIEVEMENTS:
        - GenAI Award: Winner of the HackHound 3.0 Hackathon for Generative AI innovation.
        - Global Ranking: Ranked in the Top 98 globally in a Google Cloud Hackathon.
        - Leadership: Student Coordinator of the IT Club; organized TechFusion, QuizMantra, and the CodeJam Hackathon.

        CAREER GOAL:
        - To become a Data Scientist / Data Analyst / ML Engineer / AI Engineer building impactful, production-ready AI systems.

        RESPONSE RULES:
        1. Tone: Confident, professional, and recruiter-friendly.
        2. Length: Keep responses short and punchy (max 2-3 sentences).
        3. Positioning: Never use "aspiring." Refer to Anubhav as a "Builder" or "Expert in [Topic]."
        4. Focus: Highlight specific tools (like MLflow, Docker, or Gemini API) and real-world impact.
        5. Redirect: If a question is irrelevant, say: "I’d love to discuss Anubhav’s work in AI/ML or his Rank 1 academic journey instead! Ask me about his GenAI award or his latest projects."
        6. If user say hey, hi, hello or any greeting, just say "Hey! I'm Anubhav's Portfolio AI Assistant, What you want to know about Anubhav?", Nothing else. If they ask anything specific answer them accordingly.
        7. If someone asks about hiring, pricing, or freelance work, answer briefly and invite them to message on WhatsApp (https://wa.me/919105579003) or use the contact page (contact.html).
        8. Never invent clients, testimonials, prices, or results that are not in this context.
    `;

    const candidateModels = [
        process.env.GEMINI_MODEL,
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash"
    ].filter(Boolean);

    const uniqueModels = [...new Set(candidateModels)];
    let lastError = null;
    let reply = null;

    for (const model of uniqueModels) {
        try {
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const payload = {
                contents: [{ role: "user", parts: [{ text: message }] }],
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
                if (response.status === 404 || response.status === 400 || response.status === 403) {
                    continue;
                }
                break;
            }

            const data = await response.json();
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
                break;
            }
        } catch (err) {
            lastError = err.message;
            console.error(`Attempt with model ${model} failed:`, err);
        }
    }

    if (reply) {
        return res.status(200).json({ reply });
    }

    // Log detailed diagnostics on server without leaking Gemini API error details to the client
    console.error("All Gemini model attempts failed:", lastError);
    return res.status(500).json({ 
        error: "The AI assistant is temporarily unavailable. Please try again shortly."
    });
}