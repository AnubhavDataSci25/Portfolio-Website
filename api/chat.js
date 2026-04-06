// Vercel Serverless Function (Node.js 20)
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

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

    // Helper function for retries (Exponential Backoff)
    const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
        const response = await fetch(url, options);
        const data = await response.json();

        if (response.status === 429 && retries > 0) {
            // API is rate limited, wait and try again
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
        }

        return { response, data };
    };

    try {
        const payload = {
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        };

        const { response, data } = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429) {
                return res.status(429).json({ error: "The assistant is receiving too many requests. Please wait a few seconds and try again." });
            }
            return res.status(response.status).json({ error: data.error?.message || "Gemini API Error" });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Crash:", error.message);
        return res.status(500).json({ error: "Server is temporarily busy. Try again in a moment." });
    }
}