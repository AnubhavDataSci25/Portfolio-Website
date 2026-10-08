const fs = require('fs');
const glob = ['index.html', 'about.html', 'qualifications.html', 'projects.html', 'achievements.html', 'services.html', 'blog.html', 'contact.html', '404.html', 'blog/whatsapp-automation-small-business.html', 'blog/data-cleaning-mistakes-ml.html', 'blog/technical-blog-posts-that-rank.html'];
glob.forEach(f => {
  if (!fs.existsSync(f)) return;
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('<table')) console.log('Table found in ' + f);
  if (c.includes('<pre')) console.log('Pre found in ' + f);
});
