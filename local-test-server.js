/**
 * 本地测试服务器
 * 
 * 这个脚本启动一个本地HTTP服务器，用于测试订阅功能
 * 使用方法: node local-test-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入API处理函数
const simplePaypalSubscription = require('./api/simple-paypal-subscription');
const handleSubscription = require('./api/handle-subscription');

// 服务器配置
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

/**
 * 处理静态文件请求
 */
function serveStaticFile(req, res, filePath) {
    // 获取文件扩展名
    const extname = path.extname(filePath);
    
    // 设置Content-Type
    const contentType = MIME_TYPES[extname] || 'text/plain';
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // 成功读取文件
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

/**
 * 处理API请求
 */
async function handleApiRequest(req, res, pathname) {
    // 解析API路径
    const apiPath = pathname.replace('/api/', '');
    
    // 根据API路径调用相应的处理函数
    switch (apiPath) {
        case 'simple-paypal-subscription':
            // 读取请求体
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    // 解析请求体
                    req.body = JSON.parse(body);
                    
                    // 调用API处理函数
                    await simplePaypalSubscription(req, res);
                } catch (error) {
                    console.error('处理API请求失败:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: '服务器内部错误' }));
                }
            });
            break;
            
        case 'handle-subscription':
            // 读取请求体
            let subscriptionBody = '';
            req.on('data', chunk => {
                subscriptionBody += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    // 解析请求体
                    req.body = JSON.parse(subscriptionBody);
                    
                    // 调用API处理函数
                    await handleSubscription(req, res);
                } catch (error) {
                    console.error('处理API请求失败:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: '服务器内部错误' }));
                }
            });
            break;
            
        default:
            // API不存在
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'API不存在' }));
    }
}

/**
 * 创建HTTP服务器
 */
const server = http.createServer(async (req, res) => {
    // 解析URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log(`${req.method} ${pathname}`);
    
    // 处理API请求
    if (pathname.startsWith('/api/')) {
        await handleApiRequest(req, res, pathname);
        return;
    }
    
    // 处理根路径请求
    if (pathname === '/') {
        pathname = '/subscription-debug.html';
    }
    
    // 构建文件路径
    let filePath = path.join(__dirname, pathname);
    
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 尝试在public目录中查找
            filePath = path.join(__dirname, 'public', pathname);
            
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    // 文件不存在
                    res.writeHead(404);
                    res.end('404 Not Found');
                } else {
                    // 文件存在于public目录中
                    serveStaticFile(req, res, filePath);
                }
            });
        } else {
            // 文件存在于根目录中
            serveStaticFile(req, res, filePath);
        }
    });
});

/**
 * 启动服务器
 */
server.listen(PORT, HOST, () => {
    console.log(`🚀 本地测试服务器已启动: http://${HOST}:${PORT}`);
    console.log('📝 环境变量:');
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  - LOCAL_TEST: ${process.env.LOCAL_TEST || 'false'}`);
    console.log(`  - PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? '已设置' : '未设置'}`);
    console.log(`  - PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? '已设置' : '未设置'}`);
    console.log('👉 访问 http://localhost:3000/subscription-debug.html 进行测试');
});