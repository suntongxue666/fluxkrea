#!/usr/bin/env python3
"""
简单测试Flask服务是否正常
"""
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return '''
    <html>
    <head><title>测试页面</title></head>
    <body>
        <h1>Flask服务正常运行！</h1>
        <p>如果你能看到这个页面，说明服务启动成功</p>
        <p>时间戳: <script>document.write(new Date())</script></p>
    </body>
    </html>
    '''

if __name__ == '__main__':
    print("🚀 启动测试服务...")
    print("📱 访问: http://localhost:3000")
    print("📱 或者: http://127.0.0.1:3000")
    app.run(debug=True, port=3000, host='0.0.0.0')