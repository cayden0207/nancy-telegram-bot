# 🚂 Nancy Bot Railway 部署指南

## 📋 准备工作

1. **创建 GitHub 仓库**
   - 将你的 bot 代码上传到 GitHub
   - 确保包含所有必要文件（bot.js, package.json, railway.json 等）
   - **重要**：不要上传 .env 文件到 GitHub！

2. **注册 Railway 账号**
   - 访问 [Railway.app](https://railway.app)
   - 使用 GitHub 账号登录

## 🚀 部署步骤

### Step 1: 创建新项目
1. 登录 Railway 后，点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权 Railway 访问你的 GitHub
4. 选择包含 Nancy Bot 的仓库

### Step 2: 配置环境变量
1. 进入项目后，点击 "Variables" 标签
2. 点击 "New Variable" 添加以下环境变量：

```
TELEGRAM_BOT_TOKEN = 你的Bot Token（从 @BotFather 获取）
OPENAI_API_KEY = 你的OpenAI API密钥
OPENAI_IMAGE_API_KEY = 你的OpenAI图片API密钥（可以与上面相同）
```

⚠️ **重要**：请将实际的密钥保存在安全的地方，不要提交到 GitHub！

### Step 3: 部署
1. 添加完环境变量后，Railway 会自动开始部署
2. 点击 "Deployments" 标签查看部署进度
3. 等待状态变为 "Success"（通常需要 1-3 分钟）

### Step 4: 查看日志
1. 点击 "Logs" 标签
2. 你应该看到类似这样的启动日志：
```
💖 啟動 Nancy Bot...
🤖 Bot 名稱: Nancy
📱 Bot Token: 8409622608...
🎨 圖片創作功能: DALL-E 3 已啟用
✅ Bot 連接成功: @Nancychao_bot
```

## 🔧 管理和维护

### 查看运行状态
- 在 Railway 项目页面可以看到：
  - CPU 使用率
  - 内存使用量
  - 日志输出
  - 部署历史

### 更新代码
1. 推送更新到 GitHub
2. Railway 会自动检测并重新部署

### 重启 Bot
1. 在 "Deployments" 页面
2. 点击当前部署旁的三个点
3. 选择 "Restart"

## 💰 费用说明

Railway 提供：
- **免费套餐**：$5 的免费额度/月
- **Hobby 套餐**：$5/月，包含 $5 额度 + 额外使用按需计费
- Nancy Bot 预计使用：约 $3-5/月

## ⚠️ 注意事项

1. **环境变量安全**
   - 永远不要在代码中硬编码 API 密钥
   - 使用 Railway 的环境变量功能

2. **监控使用量**
   - 定期检查 Railway 的使用量
   - 避免超出免费额度

3. **日志管理**
   - Railway 只保留最近的日志
   - 重要日志需要外部存储

## 🆘 常见问题

### Bot 没有响应？
1. 检查环境变量是否正确设置
2. 查看日志是否有错误信息
3. 确认 Bot Token 是否有效

### 部署失败？
1. 检查 package.json 是否完整
2. 确认所有依赖都已列出
3. 查看部署日志中的错误信息

### 如何停止 Bot？
1. 在 Railway 项目设置中
2. 点击 "Remove" 可以暂时停止服务
3. 或者在 "Settings" 中删除整个项目

## 🎉 完成！

部署成功后，你的 Nancy Bot 就会 24/7 在线运行了！
即使关闭电脑，Bot 也会继续工作。

有问题可以：
- 查看 Railway 文档：https://docs.railway.app
- 加入 Railway Discord：https://discord.gg/railway