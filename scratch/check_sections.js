const fs = require('fs');
const files = [
  'index.html',
  'blog/whatsapp-automation-small-business.html',
  'blog/data-cleaning-mistakes-ml.html',
  'blog/technical-blog-posts-that-rank.html'
];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const sections = content.match(/<(section|main|article)[^>]*>/gi);
  console.log(f + ':');
  if (sections) {
    sections.slice(0, 3).forEach(s => console.log('  ' + s));
  }
});
