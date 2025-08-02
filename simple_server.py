#!/usr/bin/env python3
"""
超简单的HTTP服务器测试
"""
import http.server
import socketserver
import threading
import time

PORT = 8899

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html = '''
        <!DOCTYPE html>
        <html>
        <head><title>简单测试页面</title></head>
        <body>
            <h1>🎉 服务器正常运行！</h1>
            <p>如果你能看到这个页面，说明网络连接正常</p>
            <p>现在可以试试你的Flask应用了</p>
        </body>
        </html>
        '''
        self.wfile.write(html.encode())

def start_server():
    with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
        print(f"🚀 简单HTTP服务器启动成功!")
        print(f"📱 访问: http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    start_server()