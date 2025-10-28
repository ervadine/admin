const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Use environment variables for server URLs
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://choucoune.onrender.com';
  const API_BASE_URL = process.env.REACT_PUBLIC_API_URL || 'https://choucoune.onrender.com/api/v1';
  
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`API Base URL: ${API_BASE_URL}`);

  // Proxy API requests to /api/v1
  app.use(
    '/api',
    createProxyMiddleware({
      target: SERVER_URL,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api/v1', // Rewrite /api to /api/v1
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying API request: ${req.method} ${req.path} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy API Error:', err);
        res.status(500).json({ error: 'Proxy API error' });
      }
    })
  );
  
  // Proxy uploads requests
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: SERVER_URL,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying upload request: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy Uploads Error:', err);
        res.status(500).json({ error: 'Proxy uploads error' });
      }
    })
  );

  // Proxy images requests
  app.use(
    '/images',
    createProxyMiddleware({
      target: SERVER_URL,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying image request: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy Images Error:', err);
        res.status(500).json({ error: 'Proxy images error' });
      }
    })
  );
};