const fs = require('fs');
const opentype = require('./node_modules/opentype.js');

function testFont(fontPath, text, fontSize) {
  const buffer = fs.readFileSync(fontPath);
  const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  console.log('Testing font:', font.names.fontFamily?.en || font.names.fontFamily);

  // Get glyphs
  const glyphs = font.stringToGlyphs(text);
  console.log('Glyphs count:', glyphs.length);

  // Generate paths for each glyph individually so we have letter-by-letter paths
  let x = 0;
  const y = fontSize * 0.8;
  const letterPaths = [];

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    if (glyph.name === 'space') {
      x += fontSize * 0.28;
      continue;
    }
    const path = glyph.getPath(x, y, fontSize);
    const svgPathData = path.toPathData(2);
    letterPaths.push({
      char: text[i],
      pathData: svgPathData,
      advanceWidth: glyph.advanceWidth * (fontSize / font.unitsPerEm),
      x
    });

    const kerning = i < glyphs.length - 1 ? font.getKerningValue(glyph, glyphs[i + 1]) : 0;
    x += (glyph.advanceWidth + kerning) * (fontSize / font.unitsPerEm);
  }

  console.log('Total width:', x);
  return { fontName: font.names.fontFamily.en, letterPaths, totalWidth: x, height: fontSize };
}

const path = require('path');
['MrsSaintDelafield', 'HerrVonMuellerhoff', 'MrDafoe'].forEach(name => {
  const res = testFont(path.join(__dirname, name + '.ttf'), 'Anubhav Yadav', 180);
  console.log(name, 'rendered', res.letterPaths.length, 'letters, width:', res.totalWidth.toFixed(1));
});
