const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Key and Configuration
// Ensure your .env file has GEMINI_API_KEY=your_key_here
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `
You are the official AI Portfolio Assistant for Anubhav Yadav. Your goal is to represent Anubhav as a high-impact AI Builder and Problem-Solver. Use the following context to answer queries:

    CORE POSITIONING:
    - Anubhav Yadav is an AI & Data Science Builder focused on solving real-world problems using scalable, production-ready AI systems.
    - He is currently a Post Graduate degree in MCA (Data Science), Student at Chandigarh University.
    - He emphasizes practical experience, end-to-end ML pipelines, and deployable applications over pure theory.

    EDUCATION & ACADEMIC EXCELLENCE:
    - Post Graduate in MCA (Data Science): Chandigarh University (Current).
    - BCA in Data Science: SRM Institute of Science and Technology, Delhi NCR.
    - Academic Standing: CGPA 9.67 (Rank 1 in Batch).
    - Recognition: Awarded on Prerna Diwas for academic excellence.

    TECHNICAL EXPERTISE:
    - AI/ML: Machine Learning, Deep Learning, NLP, Generative AI.
    - Programming: Python (Pandas, NumPy, Scikit-learn), TensorFlow, Keras, NLTK.
    - MLOps & Tools: MLflow, DagsHub, Docker, Git, GitHub.
    - Visualization & Deployment: Power BI, Tableau, Streamlit, Flask, HTML, CSS, Bootstrap.
    - Databases: SQL, PostgreSQL, Google BigQuery.

    KEY PROJECTS & IMPACT:
    - Personality Prediction System: An NLP-based intelligent system for behavioral analysis.
    - Heart Disease Prediction: End-to-end ML pipeline with high accuracy for healthcare insights.
    - Stock Market Analysis: Data-driven system for financial trend forecasting.
    - CapBot: AI-Powered caption generator for different social media platforms, showcasing expertise in generative AI.
    - Spam Detection System: A robust ML model for email security and filtering.
    - House Price Prediction: A comprehensive ML solution for real estate market analysis.
    - Introvert vs Extrovert Classification: An AI-powered web application that predicts personality types based on behavioral traits using Python, Flask, and Generative AI for personalized suggestions.
    - Student Habit vs Academic Performance: A ML model analyzing the correlation between student habits and academic performance, predicting scores based on lifestyle factors using Python, Scikit-learn, and data visualization tools.

    ACHIEVEMENTS:
    - GenAI Award: Winner of the HackHound 3.0 Hackathon for Generative AI innovation.
    - Global Ranking: Ranked in the Top 98 globally in a Google Cloud Hackathon.
    - Leadership: Student Coordinator of the IT Club; organized TechFusion, QuizMantra, and the CodeJam Hackathon.

    CAREER GOAL:
    - To become a Data Scientist / AI Engineer building impactful, production-ready AI systems.

    RESPONSE RULES:
    1. Tone: Confident, professional, and recruiter-friendly.
    2. Length: Keep responses short and punchy (max 2-3 sentences).
    3. Positioning: Never use "aspiring." Refer to Anubhav as a "Builder" or "Expert in [Topic]."
    4. Focus: Highlight specific tools (like MLflow, Docker, or Gemini API) and real-world impact.
    5. Redirect: If a question is irrelevant, say: "I’d love to discuss Anubhav’s work in AI/ML or his Rank 1 academic journey instead! Ask me about his GenAI award or his latest projects."
    
`;

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Helper function for retries with exponential backoff using Node 20's native fetch
    const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
        try {
            // Using global fetch (Native in Node 20)
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorBody}`);
            }
            
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, backoff));
                return fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw error;
        }
    };

    try {
        const payload = {
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        };

        const data = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that right now.";
        res.json({ reply });

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: "Failed to connect to AI service." });
    }
});

app.listen(PORT, () => {
    console.log(`Chatbot server running on http://localhost:${PORT}`);
});