const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

// 1. Remove deduplication fallback block in renderCategorySections
content = content.replace(/let fallback = newsData\.filter\(n => !n\.video && !items\.includes\(n\)\);\s*while \(items\.length < 4 && fallback\.length > 0\) \{\s*items\.push\(fallback\.shift\(\)\);\s*\}/g, '');

// 2. Remove short videos fallback
content = content.replace(/let fallback = \[\.\.\.newsData\]\.filter\(n => n\.image && !shorts\.some\(s => s\.id === n\.id\)\)\.sort\(\(\) => 0\.5 - Math\.random\(\)\);\s*while \(shorts\.length < 4 && fallback\.length > 0\) \{\s*shorts\.push\(fallback\.pop\(\)\);\s*\}/g, '');

// 3. Remove mid grid items random fallback
content = content.replace(/while \(items\.length < 9 && newsData\.length > 0\) items\.push\(newsData\[Math\.floor\(Math\.random\(\) \* newsData\.length\)\]\);/g, '');

// 4. Remove small videos remaining shift
content = content.replace(/while \(smallVideos\.length < 4 && remaining\.length > 0\) \{\s*smallVideos\.push\(remaining\.shift\(\)\);\s*\}/g, '');

// 5. Remove vids fallback
content = content.replace(/vids\.push\(\.\.\.newsData\.slice\(8, 11\)\); \/\/ fallback/g, '');
content = content.replace(/if \(vids\.length === 0\) vids\.push\(\.\.\.newsData\.slice\(18, 21\)\);/g, '');
content = content.replace(/if \(vids\.length === 0\) \{\s*\}\s*/g, '');

// 6. Remove items fallback
content = content.replace(/if \(items\.length < 3\) items = newsData; \/\/ fallback/g, '');
content = content.replace(/if \(items\.length < 3\) items = newsData\.slice\(0, 3\);/g, '');
content = content.replace(/if \(items\.length < 8\) items = \[\.\.\.items, \.\.\.newsData\];/g, '');
content = content.replace(/if \(vids\.length < 4\) vids = \[\.\.\.vids, \.\.\.newsData\]\.slice\(0, 4\);/g, '');

// 7. Remove breaking items fallback
content = content.replace(/if \(breakingItems\.length === 0\) breakingItems\.push\(\.\.\.newsData\.slice\(0, 5\)\);/g, '');

// 8. Deduplicate renderHome parallel fetches
const deduplicateStr = `
      const allNews = [...general, ...tech, ...ent, ...regional];
      const unique = [];
      const seen = new Set();
      for (const item of allNews) {
          if (!seen.has(item.id)) {
              seen.add(item.id);
              unique.push(item);
          }
      }
      newsData = unique;
`;
content = content.replace(/newsData = \[\.\.\.general, \.\.\.tech, \.\.\.ent, \.\.\.regional\];/g, deduplicateStr.trim());

// 9. Fix image fallback to return empty string
content = content.replace(/const fallbackUrl = this\.getCategoryFallback\(article\.category\);\s*mediaCache\.set\(query, fallbackUrl\);\s*return fallbackUrl;/g, `return '';`);

fs.writeFileSync('script.js', content, 'utf8');
console.log("Replacements done!");
