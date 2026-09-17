const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Replace Ticker
html = html.replace(
  /<div class="at-ticker-text-wrapper">[\s\S]*?<\/div>/,
  `<div class="at-ticker-text-wrapper" id="dyn-ticker-wrapper"></div>`
);

// Replace Top Grid - Left
html = html.replace(
  /<div class="toi-top-col-left">[\s\S]*?<\/div>\s*<!-- CENTER COLUMN/g,
  `<div class="toi-top-col-left" id="dyn-top-text-feed"></div>\n          <!-- CENTER COLUMN`
);

// Replace Top Grid - Center
html = html.replace(
  /<div class="toi-top-col-center">[\s\S]*?<\/div>\s*<!-- RIGHT COLUMN/g,
  `<div class="toi-top-col-center" id="dyn-top-feature-center"></div>\n          <!-- RIGHT COLUMN`
);

// Replace Top Grid - Right
html = html.replace(
  /<div class="toi-top-col-right">[\s\S]*?<\/div>\s*<\/div>\s*<!-- THIRD SECTION/g,
  `<div class="toi-top-col-right" id="dyn-top-spotlight-right"></div>\n        </div>\n\n        <!-- THIRD SECTION`
);

// Replace Mid Grid - Left
html = html.replace(
  /<div class="toi-mid-col-left">[\s\S]*?<\/div>\s*<!-- CENTER COLUMN/g,
  `<div class="toi-mid-col-left" id="dyn-mid-text-feed"></div>\n\n          <!-- CENTER COLUMN`
);

// Replace Mid Grid - Center
html = html.replace(
  /<div class="toi-mid-col-center">[\s\S]*?<\/div>\s*<!-- RIGHT COLUMN/g,
  `<div class="toi-mid-col-center" id="dyn-mid-articles-center"></div>\n\n          <!-- RIGHT COLUMN`
);

// Replace Mid Grid - Right
html = html.replace(
  /<div class="toi-mid-col-right">[\s\S]*?<\/div>\s*<\/div>\s*<!-- FOURTH SECTION/g,
  `<div class="toi-mid-col-right" id="dyn-mid-videos-right"></div>\n        </div>\n\n        <!-- FOURTH SECTION`
);

// Replace Categories (Technology, Gadgets, Automobile)
html = html.replace(
  /<div class="toi-category-col">\s*<h3 class="toi-category-header"><a href="#">Technology[\s\S]*?<\/div>\s*<\/div>/,
  `<div class="toi-category-col" id="dyn-cat-tech"></div>`
);

html = html.replace(
  /<div class="toi-category-col">\s*<h3 class="toi-category-header"><a href="#">Gadgets Now[\s\S]*?<\/div>\s*<\/div>/,
  `<div class="toi-category-col" id="dyn-cat-gadgets"></div>`
);

html = html.replace(
  /<div class="toi-category-col">\s*<h3 class="toi-category-header"><a href="#">Automobile[\s\S]*?<\/div>\s*<\/div>/,
  `<div class="toi-category-col" id="dyn-cat-auto"></div>`
);


// Replace Entertainment Left
html = html.replace(
  /<div class="toi-ent-col-left">[\s\S]*?<\/div>\s*<!-- Right Column:/g,
  `<div class="toi-ent-col-left" id="dyn-ent-left"></div>\n\n          <!-- Right Column:`
);

// Replace Entertainment Right (Hollywood Videos)
html = html.replace(
  /<div class="toi-ent-col-right">[\s\S]*?<\/div>\s*<\/div>\s*<!-- SEVENTH SECTION/g,
  `<div class="toi-ent-col-right" id="dyn-hw-videos"></div>\n        </div>\n\n        <!-- SEVENTH SECTION`
);

// Replace World Of Stars
html = html.replace(
  /<div class="toi-wos-col-left">[\s\S]*?<\/div>\s*<!-- Right Column:/g,
  `<div class="toi-wos-col-left" id="dyn-wos-left"></div>\n\n          <!-- Right Column:`
);

fs.writeFileSync('index.html', html);
console.log("Updated index.html");
