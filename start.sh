#!/bin/bash

echo "🚀 启动简单版 Telegram AI Bot..."

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，正在创建..."
    echo "TELEGRAM_BOT_TOKEN=7738321110:AAFGuPSswOAkLEPA_cFIQcYIbd3UU_nbprQ" > .env
    echo "OPENAI_API_KEY=你的_OPENAI_API_KEY_在这里" >> .env
    echo "⚠️  请编辑 .env 文件，添加你的 OpenAI API Key"
    exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d node_modules ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo "🔧 检查配置..."
if grep -q "你的_OPENAI_API_KEY_在这里" .env; then
    echo "❌ 请先在 .env 文件中设置正确的 OPENAI_API_KEY"
    echo "💡 编辑 .env 文件，将 '你的_OPENAI_API_KEY_在这里' 替换为真实的 API Key"
    exit 1
fi

echo "✅ 配置检查完成，启动 bot..."
node bot.js 