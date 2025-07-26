#!/bin/bash

# 部署脚本 - 在服务器上运行

echo "🚀 开始部署 Nancy Bot..."

# 1. 创建日志目录
mkdir -p logs

# 2. 安装依赖
echo "📦 安装依赖..."
npm install

# 3. 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 请创建 .env 文件并配置以下变量："
    echo "TELEGRAM_BOT_TOKEN=你的Bot Token"
    echo "OPENAI_API_KEY=你的OpenAI API密钥"
    echo "OPENAI_IMAGE_API_KEY=你的OpenAI图片API密钥"
    exit 1
fi

# 4. 安装 PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 5. 停止旧进程（如果存在）
pm2 stop nancy-bot 2>/dev/null || true
pm2 delete nancy-bot 2>/dev/null || true

# 6. 启动新进程
echo "🚀 启动 Bot..."
pm2 start ecosystem.config.js

# 7. 保存 PM2 配置
pm2 save

# 8. 设置开机自启
pm2 startup

echo "✅ 部署完成！"
echo "💡 使用以下命令管理 Bot："
echo "   pm2 status        - 查看状态"
echo "   pm2 logs          - 查看日志"
echo "   pm2 restart nancy-bot - 重启"
echo "   pm2 stop nancy-bot    - 停止"