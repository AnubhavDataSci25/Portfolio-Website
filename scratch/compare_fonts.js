const fs = require('fs');
const path = require('path');
const opentype = require('./node_modules/opentype.js');

function testFont(name, text, fontSize) {
  const fontPath = path.join(__dirname, name + '.ttf');
  const buffer = fs.readFileSync(fontPath);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  const glyphs = font.stringToGlyphs(text);
  let x = 30;
  const y = fontSize * 0.9;
  const letterPaths = [];

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    if (text[i] === ' ') {
      x += fontSize * 0.35;
      continue;
    }
    const glyphPath = glyph.getPath(x, y, fontSize);
    const svgPathData = glyphPath.toPathData(2);
    letterPaths.push({
      char: text[i],
      pathData: svgPathData,
      advanceWidth: glyph.advanceWidth * (fontSize / font.unitsPerEm),
      x
    });

    const kerning = i < glyphs.length - 1 ? font.getKerningValue(glyph, glyphs[i + 1]) : 0;
    x += (glyph.advanceWidth + kerning) * (fontSize / font.unitsPerEm);
  }

  return { name, letterPaths, totalWidth: x + 60, height: fontSize * 1.5 };
}

const fonts = ['MrsSaintDelafield', 'HerrVonMuellerhoff', 'MrDafoe'];
let html = '<!DOCTYPE html><html><body style="background:#0f1215;color:#fff;font-family:sans-serif;padding:30px;">';

fonts.forEach(fName => {
  const res = testFont(fName, 'Anubhav Yadav', 140);
  console.log(fName, 'Total width:', res.totalWidth);

  // Add decorative underline flourish path
  const flourishPath = `M ${res.totalWidth * 0.12} ${res.height * 0.88} Q ${res.totalWidth * 0.5} ${res.height * 0.96} ${res.totalWidth * 0.88} ${res.height * 0.84} Q ${res.totalWidth * 0.96} ${res.height * 0.81} ${res.totalWidth * 0.92} ${res.height * 0.88} Q ${res.totalWidth * 0.7} ${res.height * 0.95} ${res.totalWidth * 0.3} ${res.height * 0.92}`;

  html += `<h2>${fName}</h2>`;
  html += `<svg viewBox="0 0 ${res.totalWidth} ${res.height}" style="width: 800px; max-width: 100%; border: 1px solid #333; margin-bottom: 40px; transform: rotate(-3deg);">`;
  res.letterPaths.forEach((l, idx) => {
    html += `<path d="${l.pathData}" fill="#ffffff" stroke="#ffffff" stroke-width="0.5" id="${fName}-${idx}" />`;
  });
  html += `<path d="${flourishPath}" fill="none" stroke="#3d8bfd" stroke-width="4" stroke-linecap="round" />`;
  html += `</svg>`;
});

html += '</body></html>';
fs.writeFileSync(path.join(__dirname, 'preview.html'), html);
console.log('Saved preview.html');
