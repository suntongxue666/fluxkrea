const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// API函数将动态导入

const PORT = 3000;

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API路由
  if (pathname.startsWith('/api/')) {
    let body = '';
    
    if (req.method === 'POST') {
      req.on('data', chunk => {
        body += chunk.toString();
      });
    }

    req.on('end', async () => {
      try {
        // 模拟Vercel的req/res对象
        const mockReq = {
          method: req.method,
          body: body ? JSON.parse(body) : {},
          headers: req.headers,
          url: req.url
        };

        const mockRes = {
          status: (code) => {
            res.statusCode = code;
            return mockRes;
          },
          json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          },
          setHeader: (name, value) => {
            res.setHeader(name, value);
          },
          end: () => {
            res.end();
          }
        };

        // 路由到对应的API
        if (pathname === '/api/generate') {
          const generateAPI = await import('./api/generate.js');
          await generateAPI.default(mockReq, mockRes);
        } else if (pathname === '/api/test-config') {
          const testConfigAPI = await import('./api/test-config.js');
          await testConfigAPI.default(mockReq, mockRes);
        } else {
          res.statusCode = 404;
          res.end('API not found');
        }
      } catch (error) {
        console.error('API Error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // 静态文件服务
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }

  // 获取文件扩展名
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // 读取并返回文件
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.statusCode = 500;
      res.end('Server Error');
    } else {
      res.setHeader('Content-Type', contentType);
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 本地服务器启动成功！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`🧪 测试页面: http://localhost:${PORT}/test-generate.html`);
  console.log(`⚡ API端点: http://localhost:${PORT}/api/generate`);
});