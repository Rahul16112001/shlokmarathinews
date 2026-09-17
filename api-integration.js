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
      return [];
    }

    if (!data || !data.success) {
      console.warn("API responded with an error:", data ? data.error : "Unknown error");
      apiErrorMessage = data ? data.error : "Unknown error";
      return [];
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
      
      newsData = [...general, ...tech, ...ent, ...regional];
    } catch (e) {
      console.error("Failed to fetch homepage data", e);
    }
  }

  if (newsData.length === 0) {
    const errorMsg = apiErrorMessage ? `GNews API Error: ${apiErrorMessage}` : 'सध्या कोणतीही बातमी उपलब्ध नाही. API मध्ये काही तांत्रिक अडचण असू शकते.';
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
