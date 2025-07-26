# 简单版 Telegram AI Bot

这是一个轻量级的 Telegram AI Bot，避免了复杂的框架依赖，直接使用基础库实现。

## 特性

- 🤖 基于 OpenAI GPT-3.5-turbo 的智能对话
- 💬 支持多用户对话历史记录
- 🔄 自动清理过长的对话历史
- 🎯 简单易用的命令系统
- 🇨🇳 专为中文对话优化

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件，添加你的 OpenAI API Key：

```bash
TELEGRAM_BOT_TOKEN=7738321110:AAFGuPSswOAkLEPA_cFIQcYIbd3UU_nbprQ
OPENAI_API_KEY=你的_OPENAI_API_KEY
```

### 3. 启动 Bot

```bash
# 使用启动脚本（推荐）
./start.sh

# 或直接运行
node bot.js
```

## 支持的命令

- `/start` - 开始使用 Bot
- `/help` - 显示帮助信息  
- `/clear` - 清除对话历史

## 使用方法

1. 在 Telegram 中搜索你的 Bot
2. 发送 `/start` 开始对话
3. 直接发送消息，Bot 会智能回复

## 技术栈

- **node-telegram-bot-api** - Telegram Bot API 封装
- **openai** - OpenAI API 客户端
- **dotenv** - 环境变量管理

## 优势

相比复杂的框架（如 Eliza OS），这个简单版本：

- ✅ 无复杂依赖，安装简单
- ✅ 启动速度快
- ✅ 代码清晰易懂
- ✅ 容易定制和修改
- ✅ 内存占用小

## 故障排除

### Bot 无法启动

1. 检查 `.env` 文件是否正确配置
2. 确认 OpenAI API Key 有效
3. 检查网络连接

### Bot 无回应

1. 查看终端日志输出
2. 检查 OpenAI API 配额
3. 确认 Telegram Bot Token 正确

## 定制化

你可以很容易地修改 `bot.js` 中的 `CHARACTER` 对象来改变 Bot 的性格和行为：

```javascript
const CHARACTER = {
    name: "你的Bot名称",
    system: "你的系统提示词",
    bio: "Bot的自我介绍",
    style: ["风格1", "风格2", ...]
};
```

## License

MIT License 