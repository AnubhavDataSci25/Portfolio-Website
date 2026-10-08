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

let updatedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Add decoding="async" to <img ...> if not already present
  content = content.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    if (/decoding=/i.test(attrs)) {
      return match;
    }
    updatedCount++;
    return `<img${attrs} decoding="async">`;
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated images in: ${f}`);
  }
});

console.log(`Total <img> tags updated with decoding="async": ${updatedCount}`);
