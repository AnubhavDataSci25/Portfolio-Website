const fs = require('fs');
const css = fs.readFileSync('mobile.css', 'utf8');

// Simple parser to ensure all rules (except :root) are enclosed inside @media queries
const lines = css.split('\n');
let depth = 0;
let currentAtRule = null;
let outsideRules = [];

lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('@media')) {
    currentAtRule = trimmed;
  }
  for (let char of line) {
    if (char === '{') {
      if (depth === 0 && !trimmed.startsWith('@media') && !trimmed.startsWith(':root')) {
        outsideRules.push({ line: idx + 1, content: trimmed });
      }
      depth++;
    } else if (char === '}') {
      depth--;
    }
  }
});

console.log('Outside rules count:', outsideRules.length);
if (outsideRules.length > 0) {
  console.log('Outside rules:', outsideRules);
} else {
  console.log('PASS: All non-root rules in mobile.css are strictly scoped inside @media queries!');
}
