import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request JSON. Allow empty body for simple GETs
    let reqData: any = {};
    if (req.method === 'POST') {
      try {
        reqData = await req.json();
      } catch (e) {
        // body could be empty or invalid json
      }
    }

    const category = reqData.category || 'general';
    const search = reqData.search || '';
    const lang = reqData.language || 'mr'; // Marathi by default
    const country = reqData.country || 'in';

    // The API Key is securely stored as a Supabase Secret, but we use a demo key for now
    const envKey = Deno.env.get('NEWS_API_KEY');
    const hasEnvKey = !!envKey;
    const NEWS_API_KEY = envKey || '04017aa050696e0641265a5037529dfa';

    // Build GNews API URL
    let url = '';
    if (search) {
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(search)}&lang=${lang}&country=${country}&sortby=publishedAt&apikey=${NEWS_API_KEY}`;
    } else {
      url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&country=${country}&apikey=${NEWS_API_KEY}`;
    }

    const requestInfo = {
      endpoint: search ? 'search' : 'top-headlines',
      method: 'GET',
      category,
      search,
      lang,
      country,
      keyConfigured: hasEnvKey
    };

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const gnewsStatus = response.status;
      console.error(`GNews API Error: ${gnewsStatus}`, errorData);
      
      const errorMessage = errorData.errors ? errorData.errors[0] : 'Unknown error';
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `GNews API Error (Status ${gnewsStatus}): ${errorMessage}`, 
          details: errorData, 
          gnewsStatus,
          requestInfo 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        },
      )
    }

    const data = await response.json();
    
    // Normalize response for the frontend
    const articles = data.articles ? data.articles.map((article: any) => ({
      id: article.url, 
      title: article.title,
      description: article.description,
      image: article.image,
      url: article.url,
      source: article.source?.name,
      publishedAt: article.publishedAt,
      category: category 
    })) : [];

    return new Response(
      JSON.stringify({
        success: true,
        articles,
        totalResults: data.totalArticles || 0,
        requestInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('Edge Function Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})
