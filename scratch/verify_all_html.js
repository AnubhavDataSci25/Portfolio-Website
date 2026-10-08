const fs = require('fs');
const path = require('path');

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

let allPassed = true;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const isBlog = f.startsWith('blog/');
  const cssHref = isBlog ? '../mobile.css' : 'mobile.css';
  const jsSrc = isBlog ? '../mobile.js' : 'mobile.js';

  const hasCss = content.includes(cssHref);
  const hasJs = content.includes(jsSrc);
  const hasViewportFit = content.includes('viewport-fit=cover');

  if (!hasCss || !hasJs || !hasViewportFit) {
    console.error(`FAIL: ${f} missing tags: CSS=${hasCss}, JS=${hasJs}, ViewportFit=${hasViewportFit}`);
    allPassed = false;
  } else {
    console.log(`PASS: ${f}`);
  }
});

if (allPassed) {
  console.log('ALL 12 PAGES PASS MOBILE INTEGRATION VERIFICATION!');
}
