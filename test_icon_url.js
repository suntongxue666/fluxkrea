// 测试图标URL是否可访问
const https = require('https');

const iconUrl = 'https://ciwjjfcuhubjydajazkk.supabase.co/storage/v1/object/public/webstie-icon//FluxKrea%20log-120.png';

console.log('🔍 测试图标URL可访问性...');
console.log('URL:', iconUrl);

https.get(iconUrl, (res) => {
    console.log('\n📊 响应信息:');
    console.log('状态码:', res.statusCode);
    console.log('内容类型:', res.headers['content-type']);
    console.log('内容长度:', res.headers['content-length']);
    
    if (res.statusCode === 200) {
        console.log('✅ 图标URL可正常访问');
        console.log('📏 图片大小:', Math.round(res.headers['content-length'] / 1024), 'KB');
    } else {
        console.log('❌ 图标URL访问失败');
    }
    
    // 不需要读取完整内容，只检查可访问性
    res.destroy();
}).on('error', (err) => {
    console.error('❌ 网络错误:', err.message);
});

console.log('\n💡 如果图标可访问，您就可以使用这个URL创建PayPal产品了！');