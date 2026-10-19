import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function googlePhotosProxyPlugin(): Plugin {
  return {
    name: 'google-photos-proxy',
    configureServer(server) {
      server.middlewares.use('/api/scrape-google-photos', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { albumUrl } = JSON.parse(body || '{}');
            if (!albumUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Missing album link URL' }));
              return;
            }

            console.log('[Closet AI] Fetching Google Photos album:', albumUrl);

            // Fetch the public shared album URL using Node native fetch
            const response = await fetch(albumUrl, {
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
              }
            });

            if (!response.ok) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: false, 
                error: `Google Photos returned status ${response.status}. Please check if the album link is shared publicly.` 
              }));
              return;
            }

            const html = await response.text();

            // Google Photos embeds photo URLs as https://lh3.googleusercontent.com/pw/... or https://lh3.googleusercontent.com/...
            const regex = /https:\/\/lh3\.googleusercontent\.com\/(?:pw\/)?[a-zA-Z0-9_\-]+/g;
            const matches = html.match(regex) || [];

            // Filter unique photo IDs, excluding small icons/avatars (album photos have hash length > 50)
            const uniqueUrls = Array.from(new Set(matches)).filter(url => {
              if (url.includes('/a/')) return false; // exclude profile avatar
              const parts = url.split('/');
              const lastPart = parts[parts.length - 1];
              return lastPart.length > 50;
            });

            console.log(`[Closet AI] Discovered ${uniqueUrls.length} photos in album.`);

            const photoUrls = uniqueUrls.slice(0, 50).map(u => `/api/image-proxy?url=${encodeURIComponent(`${u}=s1200`)}`);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: photoUrls.length > 0,
              count: photoUrls.length,
              photos: photoUrls,
              error: photoUrls.length === 0 
                ? 'No public photos could be parsed. Google may have restricted public access for this link without a Google login.' 
                : null
            }));
          } catch (err: any) {
            console.error('[Closet AI] Server scraper error:', err);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Failed to parse album' }));
          }
        });
      });

      // Direct Image Proxy: Streams Google Photos CDN images server-side without a Referer header
      // This eliminates the 403 Forbidden hotlink block and satisfies CORS for WebGL/Three.js textures
      server.middlewares.use('/api/image-proxy', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.end();
          return;
        }

        try {
          const reqUrl = new URL(req.url || '', 'http://localhost');
          const targetUrl = reqUrl.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Missing url query parameter');
            return;
          }

          const imageResponse = await fetch(targetUrl, {
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          });

          if (!imageResponse.ok) {
            res.statusCode = imageResponse.status;
            res.end(`Image upstream error: ${imageResponse.status}`);
            return;
          }

          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await imageResponse.arrayBuffer();

          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.end(Buffer.from(arrayBuffer));
        } catch (err: any) {
          console.error('[Closet AI Proxy] Error fetching image:', err);
          res.statusCode = 500;
          res.end('Proxy Fetch Error');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), googlePhotosProxyPlugin()],
});
