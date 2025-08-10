#!/usr/bin/env python3
print("测试Python输出")
print("如果你能看到这个，说明Python工作正常")

from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello World!"

if __name__ == '__main__':
    print("准备启动Flask...")
    print("如果卡在这里，说明Flask有问题")
    app.run(port=7777, debug=True)
    print("这行不应该出现")