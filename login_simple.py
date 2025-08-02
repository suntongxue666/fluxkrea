#!/usr/bin/env python3
from huggingface_hub import login

# Replace with your token
TOKEN = "your-huggingface-token-here"

def main():
    try:
        print("Logging in...")
        login(token=TOKEN)
        print("✅ Login successful!")
        print("Now you can run: python3 inference.py -p 'beautiful landscape'")
        
    except Exception as e:
        print(f"❌ Login failed: {e}")

if __name__ == "__main__":
    main()