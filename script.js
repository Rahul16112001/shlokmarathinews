/* =========================================================
   SHLOK MARATHI NEWS — script.js
   Data + rendering + Classic/Modern experience
   ========================================================= */

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <rect width="900" height="560" fill="#2a2a2a"/>
      <text x="450" y="280" fill="#eee" font-family="Georgia,serif" font-size="30" text-anchor="middle">श्लोक मराठी न्यूज</text>
    </svg>`
  );

const u = (id, w = 960, h = 640) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Central demo news data — shared by Classic & Modern */
let newsData = []; // Removed mock data, fetching directly from Supabase

let BREAKING = []; // Removed mock breaking news, fetching directly from Supabase

const MODE_KEY = "readingExperience";
const BOOKMARK_KEY = "shlok-bookmarks";

const CATEGORY_BLOCKS = [
  { cat: "महाराष्ट्र", layout: "a" },
  { cat: "मुंबई", layout: "b" },
  { cat: "राजकारण", layout: "c" },
  { cat: "देश", layout: "d", also: "जग", title: "देश आणि जग" },
  { cat: "बिझनेस", layout: "a" },
  { cat: "क्रीडा", layout: "b" },
  { cat: "तंत्रज्ञान", layout: "c" },
  { cat: "मनोरंजन", layout: "b" },
  { cat: "शिक्षण", layout: "d" },
  { cat: "आरोग्य", layout: "c" }
];


/* =========================================================
   MEDIA FETCHING SYSTEM
   ========================================================= */
const mediaCache = new Map();

function buildMediaQuery(article) {
  let query = article.title + " " + article.category;

  query = query.replace(/[;.,'"!?]/g, "");

  if (article.video) {
    query += " ताज्या बातम्या व्हिडिओ";
  } else {
    query += " बातमी";
  }

  if (!query.includes("महाराष्ट्र") && !query.includes("भारत") && !query.includes("मुंबई") && !query.includes("पुणे")) {
    if (article.category === "देश" || article.category === "जग") {
      query += " भारत";
    } else {
      query += " महाराष्ट्र";
    }
  }

  return encodeURIComponent(query.trim());
}

const ImageService = {
  getCategoryFallback(category) {
    // We use Wikipedia/Wikimedia URLs because Unsplash aggressively blocks 127.0.0.1 (localhost)
    // which was causing the onerror SVG fallback to trigger on all images.
    const fallbacks = {
      "राजकारण": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Vidhan_Bhavan%2C_Mumbai.jpg/800px-Vidhan_Bhavan%2C_Mumbai.jpg",
      "मुंबई": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mumbai_skyline_Bandra_Worli_Sea_Link.jpg/800px-Mumbai_skyline_Bandra_Worli_Sea_Link.jpg",
      "क्रीडा": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Wankhede_Stadium_Mumbai_2016.jpg/800px-Wankhede_Stadium_Mumbai_2016.jpg",
      "बिझनेस": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Bombay_Stock_Exchange_building.jpg/800px-Bombay_Stock_Exchange_building.jpg",
      "तंत्रज्ञान": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/ISRO_Bhavan.jpg/800px-ISRO_Bhavan.jpg",
      "शिक्षण": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Mumbai_University_Fort_Campus.jpg/800px-Mumbai_University_Fort_Campus.jpg",
      "मनोरंजन": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mumbai_Film_City.jpg/800px-Mumbai_Film_City.jpg",
      "देश": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/India_Gate_in_New_Delhi_03-2016.jpg/800px-India_Gate_in_New_Delhi_03-2016.jpg",
      "जग": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Globe.svg/800px-Globe.svg.png",
      "महाराष्ट्र": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Raigad_Fort_Maha.jpg/800px-Raigad_Fort_Maha.jpg",
      "आरोग्य": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/KEM_Hospital_Mumbai.jpg/800px-KEM_Hospital_Mumbai.jpg",
      "लाईफस्टाईल": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marine_Drive_Mumbai_Sunset.jpg/800px-Marine_Drive_Mumbai_Sunset.jpg",
      "व्हिडिओ": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mumbai_skyline_Bandra_Worli_Sea_Link.jpg/800px-Mumbai_skyline_Bandra_Worli_Sea_Link.jpg"
    };
    return fallbacks[category] || PLACEHOLDER;
  },

  async fetchNewsImage(query, article) {
    if (mediaCache.has(query)) return mediaCache.get(query);

    try {
      // Map Marathi categories to English concepts for Wikimedia Commons search
      let searchKeyword = "Maharashtra";
      const cat = article.category;
      if (cat === "मुंबई") searchKeyword = "Mumbai city";
      if (cat === "राजकारण") searchKeyword = "Maharashtra politics";
      if (cat === "देश") searchKeyword = "India news";
      if (cat === "जग") searchKeyword = "Global";
      if (cat === "क्रीडा") searchKeyword = "Cricket India";
      if (cat === "बिझनेस") searchKeyword = "Bombay Stock Exchange";

      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchKeyword)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json&origin=*`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.query && data.query.pages) {
          const pages = data.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId] && pages[pageId].imageinfo && pages[pageId].imageinfo[0]) {
            const imageUrl = pages[pageId].imageinfo[0].url;
            mediaCache.set(query, imageUrl);
            return imageUrl;
          }
        }
      }
    } catch (e) {
      console.warn("[News] Wikimedia API failed or timed out:", e);
    }

    // If API fails or returns no results, use our highly reliable Wikipedia static fallbacks
    return '';
  }
};

const VideoService = {
  async fetchNewsVideo(query, article) {
    if (mediaCache.has(query + "_video")) return mediaCache.get(query + "_video");

    const thumbUrl = await ImageService.fetchNewsImage(query + " video", article);
    mediaCache.set(query + "_video", thumbUrl);
    return thumbUrl;
  }
};

const MediaService = {
  async enrichArticles(articles) {
    if (!articles) return;
    const items = Array.isArray(articles) ? articles : [articles];

    const promises = items.map(async (article) => {
      if (article.image && article.image !== PLACEHOLDER) return;

      const query = buildMediaQuery(article);

      if (article.video) {
        article.image = await VideoService.fetchNewsVideo(query, article);
      } else {
        article.image = await ImageService.fetchNewsImage(query, article);
      }

      if (!article.image) {
        console.error("[News] Image failed to fetch for:", article.title);
        article.image = PLACEHOLDER;
      }

      console.log("[News] Article:", article.title);
      console.log("[News] Image query:", query);
      console.log("[News] Image URL:", article.image);
    });

    await Promise.all(promises);
  }
};

const NewsService = {
  fetchNews: async (category, limit) => {
    return await safeFetchNews(category, limit);
  },
  fetchArticle: async (id) => {
    try {
      const { data: article, error } = await window.supabase
        .from('articles')
        .select('*, category:categories(name), author:profiles(full_name)')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error || !article) throw error;

      const mappedArticle = {
        id: article.id,
        category: article.category ? article.category.name : 'Uncategorized',
        title: article.title,
        summary: article.excerpt || '',
        time: new Date(article.created_at).toLocaleDateString('mr-IN'),
        readTime: '३ मिनिटे',
        author: article.author ? article.author.full_name : 'श्लोक न्यूज',
        featured: article.is_featured,
        trending: article.is_trending,
        mostRead: false,
        body: article.content ? [article.content] : [],
        image: article.featured_image || ''
      };


      return mappedArticle;
    } catch (err) {
      console.warn("Error fetching article from Supabase:", err);
      return null;
    }
  },
  fetchTrending: async () => {
    try {
      const { data: articles, error } = await window.supabase
        .from('articles')
        .select('*, category:categories(name), author:profiles(full_name)')
        .eq('status', 'published')
        .eq('is_trending', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const mappedData = articles.map(a => ({
        id: a.id,
        category: a.category ? a.category.name : 'Uncategorized',
        title: a.title,
        summary: a.excerpt || '',
        time: new Date(a.created_at).toLocaleDateString('mr-IN'),
        readTime: '३ मिनिटे',
        author: a.author ? a.author.full_name : 'श्लोक न्यूज',
        featured: a.is_featured,
        trending: a.is_trending,
        mostRead: false,
        body: a.content ? [a.content] : [],
        image: a.featured_image || ''
      }));


      return mappedData;
    } catch (err) {
      console.warn("Error fetching trending from Supabase:", err);
      return [];
    }
  },
  fetchBreaking: async () => {
    try {
      const { data: alerts, error } = await window.supabase
        .from('breaking_news')
        .select('title')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return alerts.map(a => a.title);
    } catch (err) {
      console.warn("Error fetching breaking news:", err);
      return [];
    }
  }
};

/* ---------- Location helper ---------- */
/**
 * Derives a { city, state } object from an article's category.
 * If the Supabase row ever gains a dedicated location column,
 * that value will take priority over this fallback map.
 */
function getLocationFromCategory(category) {
  const map = {
    'मुंबई': { city: 'Mumbai', state: 'Maharashtra' },
    'महाराष्ट्र': { city: '', state: 'Maharashtra' },
    'राजकारण': { city: 'Mumbai', state: 'Maharashtra' },
    'देश': { city: 'New Delhi', state: 'Delhi' },
    'जग': { city: '', state: '' },
    'क्रीडा': { city: 'Mumbai', state: 'Maharashtra' },
    'बिझनेस': { city: 'Mumbai', state: 'Maharashtra' },
    'तंत्रज्ञान': { city: 'Pune', state: 'Maharashtra' },
    'मनोरंजन': { city: 'Mumbai', state: 'Maharashtra' },
    'शिक्षण': { city: 'Pune', state: 'Maharashtra' },
    'आरोग्य': { city: 'Mumbai', state: 'Maharashtra' },
    'लाइफस्टाइल': { city: 'Mumbai', state: 'Maharashtra' },
  };
  return map[category] || { city: 'Mumbai', state: 'Maharashtra' };
}

/* ---------- Dynamic hero accent system ---------- */

/**
 * Returns a rich editorial colour palette based on article category.
 * Used as the reliable fallback when canvas extraction is blocked by CORS.
 */
function buildCategoryAccentPalette(category) {
  const palettes = {
    'महाराष्ट्र': { accent: '#92400E', surface: '#FFFBEB', line: '#B45309', badge: 'rgba(120,53,15,0.84)' },
    'मुंबई': { accent: '#1E3A8A', surface: '#EFF6FF', line: '#2563EB', badge: 'rgba(30,58,138,0.84)' },
    'राजकारण': { accent: '#7C2D12', surface: '#FFF7ED', line: '#C2410C', badge: 'rgba(124,45,18,0.86)' },
    'देश': { accent: '#991B1B', surface: '#FEF2F2', line: '#DC2626', badge: 'rgba(127,29,29,0.85)' },
    'जग': { accent: '#134E4A', surface: '#F0FDFA', line: '#0D9488', badge: 'rgba(19,78,74,0.84)' },
    'क्रीडा': { accent: '#14532D', surface: '#F0FDF4', line: '#16A34A', badge: 'rgba(20,83,45,0.85)' },
    'बिझनेस': { accent: '#1E3A5F', surface: '#EFF6FF', line: '#1D4ED8', badge: 'rgba(30,58,95,0.86)' },
    'तंत्रज्ञान': { accent: '#3B0764', surface: '#FAF5FF', line: '#7C3AED', badge: 'rgba(59,7,100,0.85)' },
    'मनोरंजन': { accent: '#881337', surface: '#FFF1F2', line: '#E11D48', badge: 'rgba(136,19,55,0.85)' },
    'शिक्षण': { accent: '#1E3A8A', surface: '#EFF6FF', line: '#3B82F6', badge: 'rgba(30,58,138,0.85)' },
    'आरोग्य': { accent: '#065F46', surface: '#ECFDF5', line: '#059669', badge: 'rgba(6,95,70,0.84)' },
    'लाइफस्टाइल': { accent: '#6B21A8', surface: '#FAF5FF', line: '#9333EA', badge: 'rgba(107,33,168,0.84)' },
  };
  return palettes[category] || { accent: '#9B1C1C', surface: '#FFF5F5', line: '#E31822', badge: 'rgba(127,29,29,0.84)' };
}

/** Stamps a palette as CSS custom properties on the card element.
 *  Also derives --hero-accent-soft and --hero-accent-glow automatically
 *  so every palette (category fallback or canvas-extracted) gets them. */
function applyHeroAccent(cardEl, palette) {
  if (!cardEl) return;
  cardEl.style.setProperty('--hero-accent', palette.accent);
  cardEl.style.setProperty('--hero-surface', palette.surface);
  cardEl.style.setProperty('--hero-line', palette.line);
  cardEl.style.setProperty('--hero-badge-bg', palette.badge);

  // Derive soft + glow from the accent hex (e.g. "#9B1C1C")
  const m = palette.accent.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (m) {
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    cardEl.style.setProperty('--hero-accent-soft', `rgba(${r},${g},${b},0.08)`);
    cardEl.style.setProperty('--hero-accent-glow', `rgba(${r},${g},${b},0.26)`);
  }
}

/**
 * Attempts canvas pixel-sampling to derive a dominant colour from the hero
 * image. Falls back silently to the category palette on CORS or any error.
 * Always applies the category fallback first so the card is never unstyled.
 */
function extractAndApplyColors(imgEl, cardEl, category) {
  const fallback = buildCategoryAccentPalette(category);
  applyHeroAccent(cardEl, fallback);               // immediate — no flash

  try {
    const W = 64, H = 36;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, W, H);              // throws SecurityError on CORS
    const { data } = ctx.getImageData(0, 0, W, H);

    let rS = 0, gS = 0, bS = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma > 28 && luma < 228) { rS += r; gS += g; bS += b; n++; }
    }
    if (n === 0) return;

    const rA = rS / n, gA = gS / n, bA = bS / n;
    const mx = Math.max(rA, gA, bA), mn = Math.min(rA, gA, bA);
    if (mx === 0 || (mx - mn) / mx < 0.18) return;    // desaturated — keep fallback

    const hex = v => Math.round(v).toString(16).padStart(2, '0');
    const dk = 0.60;
    const accent = `#${hex(rA * dk)}${hex(gA * dk)}${hex(bA * dk)}`;
    const lm = 0.78;
    const line = `#${hex(Math.min(255, rA * lm))}${hex(Math.min(255, gA * lm))}${hex(Math.min(255, bA * lm))}`;
    const badge = `rgba(${Math.round(rA * 0.13)},${Math.round(gA * 0.13)},${Math.round(bA * 0.13)},0.84)`;
    const sr = Math.round(255 - (255 - rA) * 0.07);
    const sg = Math.round(255 - (255 - gA) * 0.07);
    const sb = Math.round(255 - (255 - bA) * 0.07);
    const surface = `#${hex(sr)}${hex(sg)}${hex(sb)}`;
    applyHeroAccent(cardEl, { accent, surface, line, badge });
  } catch (_) {
    /* Cross-origin — category fallback already applied */
  }
}

/* ---------- Helpers ---------- */
// Updated safeFetchNews and renderHome for GNews API via Supabase Edge Function

function mapCategoryToGNews(category) {
  const map = {
    'तंत्रज्ञान': { category: 'technology' },
    'मनोरंजन': { category: 'entertainment' },
    'बिझनेस': { category: 'business' },
    'क्रीडा': { category: 'sports' },
    'आरोग्य': { category: 'health' },
    'विज्ञान': { category: 'science' },
    'देश': { category: 'nation' },
    'जग': { category: 'world' },
    'महाराष्ट्र': { search: 'महाराष्ट्र' },
    'मुंबई': { search: 'मुंबई' },
    'पुणे': { search: 'पुणे' },
    'राजकारण': { search: 'राजकारण' }
  };
  return map[category] || { category: 'general' };
}

// Updated safeFetchNews and renderHome for GNews API via Supabase Edge Function

function mapCategoryToGNews(category) {
  const map = {
    'तंत्रज्ञान': { category: 'technology' },
    'मनोरंजन': { category: 'entertainment' },
    'बिझनेस': { category: 'business' },
    'क्रीडा': { category: 'sports' },
    'आरोग्य': { category: 'health' },
    'विज्ञान': { category: 'science' },
    'देश': { category: 'nation' },
    'जग': { category: 'world' },
    'महाराष्ट्र': { search: 'महाराष्ट्र' },
    'मुंबई': { search: 'मुंबई' },
    'पुणे': { search: 'पुणे' },
    'राजकारण': { search: 'राजकारण' }
  };
  return map[category] || { category: 'general' };
}

let apiErrorMessage = "";

// Queue for API requests to avoid rate limits (1 req/sec)
let apiRequestQueue = Promise.resolve();

async function safeFetchNews(category, limit) {
  const cacheKey = `gnews_cache_${category || 'general'}_${limit || 'all'}`;
  const cacheStr = localStorage.getItem(cacheKey);
  if (cacheStr) {
    try {
      const cached = JSON.parse(cacheStr);
      // 2-hour TTL (7200000 ms)
      if (Date.now() - cached.timestamp < 7200000) {
        return cached.data;
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }

  // Chain this request onto the end of the queue, with a 1 second delay
  return new Promise((resolve) => {
    apiRequestQueue = apiRequestQueue.then(async () => {
      try {
    const apiParams = mapCategoryToGNews(category);
    
    // Call the Supabase Edge Function
    const { data, error } = await window.supabase.functions.invoke('get-news', {
      body: { 
        category: apiParams.category || 'general',
        search: apiParams.search || '',
        language: 'mr',
        country: 'in'
      }
    });

    if (error) {
      console.warn("Edge function invocation failed:", error);
      apiErrorMessage = error.message;
      return resolve([]);
    }

    if (!data || !data.success) {
      console.warn("API responded with an error:", data ? data.error : "Unknown error");
      apiErrorMessage = data ? data.error : "Unknown error";
      return resolve([]);
    }

    let articles = data.articles || [];
    if (limit) {
      articles = articles.slice(0, limit);
    }

    // Normalize to the format expected by the frontend
    let mappedData = articles.map(a => {
      const cat = category || 'ताज्या बातम्या';
      return {
        id: encodeURIComponent(a.url),
        category: cat,
        title: a.title,
        summary: a.description || '',
        time: new Date(a.publishedAt).toLocaleDateString('mr-IN'),
        readTime: '३ मिनिटे',
        author: a.source || 'GNews API',
        featured: false,
        trending: false,
        mostRead: false,
        body: [a.description || ''],
        image: a.image || '',
        video: false,
        url: a.url
      };
    });

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: mappedData
      }));
    } catch (e) {
      console.warn("localStorage quota exceeded");
    }

    resolve(mappedData);
    } catch (err) {
      console.error("GNews API fetch failed:", err);
      apiErrorMessage = err.message || err.toString();
      resolve([]);
    } finally {
      // Add 1.1s delay before the next request can process
      await new Promise(r => setTimeout(r, 1100));
    }
    });
  });
}

async function renderHome() {
  const main = document.getElementById("main-content");
  
  if (!newsData || newsData.length === 0) {
    // Fetch multiple categories in parallel to populate the homepage
    try {
      const [general, tech, ent, regional] = await Promise.all([
        safeFetchNews('general'),
        safeFetchNews('तंत्रज्ञान'),
        safeFetchNews('मनोरंजन'),
        safeFetchNews('महाराष्ट्र')
      ]);
      
      // Mark some general news as featured/breaking randomly for UI purposes
      if (general.length > 0) {
        general[0].featured = true;
        general[1].breaking = true;
      }
      
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
    } catch (e) {
      console.error("Failed to fetch homepage data", e);
    }
  }

  if (newsData.length === 0) {
    if (apiErrorMessage) {
      console.error(`GNews API Error: ${apiErrorMessage}`);
    }
    const errorMsg = 'बातम्या सध्या उपलब्ध नाहीत. कृपया थोड्या वेळानं पुन्हा प्रयत्न करा.';
    if (main) main.innerHTML = `<div class="empty-state"><p>${errorMsg}</p><button onclick="window.location.reload()" class="retry-btn">पुन्हा प्रयत्न करा</button></div>`;
    return;
  }

  // Use the new render functions
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


async function safeFetchArticle(id) {
  try {
    const res = await NewsService.fetchArticle(id);
    if (!res) throw new Error("Empty response");
    return res;
  } catch (err) {
    console.warn("Article fetch failed:", err);
    return null;
  }
}

function safeInitIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try {
      lucide.createIcons();
    } catch (e) {
      console.warn("Lucide init caught an error:", e);
    }
  }
}
function byId(id) {
  return newsData.find((n) => String(n.id) === String(id));
}

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
  } catch (e) {
    console.warn("Storage unavailable:", e);
    return [];
  }
}

function setBookmarks(ids) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn("Storage unavailable:", e);
  }
}

function isBookmarked(id) {
  return getBookmarks().includes(Number(id));
}

function toggleBookmark(id) {
  const n = Number(id);
  let list = getBookmarks();
  if (list.includes(n)) list = list.filter((x) => x !== n);
  else list.push(n);
  setBookmarks(list);
  return list.includes(n);
}

function safeImg(src, alt, lazy = true) {
  const loading = lazy ? ' loading="lazy"' : "";
  return `<img src="${src}" alt="${alt}"${loading} onerror="this.onerror=null;this.src='${PLACEHOLDER}';" />`;
}

function articleUrl(id) {
  return `article.html?id=${id}`;
}

function catUrl(cat) {
  return `category.html?cat=${encodeURIComponent(cat)}`;
}

function toDev(n) {
  return String(n).replace(/\d/g, (d) => "०१२३४५६७८९"[d]);
}

function padRank(n) {
  return String(n)
    .padStart(2, "0")
    .replace(/\d/g, (d) => "०१२३४५६७८९"[d]);
}

/* ---------- Experience mode (ALWAYS keeps toggle in header) ---------- */
function applyExperience(mode) {
  const m = mode === "classic" ? "classic" : "modern";
  document.body.dataset.experience = m;
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch (e) {
    console.warn("Storage unavailable:", e);
  }

  document.querySelectorAll(".exp-btn").forEach((btn) => {
    const active = btn.dataset.experience === m;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  // Presentation only — re-apply layout classes without destroying content
  document.body.classList.remove("is-classic", "is-modern");
  document.body.classList.add(m === "classic" ? "is-classic" : "is-modern");
}

function initExperience() {
  try {
    const legacy = localStorage.getItem("shlok-reading-mode");
    if (legacy && !localStorage.getItem(MODE_KEY)) {
      localStorage.setItem(MODE_KEY, legacy === "classic" ? "classic" : "modern");
    }
  } catch (e) {
    console.warn("Storage unavailable:", e);
  }

  let saved = "modern";
  try {
    saved = localStorage.getItem(MODE_KEY) || "modern";
  } catch (e) {
    console.warn("Storage unavailable:", e);
  }
  applyExperience(saved);

  // CSS-only switch — NEVER re-render page / NEVER remove toggle or content
  document.querySelectorAll(".exp-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyExperience(btn.dataset.experience);
    });
  });
}

function currentExperience() {
  return document.body.dataset.experience === "classic" ? "classic" : "modern";
}

/* ---------- Menu / Lang / Search ---------- */
function initMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;

  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
  }

  const close = () => {
    nav.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    nav.classList.add("is-open");
    backdrop.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => (nav.classList.contains("is-open") ? close() : open()));
  backdrop.addEventListener("click", close);
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

function initLang() {
  const switchEl = document.getElementById("lang-switch");
  if (!switchEl) return;

  const trigger = document.getElementById("lang-trigger");
  const menu = document.getElementById("lang-menu");

  if (trigger && menu) {
    trigger.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#lang-switch")) {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  switchEl.querySelectorAll(".lang-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      switchEl.querySelectorAll(".lang-option").forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      if (trigger && menu) {
        trigger.innerHTML = `${opt.textContent} <span aria-hidden="true">▾</span>`;
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function initSearch() {
  const openBtn = document.getElementById("search-open");
  const closeBtn = document.getElementById("search-close");
  const overlay = document.getElementById("search-overlay");
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!openBtn || !overlay || !input || !results) return;

  const open = () => {
    overlay.hidden = false;
    input.value = "";
    results.innerHTML = "";
    setTimeout(() => input.focus(), 40);
  };
  const close = () => {
    overlay.hidden = true;
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = "";
      return;
    }
    const matches = newsData
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q)
      )
      .slice(0, 12);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">कोणतेही निकाल सापडले नाहीत.</p>`;
      return;
    }

    results.innerHTML =
      `<p style="font-weight:700;margin-bottom:.5rem;">शोध परिणाम (${toDev(matches.length)})</p>` +
      matches
        .map(
          (n) => `
      <a class="search-result" href="${articleUrl(n.id)}">
        ${safeImg(n.image, n.title)}
        <div>
          <span class="cat-badge">${n.category}</span>
          <h3 class="headline">${n.title}</h3>
          <div class="meta"><span>${n.time}</span></div>
        </div>
      </a>`
        )
        .join("");
  });
}

/* ---------- Cards ---------- */
function storyCard(n, variant = "") {
  const cls = variant ? `story-card story-card--${variant}` : "story-card";
  return `
  <a class="${cls}" href="${articleUrl(n.id)}">
    <div class="media">${safeImg(n.image, n.title)}</div>
    <div class="body">
      <span class="cat-badge">${n.category}</span>
      <h3 class="headline">${n.title}</h3>
      ${variant === "lg" ? `<p class="summary">${n.summary}</p>` : ""}
      <div class="meta"><span>${n.time}</span><span>${n.readTime} वाचन</span></div>
    </div>
  </a>`;
}

function sideStory(n) {
  return `
  <a class="side-story" href="${articleUrl(n.id)}">
    <div class="thumb">${safeImg(n.image, n.title)}</div>
    <div>
      <span class="cat-badge">${n.category}</span>
      <h3 class="headline">${n.title}</h3>
      <div class="meta"><span>${n.time}</span></div>
    </div>
  </a>`;
}

function listRow(n) {
  return `
  <a class="list-row" href="${articleUrl(n.id)}">
    <div class="thumb">${safeImg(n.image, n.title)}</div>
    <div>
      <span class="cat-badge">${n.category}</span>
      <h3 class="headline">${n.title}</h3>
      <div class="meta"><span>${n.time}</span></div>
    </div>
  </a>`;
}

/* ---------- Render sections ---------- */
function renderBreaking() {
  const el = document.getElementById("breaking-ticker");
  if (!el) return;
  if (!BREAKING || BREAKING.length === 0) {
    el.innerHTML = '<span class="ticker-item">ताज्या बातम्या लवकरच अपडेट होतील...</span>';
    return;
  }
  // Duplicate enough times to ensure seamless scrolling
  const items = [...BREAKING, ...BREAKING, ...BREAKING, ...BREAKING];
  el.innerHTML = items
    .map((t) => `<span class="ticker-item">${t}</span>`)
    .join("");
}

function renderHero() {
  const section = document.getElementById("hero-section");
  if (!section) return;

  const feature = newsData.find((n) => n.featured && !n.video) || newsData[0];
  if (!feature) {
    section.innerHTML = `<div class="empty-state"><p>सध्या कोणतीही बातमी उपलब्ध नाही.</p></div>`;
    return;
  }

  const remaining = newsData.filter((n) => n.id !== feature.id && !n.video);
  // Distribute articles — 9 items across the two editorial streams
  const secondary = remaining.slice(0, 11);
  const s = (i) => secondary[i] || null; // safe accessor

  // Helper: compact horizontal news item (small thumb left, text right)
  function rnaItem(n) {
    if (!n) return '';
    return `
      <a class="rna-item" href="${articleUrl(n.id)}">
        <div class="rna-item__thumb">${safeImg(n.image, n.title)}</div>
        <div class="rna-item__text">
          <span class="rna-item__cat">${n.category}</span>
          <h3 class="rna-item__title">${n.title}</h3>
          <span class="rna-item__meta">${n.time}</span>
        </div>
      </a>`;
  }

  // Build related stories HTML for the center column
  let relatedHtml = '';
  // Use items 0-3 for related stories (4 items)
  for (let i = 0; i < 4; i++) {
    if (s(i)) {
      relatedHtml += `
        <a class="related-news-card premium-editorial-card" href="${articleUrl(s(i).id)}">
          <div class="pec-image">${safeImg(s(i).image, s(i).title)}</div>
          <div class="pec-content">
            <div class="pec-category">${s(i).category || 'ताज्या बातम्या'}</div>
            <h3 class="pec-headline">${s(i).title}</h3>
            <div class="pec-meta-row">
              <div class="pec-meta-left">
                <span class="pec-date">${s(i).time || ''}</span>
              </div>
              <div class="pec-meta-right">
                <svg class="pec-bookmark" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                <div class="pec-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </div>
          </div>
        </a>`;
    }
  }

  // Adjust right panel to use remaining secondary stories
  const rightPanelHtml = `
    <div class="right-news-section">

      <!-- COLUMN A: Brand module + compact news items -->
      <div class="rna-column-a">

        <!-- Branded top module -->
        <div class="rna-brand-module">
          <div class="rna-brand-header">
            <div class="superfast-logo">
              <span class="sf-word">सुपरफ़ास्ट</span>
              <div class="sf-right">
                <div class="sf-lines">
                  <div class="sf-line sf-line-1"></div>
                  <div class="sf-line sf-line-2"></div>
                  <div class="sf-line sf-line-3"></div>
                </div>
                <span class="sf-news">NEWS</span>
              </div>
            </div>
            <span class="rna-brand-tagline">सर्वात कमी वेळेत सर्वाधिक बातम्या...</span>
          </div>
          ${s(4) ? `
          <a class="rna-brand-story" href="${articleUrl(s(4).id)}">
            <div class="rna-brand-story__thumb">${safeImg(s(4).image, s(4).title)}</div>
            <div class="rna-brand-story__text">
              <h3 class="rna-brand-story__title">${s(4).title}</h3>
              <div class="rna-more-wrapper"><span class="rna-more">और भी &rarr;</span></div>
            </div>
          </a>` : ''}
        </div>

        <!-- Column A Stories -->
        ${rnaItem(s(5))}
        ${rnaItem(s(6))}
        ${rnaItem(s(7))}

      </div>

      <!-- COLUMN B: Ad slot + compact news items + promo -->
      <div class="rna-column-b">

        <!-- Top advertisement creative -->
        <div class="rna-ad-top" role="complementary" aria-label="Advertisement">
          <span class="rna-ad-label">ADVERTISEMENT</span>
          <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=300&h=250&auto=format&fit=crop" alt="Advertisement" class="rna-ad-img" />
        </div>

        <!-- Column B Stories -->
        ${rnaItem(s(8))}
        ${rnaItem(s(9))}
        ${rnaItem(s(10))}

        <!-- Bottom promotional banner -->
        <div class="rna-promo-strip" role="complementary" aria-label="Promotional">
          <img src="https://images.unsplash.com/photo-1557838923-2985c318b67f?q=80&w=300&h=120&auto=format&fit=crop" alt="Promotional Banner" class="rna-promo-img" />
        </div>

      </div>

    </div>`;

  // Build location badge HTML — only rendered if city or state is present
  const loc = feature.location || {};
  const locCity = (loc.city || '').trim();
  const locState = (loc.state || '').trim();
  let locationBadgeHtml = '';
  if (locCity || locState) {
    const locLabel = locCity && locState ? `${locCity}, ${locState}`
      : locCity || locState;
    const ariaLabel = `Article location: ${locLabel}`;
    locationBadgeHtml = `
      <div class="location-badge" aria-label="${ariaLabel}" role="note">
        <i data-lucide="map-pin" class="loc-pin-icon" aria-hidden="true"></i>
        <span class="loc-text">${locLabel}</span>
      </div>`;
  }

  section.innerHTML = `
    <div class="article-layout-grid">
      <!-- CENTER COLUMN: Hero + Related -->
      <div class="center-editorial-column">
        <!-- Main Feature -->
        <article class="main-feature-card" id="main-feature-card">
          <a href="${articleUrl(feature.id)}" style="display:block; text-decoration:none; color:inherit; position: relative;">
            <span class="premium-latest-badge">नवीन अपडेट</span>
            <div class="main-feature-headline">
              <h1 class="hero-headline-large">${feature.title}</h1>
            </div>
            <div class="main-feature-media">
              ${locationBadgeHtml}
              <img id="hero-img" src="${feature.image || 'https://placehold.co/800x450/111827/FFFFFF?text=News'}" alt="Hero Image" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='https://placehold.co/800x450/111827/FFFFFF?text=News';" />
            </div>
            <div class="main-feature-summary">
              <p class="hero-summary-text">${feature.summary ? feature.summary.substring(0, 150) + '...' : ''}</p>
              <div class="meta">
                <span>श्लोक न्यूज • ${feature.time} • ${feature.readTime}</span>
              </div>
            </div>
          </a>
        </article>
        
        <!-- Related Stories -->
        <div class="related-news-grid">
          ${relatedHtml}
        </div>
      </div>

      <!-- Right News Feed -->
      ${rightPanelHtml}

    </div>
  `;

  // Re-init Lucide icons so the map-pin inside the badge renders
  safeInitIcons();

  // Dynamic colour extraction — apply category palette immediately,
  // then attempt canvas sampling once the image is ready.
  const cardEl = document.getElementById('main-feature-card');
  const imgEl = document.getElementById('hero-img');
  if (cardEl && imgEl) {
    extractAndApplyColors(imgEl, cardEl, feature.category);
    if (!imgEl.complete) {
      imgEl.addEventListener('load', () => extractAndApplyColors(imgEl, cardEl, feature.category), { once: true });
    }
  }
}

function renderFresh() {
  const list = document.getElementById("fresh-list");
  if (!list) return;

  const items = newsData.filter((n) => !n.video && !n.featured).slice(0, 5);

  list.innerHTML = items
    .map(
      (n) => `
    <li class="sidebar-list-item">
      <a class="sidebar-list-link" href="${articleUrl(n.id)}">
        <span class="cat-bullet">● ${n.category}</span>
        <h3 class="sidebar-list-headline">${n.title}</h3>
        <div class="sidebar-list-meta"><span>${n.time}</span></div>
      </a>
    </li>`
    )
    .join("");
}

function renderTrending() {
  const els = [document.getElementById("trending-list"), document.getElementById("sidebar-trending-list")];
  const items = newsData.slice(0, 5);

  const html = items.map((n, i) => `
    <li class="trending-item">
      <div class="trending-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="trending-content">
        <a href="${articleUrl(n.id)}">
          <h4 class="trending-title">${n.title}</h4>
          <span class="trending-meta">${n.time}</span>
        </a>
      </div>
    </li>
  `).join("");

  els.forEach(el => {
    if (el) el.innerHTML = html;
  });
}

function renderQuick() {
  const rail = document.getElementById("quick-rail");
  if (!rail) return;
  const items = newsData.filter((n) => !n.video).slice(4, 8);
  rail.innerHTML = `<div class="premium-quick-grid-fixed">` + items
    .map(
      (n, i) => `
      <a class="quick-card-premium premium-editorial-card" href="${articleUrl(n.id)}">
        <div class="pec-image">${safeImg(n.image, n.title)}</div>
        <div class="pec-content">
          <div class="pec-category">${n.category || 'झटपट वाचा'}</div>
          <h3 class="pec-headline">${n.title}</h3>
          ${n.summary ? `<p class="pec-summary">${n.summary}</p>` : ''}
          <div class="pec-meta-row">
            <div class="pec-meta-left">
              <span class="pec-date">${n.time || ''}</span>
              <span class="pec-dot"></span>
              <span class="pec-read">${n.readTime || '३ मिनिटे'}</span>
            </div>
            <div class="pec-meta-right">
              <svg class="pec-bookmark" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
              <div class="pec-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </a>`
    ).join("") + `</div>`;
}

function renderCategorySections() {
  const container = document.getElementById("category-sections");
  if (!container) return;

  const html = CATEGORY_BLOCKS.map(block => {
    let items = newsData.filter(n => n.category === block.cat && !n.video);
    if (block.also) {
      items = items.concat(newsData.filter(n => n.category === block.also && !n.video));
    }

    

    items = items.slice(0, 4);
    if (items.length === 0) return '';

    let innerHTML = `
      <div class="premium-quick-grid">
        ${items.map(s => `
          <a class="quick-card-premium" href="${articleUrl(s.id)}">
              <div class="thumb">${safeImg(s.image, s.title)}</div>
              <div class="body">
                <h4 class="headline">${s.title}</h4>
                ${s.summary ? `<p class="pec-summary">${s.summary}</p>` : ''}
                <div class="premium-meta-wrapper">
                  <span class="meta" style="font-size:12px;color:#777;">${s.time || ''}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="card-arrow"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </a>
        `).join('')}
      </div>
    `;

    return `
      <section class="section premium-cat-section">
        <div class="section-head">
          <h2 class="section-title">${block.title || block.cat}</h2>
        </div>
        ${innerHTML}
      </section>
    `;
  }).join("");

  container.innerHTML = html;
}

async function renderShortVideoSection() {
  const container = document.getElementById("short-video-section");
  if (!container) return;

  let shorts = [];
  try {
    if (window.supabase) {
      const { data, error } = await window.supabase
        .from('videos')
        .select('*')
        .eq('status', 'published')
        .eq('video_type', 'SHORT_VIDEO')
        .order('published_at', { ascending: false })
        .limit(4);
      if (!error && data && data.length > 0) shorts = data;
    }
  } catch (e) { }

  if (shorts.length < 4) {
    // Pad with regular news data if we have less than 4 short videos
    
  }

  const html = `
    <div class="sv-section-header">
      <h2>शॉर्ट वीडियो</h2>
    </div>
    <div class="short-video-grid">
      ${shorts.map(s => `
        <a class="short-video-card" href="${s.video_url || articleUrl(s.id)}">
          <div class="sv-top-banner">
            ${s.category || 'स्पेशल'}
          </div>
          <img src="${s.thumbnail_url || s.image}" alt="${s.title}" />
          <div class="sv-play-icon">
            <i data-lucide="play"></i>
          </div>
          <div class="sv-bottom-gradient">
            <h3 class="sv-bottom-headline">${s.title}</h3>
          </div>
        </a>
      `).join('')}
    </div>
  `;
  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function renderLatest() {
  const feed = document.getElementById("latest-feed");
  if (!feed) return;
  const items = newsData.filter((n) => !n.video && !n.is_breaking).slice(4, 13);
  if (items.length < 9) {
    
  }

  const col1Items = items.slice(0, 4);
  const col2Item = items[4] || items[0];
  const col3Item = items[5] || items[0];
  const col4Items = items.slice(6, 9);

  feed.innerHTML = `
    <div class="premium-bk-grid">
      <!-- Column 1: Text list -->
      <div class="bk-col bk-col-1">
        ${col1Items.map(n => `
          <a class="bk-text-item" href="${articleUrl(n.id)}">
            <h3 class="bk-text-headline">${n.title}</h3>
          </a>
        `).join("")}
      </div>
      
      <!-- Column 2: Vertical Card -->
      <div class="bk-col">
        <a class="bk-vert-card" href="${articleUrl(col2Item.id)}">
          <div class="thumb">${safeImg(col2Item.image, col2Item.title)}</div>
          <div class="body">
            <h3 class="headline">${col2Item.title}</h3>
          </div>
        </a>
      </div>
      
      <!-- Column 3: Vertical Card -->
      <div class="bk-col">
        <a class="bk-vert-card" href="${articleUrl(col3Item.id)}">
          <div class="thumb">${safeImg(col3Item.image, col3Item.title)}</div>
          <div class="body">
            <h3 class="headline">${col3Item.title}</h3>
          </div>
        </a>
      </div>
      
      <!-- Column 4: Red Special Box -->
      <div class="bk-col">
        <div class="bk-special-box">
          <div class="bk-special-header">शलोक विशेष</div>
          <div class="bk-special-list">
            ${col4Items.map(n => `
              <a class="bk-special-item" href="${articleUrl(n.id)}">
                <div class="thumb">${safeImg(n.image, n.title)}</div>
                <h4 class="headline">${n.title}</h4>
              </a>
            `).join("")}
          </div>
          <a href="category.html?cat=विशेष" class="bk-special-footer">और भी <i data-lucide="chevron-right" style="width:16px;height:16px;"></i></a>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

async function renderVideos() {
  const section = document.getElementById("video-news");
  if (!section) return;

  try {
    const { data: videos, error } = await window.supabase
      .from('videos')
      .select('*, category:categories(name)')
      .eq('status', 'published')
      .eq('video_type', 'NORMAL_VIDEO')
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    if (!videos || videos.length === 0) {
      section.innerHTML = `<div class="empty-state"><p>सध्या कोणतेही व्हिडिओ उपलब्ध नाहीत.</p></div>`;
      return;
    }

    const featured = videos[0] || newsData.find(n => n.video);
    if (!featured) return;

    let smallVideos = videos.slice(1, 5);

    // Pad smallVideos if we don't have enough from DB
    let remaining = [...newsData].filter(n => n.video && n.id !== featured.id && !smallVideos.some(s => s.id === n.id));
    

    const leftColVideos = smallVideos.slice(0, 2);
    const rightColVideos = smallVideos.slice(2, 4);

    const renderSmallCard = (vid) => `
      <a class="video-side-item" href="video-detail.html?id=${vid.id}">
        <div class="thumb-wrap">
          <img src="${vid.thumbnail_url || vid.image}" loading="lazy" alt="${vid.title}" />
          <div class="duration-badge"><i data-lucide="play" style="width:10px;height:10px;fill:#fff;"></i> 2:30</div>
        </div>
        <h4 class="headline">${vid.title}</h4>
      </a>
    `;

    section.innerHTML = `
      <div class="video-section-inner">
        <div class="video-section-header">
          <h2>व्हिडिओ</h2>
          <a href="video.html">और भी →</a>
        </div>
        <div class="video-section-grid">
          <!-- Left Column -->
          <div class="video-side-column">
            ${leftColVideos.map(renderSmallCard).join('')}
          </div>
          
          <!-- Middle Column -->
          <a class="video-featured" href="video-detail.html?id=${featured.id}">
            <img class="video-featured-media" src="${featured.thumbnail_url || featured.image}" alt="${featured.title}" />
            <div class="video-featured-overlay">
              <h3>${featured.title}</h3>
              <div class="video-play-button"><i data-lucide="play" style="fill:#fff; width:24px; height:24px; margin-left: 4px;"></i></div>
            </div>
          </a>
          
          <!-- Right Column -->
          <div class="video-side-column">
            ${rightColVideos.map(renderSmallCard).join('')}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.warn("Video block fetch failed:", err);
    rail.innerHTML = `<div class="empty-state"><p>व्हिडिओ बातम्या लोड करण्यात अडचण आली.</p></div>`;
  }
}

async function renderShortVideos() {
  const rail = document.getElementById("short-video-rail");
  if (!rail) return;

  try {
    const { data: videos, error } = await window.supabase
      .from('videos')
      .select('*, category:categories(name)')
      .eq('status', 'published')
      .eq('video_type', 'SHORT_VIDEO')
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    if (!videos || videos.length === 0) {
      rail.innerHTML = `<div class="empty-state"><p>सध्या कोणतेही शॉर्ट व्हिडिओ उपलब्ध नाहीत.</p></div>`;
      return;
    }

    rail.innerHTML = videos.map(vid => {
      const date = new Date(vid.published_at || vid.created_at).toLocaleDateString('mr-IN');
      const catName = vid.category ? vid.category.name : 'शॉर्ट व्हिडिओ';
      const thumb = vid.thumbnail_url || './assits/shlokmrathi news logo.png';

      return `
        <a href="short-video-detail.html?id=${vid.id}" class="short-video-card-home">
          <div class="thumb-container">
            <img src="${thumb}" alt="${vid.title}" loading="lazy" />
            <span class="play-btn-overlay">▶</span>
          </div>
          <div class="info-overlay">
            <span class="cat-badge">${catName}</span>
            <h3 class="title">${vid.title}</h3>
            <div class="meta">
              <span>${date}</span>
              <span>${vid.views || 0} Views</span>
            </div>
          </div>
        </a>
      `;
    }).join("");

  } catch (err) {
    console.warn("Short videos block fetch failed:", err);
    rail.innerHTML = `<div class="empty-state"><p>शॉर्ट व्हिडिओ लोड करण्यात अडचण आली.</p></div>`;
  }
}

function renderMostRead() {
  const list = document.getElementById("mostread-list");
  if (!list) return;
  const items = (newsData.filter((n) => n.mostRead).length
    ? newsData.filter((n) => n.mostRead)
    : newsData
  )
    .filter((n) => !n.video)
    .slice(0, 5);

  list.innerHTML = items
    .map(
      (n, i) => `
    <li>
      <a class="most-item" href="${articleUrl(n.id)}">
        <span class="most-num">${padRank(i + 1)}</span>
        <h3 class="headline">${n.title}</h3>
      </a>
    </li>`
    )
    .join("");
}

/* Duplicate renderFresh removed */

function renderSidebarWidgets() {
  // Sidebar "सर्वाधिक वाचले"
  const mostreadList = document.getElementById("sidebar-mostread-list");
  if (mostreadList) {
    const mostItems = (newsData.filter((n) => n.mostRead).length
      ? newsData.filter((n) => n.mostRead)
      : newsData
    )
      .filter((n) => !n.video)
      .slice(0, 5);

    mostreadList.innerHTML = mostItems
      .map(
        (n, i) => `
      <li>
        <a class="most-item" href="${articleUrl(n.id)}">
          <span class="most-num">${padRank(i + 1)}</span>
          <h3 class="headline">${n.title}</h3>
        </a>
      </li>`
      )
      .join("");
  }

  // Sidebar "ट्रेंडिंग"
  const trendingList = document.getElementById("sidebar-trending-list");
  if (trendingList) {
    const trendItems = (newsData.filter((n) => n.trending).length
      ? newsData.filter((n) => n.trending)
      : newsData.filter((n) => !n.video)
    ).slice(0, 6);

    trendingList.innerHTML = trendItems
      .map(
        (n) => `
      <a class="trending-sidebar-item" href="${articleUrl(n.id)}">
        <div>
          <span class="cat-badge">${n.category}</span>
          <h3 class="headline">${n.title}</h3>
        </div>
      </a>`
      )
      .join("");
  }
}

function renderTicker() {
  const tickerWrap = document.getElementById("dyn-ticker-wrapper");
  if (!tickerWrap) return;
  const breakingItems = newsData.filter(n => n.breaking || n.featured).slice(0, 5);
  
  
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
    const feature = newsData.find(n => n.featured && !n.video) || (newsData.length > 5 ? newsData[5] : newsData[0]);
      if (!feature) return;
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
      if (items.length === 0) return;
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
      if (items.length === 0) return;
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


/* Public aliases — CSS-only mode switch, same content */
function renderModernLayout() {
  applyExperience("modern");
}

function renderClassicLayout() {
  applyExperience("classic");
}

/* ---------- Article / Category / Saved ---------- */
function renderArticlePage() {
  const root = document.getElementById("article-root");
  const rightSidebarRoot = document.getElementById("right-sidebar-root");

  if (!root || !rightSidebarRoot) return;

  const id = new URLSearchParams(location.search).get("id") || "1";
  const article = byId(id) || newsData[0];
  document.title = `${article.title} | श्लोक मराठी न्यूज`;

  // Right Sidebar Data
  const latestNews = [...newsData].filter(n => !n.video && n.id !== article.id).slice(0, 5);
  const trendingNews = [...newsData].filter(n => !n.video && n.id !== article.id).sort(() => 0.5 - Math.random()).slice(0, 5);
  const relatedNews = newsData.filter((n) => n.category === article.category && n.id !== article.id && !n.video).slice(0, 3);

  // Generate Tags from category or keywords
  const tags = ["#ताज्याबातम्या", "#" + article.category.replace(/\s+/g, ""), "#श्लोकमराठी"];

  // Prepare Article Body with Highlight Box randomly injected or subheadings marked
  let paragraphs = article.body || [article.summary];
  let processedBody = paragraphs.map(p => `<p>${p}</p>`).join("");

  // Create highlight box content based on summary
  const highlights = `
    <div class="editorial-highlight-box fade-in-up">
      <div class="editorial-highlight-title">
        <i data-lucide="zap" style="width:20px;height:20px;"></i> महत्त्वाचे मुद्दे
      </div>
      <ul>
        <li>${article.summary}</li>
        <li>अधिक माहितीसाठी श्लोक मराठी न्यूज वाचत राहा.</li>
        <li>ताज्या घडामोडींसाठी आमचे पेज फॉलो करा.</li>
      </ul>
    </div>
  `;

  // Main Article HTML
  root.innerHTML = `
    <div class="editorial-breadcrumb fade-in-up">
      <a href="index.html">मुख्यपृष्ठ</a> › 
      <a href="category.html?cat=${encodeURIComponent(article.category)}">${article.category}</a> › 
      <span>बातमी</span>
    </div>
    
    <span class="editorial-cat-label fade-in-up">${article.category}</span>
    
    <h1 class="editorial-headline fade-in-up">${article.title}</h1>
    
    <p class="editorial-summary fade-in-up">${article.summary}</p>
    
    <div class="editorial-meta-row fade-in-up">
      <div class="editorial-meta-item"><i data-lucide="pen-tool" style="width:16px;"></i> ✍️ श्लोक मराठी न्यूज डेस्क</div>
      <div class="editorial-meta-item"><i data-lucide="calendar" style="width:16px;"></i> 🕒 प्रकाशित: ${article.time}</div>
      <div class="editorial-meta-item"><i data-lucide="refresh-cw" style="width:16px;"></i> 🔄 अपडेटेड: ५ मिनिटांपूर्वी</div>
      
      <div class="editorial-social">
        <a href="#" class="editorial-social-btn" aria-label="WhatsApp" data-share="wa">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </a>
        <a href="#" class="editorial-social-btn" aria-label="Facebook">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
        </a>
        <a href="#" class="editorial-social-btn" aria-label="X">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l16 16M4 20L20 4"></path></svg>
        </a>
      </div>
    </div>

    <div class="editorial-hero-container fade-in-up">
      ${safeImg(article.image, article.title, false).replace("<img", '<img class="editorial-hero-img"')}
      <p class="editorial-caption">${article.title} — फोटो सौजन्य: श्लोक मराठी न्यूज</p>
    </div>

    <div class="editorial-body fade-in-up">
      ${processedBody.replace('</p>', '</p>' + highlights)}
      <h2 class="editorial-marker">सविस्तर माहिती</h2>
      <p>वरील मुद्द्यांवरून हे स्पष्ट होते की ही बातमी अत्यंत महत्त्वाची आहे. अशाच ताज्या आणि महत्त्वाच्या बातम्या वाचत राहण्यासाठी श्लोक मराठी न्यूजला भेट देत राहा.</p>
    </div>
    
    <div class="editorial-tags fade-in-up">
      <span style="font-weight:600; font-size: 14px; display: flex; align-items: center;">टॅग्स: </span>
      ${tags.map(t => `<a href="#" class="editorial-tag">${t}</a>`).join("")}
    </div>

    <section class="editorial-more-stories fade-in-up">
      <h2 class="editorial-widget-title">हेही वाचा</h2>
      <div class="related-grid">${relatedNews.map((n) => storyCard(n)).join("")}</div>
    </section>
  `;

  // Right Sidebar HTML
  rightSidebarRoot.innerHTML = `
    <div class="editorial-widget" style="text-align:center; padding-bottom: 24px;">
      <span style="font-size:11px; color:#999; display:block; margin-bottom:8px;">जाहिरात</span>
      <div style="width:300px; height:250px; background:#f5f5f5; border: 1px solid #eaeaea; margin:0 auto; display:flex; align-items:center; justify-content:center; color:#ccc;">300 x 250 AD</div>
    </div>

    <div class="editorial-widget">
      <h3 class="editorial-widget-title">नवीनतम बातम्या</h3>
      <div class="editorial-latest-list">
        ${latestNews.map(n => `
          <a href="article.html?id=${n.id}" class="editorial-latest-card">
            ${safeImg(n.image, n.title, false).replace("<img", '<img class="editorial-latest-img"')}
            <div class="editorial-latest-info">
              <h4>${n.title.length > 50 ? n.title.substring(0, 50) + '...' : n.title}</h4>
            </div>
          </a>
        `).join("")}
      </div>
    </div>

    <div class="editorial-widget">
      <h3 class="editorial-widget-title">ट्रेंडिंग बातम्या</h3>
      <div class="editorial-trending-list">
        ${trendingNews.map(n => `
          <a href="article.html?id=${n.id}" class="editorial-trending-item">
            <h4>${n.title}</h4>
          </a>
        `).join("")}
      </div>
    </div>

    <div class="editorial-widget">
      <h3 class="editorial-widget-title">संबंधित बातम्या</h3>
      <div class="editorial-related-list">
        ${relatedNews.map(n => `
          <a href="article.html?id=${n.id}" class="editorial-latest-card">
            ${safeImg(n.image, n.title, false).replace("<img", '<img class="editorial-latest-img"')}
            <div class="editorial-latest-info">
              <h4>${n.title.length > 50 ? n.title.substring(0, 50) + '...' : n.title}</h4>
            </div>
          </a>
        `).join("")}
      </div>
    </div>
  `;

  root.querySelectorAll("[data-share]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const url = location.href;
      if (btn.dataset.share === "wa") {
        window.open(`https://wa.me/?text=${encodeURIComponent(article.title + " " + url)}`, "_blank");
      }
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderCategoryPage() {
  const root = document.getElementById("category-root");
  if (!root) return;
  const cat = new URLSearchParams(location.search).get("cat") || "महाराष्ट्र";
  const titleEl = document.getElementById("category-title");
  if (titleEl) titleEl.textContent = cat;
  document.title = `${cat} | श्लोक मराठी न्यूज`;

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.cat === cat);
    if (a.dataset.cat === "मुख्यपृष्ठ") a.classList.remove("active");
  });

  const items =
    cat === "ताज्या बातम्या"
      ? newsData.filter((n) => !n.video)
      : newsData.filter((n) => n.category === cat);

  root.innerHTML = items.length
    ? `<div class="category-grid">${items.map((n) => storyCard(n)).join("")}</div>`
    : `<div class="saved-empty"><p>या श्रेणीत सध्या बातम्या उपलब्ध नाहीत.</p></div>`;
}

function renderSavedPage() {
  const root = document.getElementById("saved-root");
  if (!root) return;
  const items = getBookmarks().map(byId).filter(Boolean);

  root.innerHTML = items.length
    ? `<div class="category-grid">${items
      .map(
        (n) => `
      <div>
        ${storyCard(n)}
        <button type="button" class="bookmark-btn saved" style="margin-top:.5rem" data-remove="${n.id}">काढून टाका</button>
      </div>`
      )
      .join("")}</div>`
    : `<div class="saved-empty"><p>अद्याप कोणतीही बातमी सेव्ह केलेली नाही.</p><p><a href="index.html" style="color:var(--brand-red);font-weight:700">मुख्यपृष्ठावर जा →</a></p></div>`;

  root.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleBookmark(btn.dataset.remove);
      renderSavedPage();
    });
  });
}

function parseVideoMedia(url) {
  if (!url) return { type: 'none', src: '' };
  if (url.includes('youtube.com/watch?v=')) {
    const id = new URL(url).searchParams.get('v');
    return { type: 'youtube', src: `https://www.youtube.com/embed/${id}?autoplay=1` };
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return { type: 'youtube', src: `https://www.youtube.com/embed/${id}?autoplay=1` };
  }
  if (url.includes('youtube.com/embed/')) {
    return { type: 'youtube', src: url };
  }
  return { type: 'html5', src: url };
}

async function renderVideoPage() {
  const root = document.getElementById("videos-grid");
  if (!root) return;

  const titleEl = document.getElementById("category-title");
  if (titleEl) titleEl.textContent = "व्हिडिओ बातम्या";
  document.title = "व्हिडिओ बातम्या | श्लोक मराठी न्यूज";

  try {
    let videos = [];
    if (window.supabase) {
      const { data, error } = await window.supabase
        .from('videos')
        .select('*, category:categories(name)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (!error && data && data.length > 0) {
        videos = data;
      }
    }

    if (videos.length === 0 && Array.isArray(newsData)) {
      videos = newsData.filter(n => n.video);
    }

    if (videos.length === 0) {
      root.innerHTML = `<div class="saved-empty"><p>सध्या कोणतेही व्हिडिओ उपलब्ध नाहीत.</p></div>`;
      return;
    }

    root.innerHTML = `
      <div class="video-catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; width: 100%;">
        ${videos.map(vid => {
          const date = new Date(vid.published_at || vid.created_at || Date.now()).toLocaleDateString('mr-IN');
          const thumb = vid.thumbnail_url || vid.image || './assits/shlokmrathi news logo.png';
          const catName = vid.category?.name || 'व्हिडिओ';
          return `
            <a href="video-detail.html?id=${vid.id}" class="video-portal-card" style="display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s;">
              <div style="position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #000;">
                <img src="${thumb}" alt="${vid.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='./assits/shlokmrathi news logo.png';">
                <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
                  <span style="width: 44px; height: 44px; border-radius: 50%; background: #D71920; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(215,25,32,0.4);">
                    <i data-lucide="play" style="width: 20px; height: 20px; fill: white; margin-left: 2px;"></i>
                  </span>
                </div>
                <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">व्हिडिओ</span>
              </div>
              <div style="padding: 16px; display: flex; flex-direction: column; flex: 1;">
                <span style="color: #D71920; font-size: 11.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">${catName}</span>
                <h3 style="font-size: 15.5px; font-weight: 700; line-height: 1.4; color: #0f172a; margin: 0 0 10px; flex: 1;">${vid.title}</h3>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: auto;">
                  <span>${date}</span>
                  <span>${vid.views || 0} व्ह्यूज</span>
                </div>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("renderVideoPage error:", err);
    root.innerHTML = `<div class="saved-empty"><p>व्हिडिओ लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.</p></div>`;
  }
}

async function renderVideoDetailPage(id) {
  const root = document.getElementById("article-root");
  if (!root) return;

  try {
    let video = null;
    let relatedVideos = [];

    if (window.supabase) {
      if (id) {
        const { data, error } = await window.supabase
          .from('videos')
          .select('*, category:categories(name)')
          .eq('id', id)
          .single();
        if (!error && data) video = data;
      }

      const { data: relList } = await window.supabase
        .from('videos')
        .select('*, category:categories(name)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);
      if (relList) relatedVideos = relList;
    }

    if (!video && relatedVideos.length > 0) {
      video = relatedVideos[0];
    }

    if (!video) {
      root.innerHTML = `<div class="saved-empty"><p>व्हिडिओ सापडला नाही.</p><p><a href="video.html" style="color:var(--brand-red);font-weight:700">सर्व व्हिडिओ पहा →</a></p></div>`;
      return;
    }

    document.title = `${video.title} | श्लोक मराठी न्यूज`;

    const media = parseVideoMedia(video.video_url);
    const date = new Date(video.published_at || video.created_at || Date.now()).toLocaleDateString('mr-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const catName = video.category?.name || 'व्हिडिओ बातमी';

    let playerHtml = '';
    if (media.type === 'youtube') {
      playerHtml = `<iframe src="${media.src}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (media.type === 'html5' && media.src) {
      playerHtml = `<video controls autoplay playsinline style="width:100%; aspect-ratio:16/9; background:#000; border-radius:12px; display:block;" poster="${video.thumbnail_url || ''}"><source src="${media.src}" type="video/mp4">आपला ब्राउझर व्हिडिओ प्लेबॅक समर्थित करत नाही.</video>`;
    } else {
      playerHtml = `<div style="width:100%; aspect-ratio:16/9; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; border-radius:12px;">व्हिडिओ प्लेबॅक अनुपलब्ध</div>`;
    }

    root.innerHTML = `
      <div class="video-detail-layout" style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; margin-top: 16px;">
        <div class="video-main-column">
          <div class="video-player-frame" style="border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.12); margin-bottom: 20px;">
            ${playerHtml}
          </div>
          <div class="video-meta-block" style="background:#fff; padding:24px; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <span style="background:#fef2f2; color:#D71920; font-size:12px; font-weight:700; padding:4px 10px; border-radius:6px; text-transform:uppercase;">${catName}</span>
              <span style="font-size:13px; color:#64748b;">${date}</span>
              <span style="font-size:13px; color:#64748b;">&bull; ${video.views || 0} व्ह्यूज</span>
            </div>
            <h1 style="font-size: 24px; font-weight: 700; line-height: 1.35; color: #0f172a; margin: 0 0 16px;">${video.title}</h1>
            ${video.description ? `<p style="font-size: 15px; line-height: 1.65; color: #334155; margin: 0; white-space: pre-line;">${video.description}</p>` : ''}
          </div>
        </div>

        <div class="video-sidebar-column">
          <h3 style="font-size:18px; font-weight:700; margin:0 0 16px; color:#0f172a; border-bottom:2px solid #D71920; padding-bottom:8px;">इतर व्हिडिओ</h3>
          <div style="display:flex; flex-direction:column; gap:14px;">
            ${relatedVideos.filter(v => v.id !== video.id).slice(0, 5).map(rv => `
              <a href="video-detail.html?id=${rv.id}" style="display:flex; gap:12px; text-decoration:none; color:inherit; background:#fff; border:1px solid #f1f5f9; padding:10px; border-radius:10px; transition:background 0.15s;">
                <div style="position:relative; width:110px; min-width:110px; aspect-ratio:16/9; border-radius:6px; overflow:hidden; background:#000;">
                  <img src="${rv.thumbnail_url || rv.image || './assits/shlokmrathi news logo.png'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='./assits/shlokmrathi news logo.png';">
                  <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.25);">
                    <i data-lucide="play" style="width:14px; height:14px; fill:#fff;"></i>
                  </span>
                </div>
                <div style="flex:1; min-width:0;">
                  <h4 style="font-size:13.5px; font-weight:600; line-height:1.35; margin:0 0 6px; color:#1e293b; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${rv.title}</h4>
                  <span style="font-size:11.5px; color:#64748b;">${new Date(rv.published_at || rv.created_at || Date.now()).toLocaleDateString('mr-IN')}</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("renderVideoDetailPage error:", err);
    root.innerHTML = `<div class="saved-empty"><p>व्हिडिओ प्ले करण्यात अडचण आली.</p></div>`;
  }
}

async function renderShortVideoPage() {
  const root = document.getElementById("short-videos-grid");
  if (!root) return;

  const titleEl = document.getElementById("category-title");
  if (titleEl) titleEl.textContent = "शॉर्ट व्हिडिओ (Reels)";
  document.title = "शॉर्ट व्हिडिओ | श्लोक मराठी न्यूज";

  try {
    let videos = [];
    if (window.supabase) {
      const { data, error } = await window.supabase
        .from('videos')
        .select('*, category:categories(name)')
        .eq('status', 'published')
        .eq('video_type', 'SHORT_VIDEO')
        .order('published_at', { ascending: false });
      if (!error && data && data.length > 0) {
        videos = data;
      }
    }

    if (videos.length === 0) {
      root.innerHTML = `<div class="saved-empty"><p>सध्या कोणतेही शॉर्ट व्हिडिओ उपलब्ध नाहीत.</p></div>`;
      return;
    }

    root.innerHTML = videos.map(vid => {
      const date = new Date(vid.published_at || vid.created_at || Date.now()).toLocaleDateString('mr-IN');
      const catName = vid.category?.name || 'शॉर्ट बातमी';
      const thumb = vid.thumbnail_url || './assits/shlokmrathi news logo.png';

      return `
        <a href="short-video-detail.html?id=${vid.id}" style="width: 100%; max-width: 320px; aspect-ratio: 9 / 16; position: relative; border-radius: 16px; overflow: hidden; text-decoration: none; color: #fff; background: #000; box-shadow: 0 8px 24px rgba(0,0,0,0.18); display: flex; flex-direction: column; justify-content: flex-end;">
          <img src="${thumb}" alt="${vid.title}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='./assits/shlokmrathi news logo.png';">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);"></div>
          <div style="position: absolute; top: 16px; left: 16px; z-index: 2;">
            <span style="background: rgba(215,25,32,0.9); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">${catName}</span>
          </div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 54px; height: 54px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.8);">
            <i data-lucide="play" style="width: 24px; height: 24px; fill: #fff; margin-left: 3px;"></i>
          </div>
          <div style="position: relative; z-index: 2; padding: 20px;">
            <h3 style="font-size: 15.5px; font-weight: 700; line-height: 1.35; margin: 0 0 10px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${vid.title}</h3>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.8);">
              <span>${date}</span>
              <span>${vid.views || 0} व्ह्यूज</span>
            </div>
          </div>
        </a>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("renderShortVideoPage error:", err);
    root.innerHTML = `<div class="saved-empty"><p>शॉर्ट व्हिडिओ लोड करण्यात अडचण आली.</p></div>`;
  }
}

async function renderShortVideoDetailPage(id) {
  const root = document.getElementById("article-root");
  if (!root) return;

  try {
    let video = null;
    let nextList = [];

    if (window.supabase) {
      if (id) {
        const { data, error } = await window.supabase
          .from('videos')
          .select('*, category:categories(name)')
          .eq('id', id)
          .single();
        if (!error && data) video = data;
      }

      const { data: list } = await window.supabase
        .from('videos')
        .select('*, category:categories(name)')
        .eq('status', 'published')
        .eq('video_type', 'SHORT_VIDEO')
        .order('published_at', { ascending: false });
      if (list) nextList = list;
    }

    if (!video && nextList.length > 0) {
      video = nextList[0];
    }

    if (!video) {
      root.innerHTML = `<div class="saved-empty"><p>शॉर्ट व्हिडिओ सापडला नाही.</p><p><a href="short-video.html" style="color:var(--brand-red);font-weight:700">सर्व शॉर्ट व्हिडिओ पहा →</a></p></div>`;
      return;
    }

    document.title = `${video.title} | श्लोक मराठी न्यूज`;

    const media = parseVideoMedia(video.video_url);
    const catName = video.category?.name || 'शॉर्ट व्हिडिओ';

    let reelPlayer = '';
    if (media.type === 'youtube') {
      reelPlayer = `<iframe src="${media.src}" style="width:100%; height:100%; border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else if (media.src) {
      reelPlayer = `<video controls autoplay loop playsinline style="width:100%; height:100%; object-fit:cover;" poster="${video.thumbnail_url || ''}"><source src="${media.src}" type="video/mp4"></video>`;
    } else {
      reelPlayer = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#fff;">व्हिडिओ उपलब्ध नाही</div>`;
    }

    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: flex-start; gap: 32px; max-width: 900px; margin: 20px auto;">
        <div style="width: 360px; aspect-ratio: 9 / 16; border-radius: 20px; overflow: hidden; background: #000; box-shadow: 0 20px 40px rgba(0,0,0,0.3); position: relative;">
          ${reelPlayer}
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); pointer-events: none; color: #fff;">
            <span style="background: #D71920; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">${catName}</span>
            <h2 style="font-size: 15px; font-weight: 700; margin: 8px 0 4px; line-height: 1.3;">${video.title}</h2>
          </div>
        </div>

        <div style="flex: 1; max-width: 380px;">
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:20px;">
            <a href="short-video.html" style="display:inline-flex; align-items:center; gap:6px; color:#D71920; font-weight:600; font-size:13.5px; text-decoration:none; margin-bottom:12px;">&larr; सर्व शॉर्ट व्हिडिओ</a>
            <h1 style="font-size:18px; font-weight:700; color:#0f172a; margin:0 0 10px; line-height:1.4;">${video.title}</h1>
            <p style="font-size:13.5px; color:#64748b; margin:0;">${video.description || ''}</p>
          </div>

          <h3 style="font-size:16px; font-weight:700; margin:0 0 12px; color:#0f172a;">पुढील रील्स</h3>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${nextList.filter(v => v.id !== video.id).slice(0, 4).map(nv => `
              <a href="short-video-detail.html?id=${nv.id}" style="display:flex; gap:12px; text-decoration:none; color:inherit; background:#fff; border:1px solid #f1f5f9; padding:8px 12px; border-radius:10px; align-items:center;">
                <div style="width:48px; height:64px; border-radius:6px; overflow:hidden; background:#000; flex-shrink:0;">
                  <img src="${nv.thumbnail_url || './assits/shlokmrathi news logo.png'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='./assits/shlokmrathi news logo.png';">
                </div>
                <div style="flex:1; min-width:0;">
                  <h4 style="font-size:13px; font-weight:600; margin:0 0 4px; color:#1e293b; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${nv.title}</h4>
                  <span style="font-size:11px; color:#64748b;">${nv.views || 0} व्ह्यूज</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("renderShortVideoDetailPage error:", err);
    root.innerHTML = `<div class="saved-empty"><p>रील्स लोड करण्यात अडचण आली.</p></div>`;
  }
}

/* ---------- Helpers for Date & Sidebar ---------- */
function updateTodayDate() {
  const dateEl = document.getElementById("today-date");
  const dateEls = document.querySelectorAll(".utility-date");
  if (!dateEl && dateEls.length === 0) return;

  const now = new Date();
  const days = ["रविवार", "सोमवार", "मंगळवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  const months = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
  ];

  const dayName = days[now.getDay()];
  const dateNum = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const timeStr = `${toDev(hours)}:${toDev(minutes)} ${ampm} IST`;

  const dateStr = `आज ${dayName}, ${toDev(dateNum)} ${monthName} ${toDev(year)} | ${timeStr}`;

  dateEls.forEach(el => {
    el.textContent = dateStr;
  });
  if (dateEl) {
    dateEl.textContent = dateStr;
  }
}

function highlightActiveShortcut() {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  let activeCat = "मुख्यपृष्ठ";

  if (path.includes("category.html")) {
    activeCat = search.get("cat") || "ताज्या बातम्या";
  } else if (path.includes("video.html") || path.includes("video-detail.html")) {
    activeCat = "व्हिडिओ";
  } else if (path.includes("short-video.html") || path.includes("short-video-detail.html")) {
    activeCat = "शॉर्ट व्हिडिओ";
  } else if (path.includes("saved.html")) {
    activeCat = "Saved";
  } else if (path.includes("article.html")) {
    const id = search.get("id");
    if (window.SHLOK && window.SHLOK.newsData) {
      const art = window.SHLOK.newsData.find(n => String(n.id) === String(id));
      if (art) activeCat = art.category;
    }
  }

  document.querySelectorAll(".rail-link").forEach(link => {
    link.classList.remove("active");
    const linkText = link.querySelector(".link-text")?.textContent?.trim();

    let matchedItem = null;
    if (typeof SIDEBAR_CONFIG !== "undefined") {
      SIDEBAR_CONFIG.forEach(section => {
        section.items.forEach(item => {
          if (item.title === linkText) matchedItem = item;
        });
      });
    }

    if (matchedItem) {
      const isActive = (matchedItem.activeCat === activeCat || (activeCat === "महाराष्ट्र" && matchedItem.title === "मुख्यपृष्ठ"));
      if (isActive) {
        link.classList.add("active");
      }
    } else {
      if (activeCat === "मुख्यपृष्ठ" && linkText === "मुख्यपृष्ठ") {
        link.classList.add("active");
      }
    }
  });
}


/* ---------- Initialization Flow ---------- */
async function initializePage() {
  const main = document.getElementById("main-content");
  if (!main) return;

  // Reset page animation for smooth transition
  main.classList.remove("reveal");
  // Force reflow to restart animation
  void main.offsetWidth;
  main.classList.add("reveal");

  const urlObj = new URL(window.location.href);
  const path = urlObj.pathname;
  const search = urlObj.searchParams;

  try {
    if (path.endsWith("category.html")) {
      await renderCategoryPage(search.get("cat"));
    } else if (path.endsWith("article.html")) {
      await renderArticlePage(search.get("id"));
    } else if (path.endsWith("saved.html")) {
      renderSavedPage();
    } else if (path.endsWith("short-video-detail.html")) {
      await renderShortVideoDetailPage(search.get("id"));
    } else if (path.endsWith("short-video.html")) {
      await renderShortVideoPage();
    } else if (path.endsWith("video-detail.html")) {
      await renderVideoDetailPage(search.get("id"));
    } else if (path.endsWith("video.html")) {
      await renderVideoPage();
    } else {
      await renderHome();
    }
  } catch (error) {
    console.error("Failed to render page:", error);
    main.innerHTML = `<div class="saved-empty"><p>Unable to load news. Please try again.</p></div>`;
  }

  // Highlight shortcut
  setTimeout(highlightActiveShortcut, 100);
}

// Intersection Observer for animations
const observeElements = () => {
  const observer = new IntersectionObserver((entries) => {
    let delay = 0;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("reveal");
        }, delay);
        delay += 100; // Stagger effect
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -30px 0px" });

  document.querySelectorAll('.story-card, .section-head, .side-story, .fade-in-up, .quick-card, .trend-card').forEach(el => {
    el.classList.add("fade-in-up");
    observer.observe(el);
  });
};

/* =========================================================
   GLOBAL SIDEBAR SYSTEM
   ========================================================= */
const SIDEBAR_CONFIG = [
  {
    group: "मुख्य मेनू",
    items: [
      { title: "मुख्यपृष्ठ", icon: "house", color: "red", route: "index.html", activeCat: "मुख्यपृष्ठ" },
      { title: "लाइव्ह न्यूज", icon: "radio-tower", color: "crimson", route: "#", activeCat: "ताज्या बातम्या" },
      { title: "व्हिडिओ", icon: "play-circle", color: "purple", route: "video.html", activeCat: "व्हिडिओ" },
      { title: "शॉर्ट व्हिडिओ", icon: "smartphone", color: "orange", route: "short-video.html", activeCat: "शॉर्ट व्हिडिओ" },
      { title: "वेब स्टोरीज", icon: "layers", color: "blue", route: "#", activeCat: "वेब स्टोरीज" },
      { title: "फोटो गॅलरी", icon: "image", color: "green", route: "#", activeCat: "फोटो गॅलरी" },
      { title: "पॉडकास्ट", icon: "headphones", color: "indigo", route: "#", activeCat: "पॉडकास्ट" },
      { title: "मूव्ही रिव्ह्यू", icon: "film", color: "pink", route: "#", activeCat: "मूव्ही रिव्ह्यू" }
    ]
  },
  {
    group: "उपयुक्त साधने",
    items: [
      { title: "होम लोन EMI कॅल्क्युलेटर", icon: "calculator", color: "blue", route: "#", activeCat: "emi" },
      { title: "बीएमआय कॅल्क्युलेटर", icon: "activity", color: "green", route: "#", activeCat: "bmi" },
      { title: "वय मोजा", icon: "calendar-clock", color: "orange", route: "#", activeCat: "age" },
      { title: "इतर उपयुक्त टूल्स", icon: "grid-2x2", color: "purple", route: "#", activeCat: "tools" }
    ]
  }
];

function renderGlobalSidebar() {
  const sidebarContainer = document.getElementById("rail-sidebar");
  if (!sidebarContainer) return;

  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);
  let activeCat = "मुख्यपृष्ठ";

  if (path.includes("category.html")) {
    activeCat = search.get("cat") || "ताज्या बातम्या";
  } else if (path.includes("video.html") || path.includes("video-detail.html")) {
    activeCat = "व्हिडिओ";
  } else if (path.includes("short-video.html") || path.includes("short-video-detail.html")) {
    activeCat = "शॉर्ट व्हिडिओ";
  } else if (path.includes("saved.html")) {
    activeCat = "Saved";
  } else if (path.includes("article.html")) {
    const id = search.get("id");
    if (window.SHLOK && window.SHLOK.newsData) {
      const art = window.SHLOK.newsData.find(n => String(n.id) === String(id));
      if (art) activeCat = art.category;
    }
  }

  let html = `<div class="sidebar-scrollable">`;

  SIDEBAR_CONFIG.forEach((section, index) => {
    if (index > 0) {
      html += `<hr class="sidebar-divider" />`;
    }
    html += `<h3 class="sidebar-section-title">${section.group}</h3>`;
    html += `<nav class="rail-nav${index === 1 ? ' tools-nav' : ''}">`;

    section.items.forEach(item => {
      const isActive = (item.activeCat === activeCat || (activeCat === "महाराष्ट्र" && item.title === "मुख्यपृष्ठ"));
      const activeClass = isActive ? " active" : "";
      html += `
        <a href="${item.route}" class="rail-link${activeClass}">
          <span class="icon-circle icon-${item.color}"><i data-lucide="${item.icon}"></i></span>
          <span class="link-text">${item.title}</span>
        </a>
      `;
    });

    html += `</nav>`;
  });

  html += `</div>`;
  sidebarContainer.innerHTML = html;

  if (typeof lucide !== 'undefined' && window.safeInitIcons) {
    try { lucide.createIcons(); } catch (e) { }
  }
}

function initHeaderNavigation() {
  const header = document.getElementById("site-header");
  if (!header) return;

  // Add the category scroll bar if not already present
  // DISABLED: The new Aaj Tak theme header has built-in navigation in Row 2.
  /*
  if (!header.querySelector(".category-nav-bar")) {
    const navBar = document.createElement("div");
    navBar.className = "category-nav-bar";
    navBar.innerHTML = `
      ... old nav HTML ...
    `;
    header.appendChild(navBar);
  }
  */

  // Force Level 1 Main nav links to show basic routes
  const mainNav = header.querySelector(".main-nav.header-nav");
  if (mainNav) {
    mainNav.innerHTML = `
      <ul class="nav-list">
        <li><a href="index.html" class="nav-link" data-cat="मुख्यपृष्ठ">मुख्यपृष्ठ</a></li>
        <li><a href="category.html?cat=%E0%A4%A4%E0%A4%BE%E0%A4%9C%E0%A5%8D%E0%A4%AF%E0%A4%BE%20%E0%A4%AC%E0%A4%BE%E0%A4%A4%E0%A4%AE%E0%A5%8D%E0%A4%AF%E0%A4%BE" class="nav-link" data-cat="ताज्या बातम्या">ताज्या बातम्या</a></li>
        <li><a href="video.html" class="nav-link" data-cat="व्हिडिओ">व्हिडिओ</a></li>
        <li><a href="short-video.html" class="nav-link" data-cat="शॉर्ट व्हिडिओ">शॉर्ट व्हिडिओ</a></li>
        <li><a href="saved.html" class="nav-link" data-cat="Saved">सेव्ह केलेले</a></li>
      </ul>
    `;
  }

  // Hide old design toggles if any page loaded them in header
  const oldToggles = header.querySelector(".experience-toggle");
  if (oldToggles) oldToggles.style.display = "none";

  // Highlight active link based on current page search params / pathname
  const path = location.pathname;
  const search = new URLSearchParams(location.search);
  let activeCat = "मुख्यपृष्ठ";

  if (path.includes("category.html")) {
    activeCat = search.get("cat") || "महाराष्ट्र";
  } else if (path.includes("video.html") || path.includes("video-detail.html")) {
    activeCat = "व्हिडिओ";
  } else if (path.includes("short-video.html") || path.includes("short-video-detail.html")) {
    activeCat = "शॉर्ट व्हिडिओ";
  } else if (path.includes("saved.html")) {
    activeCat = "Saved";
  } else if (path.includes("article.html")) {
    const id = search.get("id");
    const art = newsData.find(n => String(n.id) === String(id));
    if (art) activeCat = art.category;
  }

  header.querySelectorAll(".nav-link").forEach(link => {
    const isCatMatch = link.dataset.cat === activeCat;
    link.classList.toggle("active", isCatMatch);
  });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  initExperience();
  initHeaderNavigation();
  renderGlobalSidebar();
  initMenu();
  initLang();
  initSearch();
  updateTodayDate();
  highlightActiveShortcut();

  if (typeof lucide !== 'undefined') {
    safeInitIcons();
  }

  const header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 10) {
        header.classList.add("sticky-header");
      } else {
        header.classList.remove("sticky-header");
      }
    });
  }

  // Run data fetches in parallel without blocking each other
  const breakingPromise = NewsService.fetchBreaking().then(data => {
    BREAKING = data || [];
    renderBreaking();
  }).catch(error => {
    console.error("Failed to load breaking news:", error);
    BREAKING = [];
    renderBreaking();
  });

  const newsDataPromise = safeFetchNews().then(data => {
    newsData = data || [];
  }).catch(error => {
    console.error("Failed to load global newsData:", error);
    newsData = [];
  });

  // Immediately initialize the specific page to avoid blocking UI rendering
  initializePage().finally(() => {
    setTimeout(observeElements, 500);
  });
});

window.SHLOK = {
  newsData,
  renderModernLayout,
  renderClassicLayout,
  applyExperience,
  updateTodayDate,
  highlightActiveShortcut
};

/* =========================================================
   TEXT SELECTION MARKER HIGHLIGHT
   ========================================================= */
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();

  // Clear old highlights that are no longer selected
  document.querySelectorAll(".marker-highlight").forEach(span => {
    if (!selection.containsNode(span, true)) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
  });

  if (!selection.rangeCount || selection.isCollapsed) return;

  // We only want to highlight text nodes, and not inside inputs or our own marker
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) return;

  // We don't apply it live during drag because it messes with native selection,
  // usually it's best to wait for mouseup, but a basic CSS ::selection fallback 
  // is already in place. For the true "animated marker", we apply it on 'mouseup' instead.
});

document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) return;

  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) return;

  const range = selection.getRangeAt(0);
  const text = range.toString().trim();

  if (text.length > 0) {
    try {
      const span = document.createElement("span");
      span.className = "marker-highlight";
      range.surroundContents(span);
      selection.removeAllRanges(); // Clear native selection so custom highlight shines
    } catch (e) {
      // ignore DOM exception if range spans multiple block elements
    }
  }
});

// Scroll handler for Premium Footer pills
window.scrollPills = function (id, amount) {
  const container = document.getElementById('pf-' + id + '-scroll');
  if (container) {
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  function setupActiveNavigation() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.at-main-nav .at-nav-link, .at-network-links .at-net-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      let isMatch = false;
      if (href === pageName) isMatch = true;
      else if (href === 'index.html' && pageName === '') isMatch = true;
      if (isMatch) link.classList.add('active');
    });
  }
  setupActiveNavigation();
});
