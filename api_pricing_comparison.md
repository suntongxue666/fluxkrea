# AI 图像生成 API 价格对比

## 1. Hugging Face Inference API
- **免费额度**: 每月 1000 次调用
- **付费**: $0.008-0.02/张图 (取决于模型大小)
- **FLUX**: 约 $0.01-0.03/张图
- **优点**: 
  - 有免费额度
  - 支持多种开源模型
  - 价格透明
- **缺点**: 
  - 冷启动时间较长
  - 可能需要等待模型加载

## 2. Replicate
- **FLUX-schnell**: $0.003/张图
- **FLUX-dev**: $0.055/张图  
- **优点**:
  - 价格便宜
  - 响应速度快
  - 模型选择多
- **缺点**:
  - 需要信用卡验证

## 3. Stability AI (SDXL)
- **价格**: $0.04/张图
- **优点**: 
  - 官方服务，稳定
  - 图像质量高
- **缺点**: 
  - 价格较高
  - 不是 FLUX 模型

## 4. OpenAI DALL-E 3
- **价格**: $0.04-0.08/张图
- **优点**: 
  - 图像质量极高
  - 理解能力强
- **缺点**: 
  - 价格最高
  - 内容审查严格

## 推荐方案

### 开发测试阶段
1. **Hugging Face** (免费额度)
2. **Replicate** (便宜)

### 生产环境
1. **小规模**: Replicate ($0.003/张)
2. **大规模**: 自建 GPU 服务器

## 成本估算

假设每天生成 1000 张图:
- **Replicate**: $3/天 = $90/月
- **Hugging Face**: $10-30/月
- **自建服务器**: $200-500/月 (但无限制)

## 获取 API Key

### Hugging Face
1. 访问: https://huggingface.co/settings/tokens
2. 创建 Read 权限的 token

### Replicate  
1. 访问: https://replicate.com/account/api-tokens
2. 创建 API token
3. 需要绑定信用卡

选择建议: 先用 Hugging Face 测试，生产环境用 Replicate。