// 最基础的测试函数
module.exports = (req, res) => {
    res.status(200).json({ 
        message: 'Hello from webhook', 
        method: req.method,
        timestamp: new Date().toISOString()
    });
};