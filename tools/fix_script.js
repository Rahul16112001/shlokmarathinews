const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

// Fix 1: Feature finding crash (Line 1491)
content = content.replace(/const feature = newsData\.find\(n => n\.featured && !n\.video\) \|\| newsData\[5\];/g, 
  `const feature = newsData.find(n => n.featured && !n.video) || (newsData.length > 5 ? newsData[5] : newsData[0]);\n      if (!feature) return;`);

// Fix 2: renderMidGrid items empty check
content = content.replace(/const items = newsData\.slice\(11, 15\);\s*midLeft\.innerHTML = items\.map\(n => `/g,
  `const items = newsData.slice(11, 15);\n      if (items.length === 0) return;\n      midLeft.innerHTML = items.map(n => \``);

content = content.replace(/const items = newsData\.slice\(15, 18\);\s*midCenter\.innerHTML = items\.map\(n => `/g,
  `const items = newsData.slice(15, 18);\n      if (items.length === 0) return;\n      midCenter.innerHTML = items.map(n => \``);

// Fix 3: renderWorldOfStars hero crash
content = content.replace(/const hero = newsData\.slice\(11, 15\)\[0\] \|\| newsData\[0\];/g,
  `const hero = newsData.slice(11, 15)[0] || newsData[0];\n    if (!hero) return;`);

fs.writeFileSync('script.js', content, 'utf8');
console.log("Fixes applied.");
