// Quick diagnostic test script for Gemini API key
const path = require('path');
const fs = require('fs');

// Load environment variables
let key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!key) {
  const envPaths = [
    path.join(__dirname, 'chatbot-backend', '.env'),
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env')
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match) {
        key = match[1].trim();
        console.log(`[INFO] Loaded API key from: ${path.relative(__dirname, p)}`);
        break;
      }
    }
  }
}

if (!key) {
  console.error('[ERROR] No GEMINI_API_KEY found in environment or .env files.');
  process.exit(1);
}

const maskedKey = key.slice(0, 6) + '...' + key.slice(-4);
console.log(`[INFO] Testing API Key: ${maskedKey}`);

const modelsToTest = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
];

async function runDiagnostics() {
  console.log('[INFO] Connecting to Google Gemini API...\n');

  for (const model of modelsToTest) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const startTime = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, respond with: "API is working!"' }] }]
        })
      });
      const duration = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        const candidateParts = data.candidates?.[0]?.content?.parts || [];
        const textParts = candidateParts.filter(p => !p.thought && typeof p.text === 'string');
        const reply = textParts[0]?.text || candidateParts[0]?.text || '(empty)';
        console.log(`  [PASS] ${model} -> HTTP ${res.status} (${duration}ms) | Reply: "${reply.trim()}"`);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.log(`  [FAIL] ${model} -> HTTP ${res.status} | ${errData.error?.message || res.statusText}`);
      }
    } catch (e) {
      console.log(`  [ERROR] ${model} -> Network error: ${e.message}`);
    }
  }

  console.log('\n[SUCCESS] Diagnostics completed.');
}

runDiagnostics();
