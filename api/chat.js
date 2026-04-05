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
    You are the AI assistant for Anubhav Yadav's professional portfolio. 
    Context: BCA Data Science grad from SRM Institute, Interned at Uniconverge.
    Expertise: Python, SQL, ML, Tableau, Power BI.
    Response Rules: Keep answers very short (2 sentences), professional, and friendly.
    `;

    try {
        const payload = {
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API Error: ${errorBody}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having trouble thinking right now.";
        
        return res.status(200).json({ reply });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "AI Service Error" });
    }
}