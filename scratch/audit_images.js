const fs = require('fs');

const files = [
  'index.html',
  'about.html',
  'qualifications.html',
  'projects.html',
  'achievements.html',
  'services.html',
  'blog.html',
  'contact.html',
  '404.html',
  'blog/whatsapp-automation-small-business.html',
  'blog/data-cleaning-mistakes-ml.html',
  'blog/technical-blog-posts-that-rank.html'
];

let missingDecoding = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const imgMatches = content.match(/<img[^>]*>/gi) || [];
  imgMatches.forEach(img => {
    const hasDecoding = /decoding=["']?async["']?/i.test(img);
    if (!hasDecoding) {
      console.log(`[Missing decoding="async"] ${f}: ${img.slice(0, 90)}...`);
      missingDecoding++;
    }
  });
});

console.log(`Missing decoding="async": ${missingDecoding}`);
