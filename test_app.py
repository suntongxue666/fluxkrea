#!/usr/bin/env python3
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return '<h1>Hello World!</h1><p>服务器正常运行</p>'

if __name__ == '__main__':
    print("测试服务器启动...")
    try:
        app.run(debug=True, port=9999, host='127.0.0.1')
    except Exception as e:
        print(f"启动失败: {e}")