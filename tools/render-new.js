function articleUrl(id) {
  return `article.html?id=${id}`;
}

async function renderHome() {
  if (!newsData || newsData.length === 0) {
    newsData = await safeFetchNews() || [];
  }

  if (newsData.length === 0) {
    const main = document.getElementById("main-content");
    if (main) main.innerHTML = `<div class="empty-state"><p>सध्या कोणतीही बातमी उपलब्ध नाही.</p><button onclick="window.location.reload()" class="retry-btn">पुन्हा प्रयत्न करा</button></div>`;
    return;
  }

  renderTicker();
  renderTopGrid();
  renderMidGrid();
  renderCategories();
  renderEntertainmentBlock();
  renderWorldOfStars();

  if (typeof lucide !== 'undefined' && window.safeInitIcons) {
    safeInitIcons();
  }
}

function renderTicker() {
  const tickerWrap = document.getElementById("dyn-ticker-wrapper");
  if (!tickerWrap) return;
  const breakingItems = newsData.filter(n => n.breaking || n.featured).slice(0, 5);
  if (breakingItems.length === 0) breakingItems.push(...newsData.slice(0, 5));
  
  const tickerHtml = breakingItems.map(n => `<span style="margin-right: 30px;">${n.title}</span>`).join('');
  tickerWrap.innerHTML = tickerHtml;
}

function renderTopGrid() {
  // Left: Text-heavy feed
  const topText = document.getElementById("dyn-top-text-feed");
  if (topText) {
    const items = newsData.filter(n => !n.video && n.category !== 'मनोरंजन').slice(0, 5);
    topText.innerHTML = items.map(n => `
      <div class="toi-text-feed-item">
        <div class="toi-feed-cat">${n.category}</div>
        <a href="${articleUrl(n.id)}" class="toi-feed-title">${n.title}</a>
      </div>
    `).join('');
  }

  // Center: Hero + sub list
  const topCenter = document.getElementById("dyn-top-feature-center");
  if (topCenter) {
    const feature = newsData.find(n => n.featured && !n.video) || newsData[5];
    const subs = newsData.filter(n => !n.video && n.id !== feature.id).slice(0, 3);
    
    let html = `
      <div class="toi-hero-article">
        <a href="${articleUrl(feature.id)}">
          <h1 class="toi-hero-main-title">${feature.title}</h1>
          <img class="toi-hero-main-img" src="${feature.image}" alt="${feature.title}" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
        </a>
      </div>
      <div class="toi-hero-sub-list">
    `;
    subs.forEach(n => {
      html += `
        <a href="${articleUrl(n.id)}" class="toi-hero-sub-item">
          <h3 class="toi-hero-sub-title">${n.title}</h3>
          <img src="${n.image}" alt="${n.title}" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
        </a>
      `;
    });
    html += `</div>`;
    topCenter.innerHTML = html;
  }

  // Right: Spotlight / Video cards
  const topRight = document.getElementById("dyn-top-spotlight-right");
  if (topRight) {
    const vids = newsData.filter(n => n.video).slice(0, 3);
    if (vids.length === 0) {
      vids.push(...newsData.slice(8, 11)); // fallback
    }
    
    topRight.innerHTML = vids.map(v => `
      <a href="${articleUrl(v.id)}" class="toi-video-card">
        <div class="toi-video-thumb">
          <img src="${v.image}" alt="${v.title}" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
          <div class="toi-play-icon">▶</div>
        </div>
        <h3 class="toi-video-card-title">${v.title}</h3>
      </a>
    `).join('');
  }
}

function renderMidGrid() {
  // Left: Mid text feed
  const midLeft = document.getElementById("dyn-mid-text-feed");
  if (midLeft) {
    const items = newsData.slice(11, 15);
    midLeft.innerHTML = items.map(n => `
      <div class="toi-mid-text-item">
        <span class="toi-mid-tag">${n.category}</span>
        <a href="${articleUrl(n.id)}" class="toi-mid-title smaller">${n.title}</a>
        ${n.summary ? `<p class="toi-mid-excerpt">${n.summary.substring(0, 80)}...</p>` : ''}
      </div>
    `).join('');
  }

  // Center: Feed articles
  const midCenter = document.getElementById("dyn-mid-articles-center");
  if (midCenter) {
    const items = newsData.slice(15, 18);
    midCenter.innerHTML = items.map(n => `
      <div class="toi-feed-article">
        <div class="toi-feed-text">
          <a href="${articleUrl(n.id)}" class="toi-feed-main-title">${n.title}</a>
          <p class="toi-feed-summary">${n.summary ? n.summary.substring(0, 120) + '...' : ''}</p>
        </div>
        <img class="toi-feed-img" src="${n.image}" alt="${n.title}" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
      </div>
    `).join('');
  }

  // Right: Videos
  const midRight = document.getElementById("dyn-mid-videos-right");
  if (midRight) {
    const vids = newsData.filter(n => n.video).slice(3, 6);
    if (vids.length === 0) vids.push(...newsData.slice(18, 21));
    midRight.innerHTML = vids.map(v => `
      <a href="${articleUrl(v.id)}" class="toi-video-card">
        <div class="toi-video-thumb">
          <img src="${v.image}" alt="${v.title}" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
          <div class="toi-play-icon">▶</div>
          <div class="toi-video-time-badge">02:30</div>
        </div>
        <h3 class="toi-video-card-title"><span class="toi-video-prefix">ON CAM:</span> ${v.title}</h3>
      </a>
    `).join('');
  }
}

function renderCategories() {
  const catTech = document.getElementById("dyn-cat-tech");
  if (catTech) catTech.innerHTML = buildCategoryHTML('तंत्रज्ञान', 'Technology');
  
  const catGadgets = document.getElementById("dyn-cat-gadgets");
  if (catGadgets) catGadgets.innerHTML = buildCategoryHTML('तंत्रज्ञान', 'Gadgets Now', 3); // shift offset
  
  const catAuto = document.getElementById("dyn-cat-auto");
  if (catAuto) catAuto.innerHTML = buildCategoryHTML('बिझनेस', 'Automobile');
}

function buildCategoryHTML(catMarathi, catEnglish, offset=0) {
  let items = newsData.filter(n => n.category === catMarathi);
  if (items.length < 3) items = newsData; // fallback
  
  const main = items[offset % items.length];
  const sub1 = items[(offset+1) % items.length];
  const sub2 = items[(offset+2) % items.length];
  
  return `
    <h3 class="toi-category-header"><a href="#">${catEnglish} <span class="toi-category-arrow">›</span></a></h3>
    <div class="toi-category-featured">
      <img src="${main.image}" alt="${main.category}" class="toi-category-img" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
      <a href="${articleUrl(main.id)}" class="toi-category-featured-title">${main.title}</a>
    </div>
    <div class="toi-category-subgrid">
      <a href="${articleUrl(sub1.id)}" class="toi-category-text-link border-right">${sub1.title}</a>
      <a href="${articleUrl(sub2.id)}" class="toi-category-text-link">${sub2.title}</a>
    </div>
  `;
}

function renderEntertainmentBlock() {
  const entLeft = document.getElementById("dyn-ent-left");
  if (entLeft) {
    let items = newsData.filter(n => n.category === 'मनोरंजन');
    if (items.length < 8) items = [...items, ...newsData];
    
    const hero = items[0];
    const thumbs = items.slice(1, 3);
    const texts = items.slice(3, 8);
    
    entLeft.innerHTML = `
      <h3 class="toi-ent-header"><a href="#">Entertainment <span class="toi-category-arrow">›</span></a></h3>
      <div class="toi-ent-subgrid">
        <div class="toi-ent-inner-left">
          <a href="${articleUrl(hero.id)}" class="toi-ent-hero-wrap">
            <img src="${hero.image}" alt="Hero" class="toi-ent-hero-img" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
            <div class="toi-ent-hero-overlay">
              <h4 class="toi-ent-hero-title">${hero.title}</h4>
            </div>
          </a>
          <div class="toi-ent-thumbs-grid">
            ${thumbs.map(n => `
              <a href="${articleUrl(n.id)}" class="toi-ent-thumb-item">
                <img src="${n.image}" alt="Thumb" class="toi-ent-thumb-img" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
                <h5 class="toi-ent-thumb-title">${n.title}</h5>
              </a>
            `).join('')}
          </div>
        </div>
        <div class="toi-ent-text-list">
          ${texts.map(n => `
            <a href="${articleUrl(n.id)}" class="toi-ent-text-item">${n.title}</a>
          `).join('')}
        </div>
      </div>
    `;
  }

  const hwVideos = document.getElementById("dyn-hw-videos");
  if (hwVideos) {
    let vids = newsData.filter(n => n.video && n.category === 'मनोरंजन');
    if (vids.length < 4) vids = [...vids, ...newsData].slice(0, 4);
    
    hwVideos.innerHTML = `
      <h3 class="toi-hollywood-header"><a href="#">Entertainment Videos <span class="toi-category-arrow">›</span></a></h3>
      <div class="toi-hollywood-grid">
        ${vids.map(v => `
          <a href="${articleUrl(v.id)}" class="toi-hw-video-card">
            <div class="toi-hw-video-thumb">
              <img src="${v.image}" alt="Video" class="toi-hw-video-img" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
              <div class="toi-hw-play-btn"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>
              <div class="toi-hw-badge">02:35</div>
            </div>
            <h4 class="toi-hw-title">${v.title}</h4>
          </a>
        `).join('')}
      </div>
    `;
  }
}

function renderWorldOfStars() {
  const wosLeft = document.getElementById("dyn-wos-left");
  if (wosLeft) {
    let items = newsData.filter(n => n.category === 'मनोरंजन' || n.category === 'लाइफस्टाइल');
    if (items.length < 3) items = newsData.slice(0, 3);
    
    wosLeft.innerHTML = `
      <h3 class="toi-wos-header"><a href="#">World Of Stars <span class="toi-category-arrow">›</span></a></h3>
      <div class="toi-wos-grid">
        ${items.slice(0, 3).map(n => `
          <a href="${articleUrl(n.id)}" class="toi-wos-card">
            <img src="${n.image}" alt="Star" class="toi-wos-img" onerror="this.onerror=null;this.src=PLACEHOLDER;" />
            <h4 class="toi-wos-title">${n.title}</h4>
          </a>
        `).join('')}
      </div>
      <div class="toi-promo-nav">
        <div class="toi-promo-dots">
          <div class="toi-promo-dot active"></div>
          <div class="toi-promo-dot"></div>
          <div class="toi-promo-dot"></div>
          <div class="toi-promo-dot"></div>
        </div>
        <div class="toi-promo-arrows">
          <button class="toi-promo-arrow"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <button class="toi-promo-arrow"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
        </div>
      </div>
    `;
  }
}
