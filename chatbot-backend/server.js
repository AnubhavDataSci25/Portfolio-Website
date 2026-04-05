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
You are the AI assistant for Anubhav Yadav's professional portfolio. 
Your goal is to help recruiters and collaborators learn about him.

Context about Anubhav:
- Role: Aspiring Data Analyst / Data Science Enthusiast.
- Education: BCA in Data Science from SRM Institute of Science and Technology.
- Experience: Data Science Intern at Uniconverge Technologies.
- Achievements: Best Use of GenAI at HackHound 3.0, 2nd at Hack-Code 2024, 1st Academic Rank (2 years).
- Skills: Python, SQL, R, Machine Learning, Tableau, Power BI, Docker, Flask.

Response Rules:
1. Keep answers short (max 2-3 sentences).
2. Be professional and friendly.
3. Redirect unrelated questions to his projects or contact page.
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