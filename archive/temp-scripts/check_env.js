// 环境变量检查脚本
require('dotenv').config();

console.log('🔍 环境变量检查:');
console.log('================');

const requiredEnvVars = [
    'REPLICATE_API_TOKEN'
];

let allGood = true;

requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
        console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
    } else {
        console.log(`❌ ${envVar}: 未设置`);
        allGood = false;
    }
});

console.log('================');

if (allGood) {
    console.log('✅ 所有必需的环境变量都已正确设置');
} else {
    console.log('❌ 有环境变量缺失，请检查.env文件');
}

// 检查.env文件是否存在
const fs = require('fs');
if (fs.existsSync('.env')) {
    console.log('✅ .env文件存在');
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('📄 .env文件内容预览:');
    envContent.split('\n').forEach((line, index) => {
        if (line.trim() && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (value) {
                console.log(`   ${key}=${value.substring(0, 10)}...`);
            }
        }
    });
} else {
    console.log('❌ .env文件不存在');
}