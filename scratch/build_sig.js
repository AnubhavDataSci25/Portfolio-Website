const fs = require('fs');
const path = require('path');
const opentype = require('./node_modules/opentype.js');

function buildSignatureSVG() {
  const fontPath = path.join(__dirname, 'MrsSaintDelafield.ttf');
  const buffer = fs.readFileSync(fontPath);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  const text = 'Anubhav Yadav';
  const fontSize = 160;
  const glyphs = font.stringToGlyphs(text);

  let currentX = 50;
  const baselineY = 160;
  const letters = [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let i = 0; i < glyphs.length; i++) {
    const char = text[i];
    const glyph = glyphs[i];

    if (char === ' ') {
      currentX += fontSize * 0.38; // Elegant space between Anubhav and Yadav
      continue;
    }

    const gPath = glyph.getPath(currentX, baselineY, fontSize);
    const bb = gPath.getBoundingBox();

    if (bb.x1 < minX) minX = bb.x1;
    if (bb.y1 < minY) minY = bb.y1;
    if (bb.x2 > maxX) maxX = bb.x2;
    if (bb.y2 > maxY) maxY = bb.y2;

    const pathData = gPath.toPathData(2);
    letters.push({
      char,
      index: letters.length,
      isWord2: i >= 8, // Yadav
      d: pathData,
      box: bb,
      startX: currentX
    });

    const kerning = i < glyphs.length - 1 ? font.getKerningValue(glyph, glyphs[i + 1]) : 0;
    // Manual cursive connection tightening for seamless stroke flow
    const connectionTweak = (char === 'A' || char === 'Y') ? -8 : -3;
    currentX += (glyph.advanceWidth + kerning) * (fontSize / font.unitsPerEm) + connectionTweak;
  }

  // Underline flourish sweeping beneath the name
  // Starts below 'A', sweeps under 'Anubhav', swoops low, and kicks up under 'Yadav' with an elegant tapering curl
  const flourishStartX = 70;
  const flourishEndX = currentX + 30;
  const flourishY = baselineY + 36;
  const flourishD = `M ${flourishStartX} ${flourishY - 10} C ${flourishStartX + 120} ${flourishY + 22}, ${currentX * 0.45} ${flourishY + 28}, ${currentX * 0.72} ${flourishY + 12} S ${flourishEndX} ${flourishY - 18}, ${flourishEndX + 25} ${flourishY - 6} Q ${flourishEndX + 35} ${flourishY + 2}, ${flourishEndX + 18} ${flourishY + 8} Q ${flourishEndX - 40} ${flourishY + 12}, ${currentX * 0.65} ${flourishY + 24}`;

  // ViewBox calculation with generous padding
  const vbX = Math.floor(minX - 30);
  const vbY = Math.floor(minY - 25);
  const vbWidth = Math.ceil(maxX - minX + 110);
  const vbHeight = Math.ceil(maxY - minY + 95);

  console.log(`ViewBox: ${vbX} ${vbY} ${vbWidth} ${vbHeight}`);
  console.log(`Total letters: ${letters.length}`);

  // Build standalone SVG markup
  let svg = `<!-- OFL Font: Mrs Saint Delafield (SIL Open Font License 1.1) by Sudtipos / Alejandro Paul -->\n`;
  svg += `<svg viewBox="${vbX} ${vbY} ${vbWidth} ${vbHeight}" preserveAspectRatio="xMidYMid meet" class="welcome-signature-svg" role="img" aria-label="Anubhav Yadav, handwritten signature">\n`;
  svg += `  <title>Anubhav Yadav</title>\n`;
  svg += `  <g class="sig-group">\n`;

  letters.forEach((l, idx) => {
    // Stagger delay calculation:
    // First word 'Anubhav' (chars 0..6): 0.3s to 1.5s
    // Pause: 0.15s
    // Second word 'Yadav' (chars 7..11): 1.65s to 2.45s
    // Flourish: 2.5s to 2.9s
    const delay = l.isWord2
      ? (1.5 + (idx - 7) * 0.16).toFixed(2)
      : (0.35 + idx * 0.16).toFixed(2);
    const dur = (l.char === 'A' || l.char === 'Y') ? '0.38s' : '0.24s';

    svg += `    <path class="sig-glyph" data-char="${l.char}" d="${l.d}" style="--sig-delay: ${delay}s; --sig-dur: ${dur};" pathLength="1" />\n`;
  });

  // Flourish path
  svg += `    <path class="sig-flourish" d="${flourishD}" style="--sig-delay: 2.35s; --sig-dur: 0.55s;" pathLength="1" />\n`;
  svg += `  </g>\n`;
  svg += `</svg>\n`;

  fs.writeFileSync(path.join(__dirname, 'signature.svg'), svg);
  console.log('Saved signature.svg, size:', Buffer.byteLength(svg), 'bytes');
  return { svg, vb: `${vbX} ${vbY} ${vbWidth} ${vbHeight}` };
}

buildSignatureSVG();
