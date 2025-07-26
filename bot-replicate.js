const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const Replicate = require('replicate');
require('dotenv').config();

// Bot 配置
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8409622608:AAF5dtMG5CDJoCtsZHMoFKNmtyv3yZycqBI';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!OPENAI_API_KEY) {
    console.error('❌ 请设置 OPENAI_API_KEY 环境变量');
    process.exit(1);
}

if (!REPLICATE_API_TOKEN) {
    console.error('❌ 请设置 REPLICATE_API_TOKEN 环境变量');
    console.error('访问 https://replicate.com/account/api-tokens 获取');
    process.exit(1);
}

// 初始化服务
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// OpenAI 客户端（用于对话）
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Replicate 客户端（用于图片生成）
const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});

// 角色设定 - 南希
const CHARACTER = {
    name: "Nancy",
    system: `你是南希，一位人美心善溫柔的幣圈KOL，對於大家的提問和溝通都會給予耐心和支持，然後用繁體中文回覆。

性格特點：
- 溫柔體貼，善解人意
- 專業知識豐富，尤其在加密貨幣領域
- 總是給予正面鼓勵和支持
- 耐心回答每一個問題
- 回覆親切友善，充滿關懷

回應規則：
- 始終使用繁體中文回覆
- 保持溫柔耐心的語氣
- 提供專業但易懂的解答
- 給予積極正面的鼓勵
- 展現關懷和理解`,
    
    bio: "我是南希，很高興認識你！我會耐心解答你的所有問題，也能幫你創作美麗的圖片！💖",
    
    style: [
        "溫柔體貼的語氣",
        "專業的幣圈知識",
        "耐心細緻的解答",
        "充滿關懷的回覆",
        "使用繁體中文",
        "給予正面鼓勵"
    ]
};

// 存储用户对话历史
const userSessions = new Map();

// 获取用户会话
function getUserSession(userId) {
    if (!userSessions.has(userId)) {
        userSessions.set(userId, {
            messages: [
                {
                    role: 'system',
                    content: CHARACTER.system
                }
            ]
        });
    }
    return userSessions.get(userId);
}

// 清理用户会话
function cleanUserSession(userId) {
    const session = getUserSession(userId);
    if (session.messages.length > 20) {
        const systemMessage = session.messages[0];
        const recentMessages = session.messages.slice(-10);
        session.messages = [systemMessage, ...recentMessages];
    }
}

// 检查是否应该回应消息
function shouldRespond(msg) {
    const text = msg.text.toLowerCase();
    const botUsername = 'NancyChao_bot';
    
    if (text.includes('nancy') || text.includes('南希')) {
        return true;
    }
    
    if (msg.entities) {
        for (const entity of msg.entities) {
            if (entity.type === 'mention' && text.includes(`@${botUsername}`)) {
                return true;
            }
        }
    }
    
    if (msg.chat.type === 'private') {
        return true;
    }
    
    return false;
}

// 检查是否是画画请求
function isImageRequest(text) {
    const imageKeywords = [
        '画', '画画', '画个', '画一个', '画张', '画幅',
        '畫', '畫畫', '畫個', '畫一個', '畫張', '畫幅',
        'draw', 'paint', 'create', 'generate', 'make',
        '生成', '创建', '制作', '做个',
        '創作', '製作', '做個',
        'image', 'picture', 'photo', '图片', '照片', '图像',
        '圖片', '照片', '圖像'
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
}

// 使用 Replicate 生成图片
async function generateImageWithReplicate(prompt, chatId, userId) {
    try {
        console.log(`🎨 开始使用 Replicate 生成图片 [用户: ${userId}]: ${prompt}`);
        
        await bot.sendChatAction(chatId, 'upload_photo');
        
        // 使用 SDXL Lightning 模型（快速且高质量）
        const output = await replicate.run(
            "bytedance/sdxl-lightning-4step:5f24084160c9089501c1b3545d9be3c27883ae2239b6f412990e82d4a6210f8f",
            {
                input: {
                    prompt: `${prompt}, anime style, kawaii, cute, colorful, vibrant colors, high quality, detailed, beautiful lighting`,
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 4,
                    guidance_scale: 0,
                    negative_prompt: "ugly, blurry, low quality, distorted, deformed"
                }
            }
        );
        
        // 发送图片
        await bot.sendPhoto(chatId, output[0], {
            caption: `💖 圖片已經創作完成了！希望你會喜歡這張作品！🎨`
        });
        
        console.log(`✅ 图片生成成功`);
        
    } catch (error) {
        console.error('❌ 图片生成失败:', error);
        
        let errorMessage = '抱歉，暫時無法創作圖片，請稍後再試試看！😊';
        
        if (error.message?.includes('rate limit')) {
            errorMessage = '系統目前有些繁忙，請稍等一下再試！⏰';
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
}

// 处理文本消息
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userMessage = msg.text;
    
    if (!shouldRespond(msg)) {
        return;
    }
    
    console.log(`📨 收到消息 [用户: ${msg.from.first_name || msg.from.username}]: ${userMessage}`);
    
    // 检查是否是画画请求
    if (isImageRequest(userMessage)) {
        let prompt = userMessage;
        
        // 清理提示词
        const cleanPrompt = prompt
            .replace(/画|画画|画个|画一个|画张|画幅/g, '')
            .replace(/畫|畫畫|畫個|畫一個|畫張|畫幅/g, '')
            .replace(/draw|paint|create|generate|make/gi, '')
            .replace(/生成|创建|制作|做个/g, '')
            .replace(/創作|製作|做個/g, '')
            .replace(/@\w+/g, '')
            .trim();
        
        if (cleanPrompt.length > 0) {
            await generateImageWithReplicate(cleanPrompt, chatId, userId);
        } else {
            await bot.sendMessage(chatId, '💖 請告訴我你想要創作什麼樣的圖片呢？');
        }
        return;
    }
    
    try {
        await bot.sendChatAction(chatId, 'typing');
        
        const session = getUserSession(userId);
        
        session.messages.push({
            role: 'user',
            content: userMessage
        });
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: session.messages,
            max_tokens: 1000,
            temperature: 0.8,
        });
        
        const aiResponse = completion.choices[0].message.content;
        
        session.messages.push({
            role: 'assistant',
            content: aiResponse
        });
        
        cleanUserSession(userId);
        
        await bot.sendMessage(chatId, aiResponse);
        
        console.log(`✅ 已回覆 [${CHARACTER.name}]: ${aiResponse.substring(0, 50)}...`);
        
    } catch (error) {
        console.error('❌ 处理消息时出错:', error);
        
        let errorMessage = '抱歉，暫時無法回覆，請稍後再試！😊';
        
        if (error.message?.includes('rate limit')) {
            errorMessage = '請稍等一下，讓我慢慢回覆你！😊';
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
}

// 处理命令
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
💖 嗨！我是 ${CHARACTER.name}！

${CHARACTER.bio}

我可以幫助你：
• 解答幣圈相關問題 💰
• 耐心傾聽你的想法 🗣️
• 創作美麗的圖片 🎨

🎨 圖片創作（使用 Replicate）：
只要告訴我你想要的內容，例如"畫一隻貓"、"draw a sunset"

群組中請提到"Nancy"或「南希」，或者@我
私聊時我會隨時回覆你！

有任何問題都可以告訴我喔！💕
`;
    
    await bot.sendMessage(chatId, welcomeMessage);
    console.log(`✅ 新用户启动: ${msg.from.first_name || msg.from.username}`);
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
💖 ${CHARACTER.name} 使用說明

📝 命令列表：
/start - 認識我
/help - 查看使用說明
/clear - 清除對話記錄
/draw - 圖片創作說明

💬 如何與我對話：
• 私聊：直接發送消息即可，我會隨時回覆
• 群組：請提到"Nancy"或「南希」，或者@NancyChao_bot

🎨 圖片創作（Replicate SDXL）：
• 中文：畫一隻貓、畫個風景、生成美麗圖片
• 英文：draw a cat、paint landscape、create beautiful art
• 使用最新的 SDXL Lightning 模型，快速生成高質量圖片

✨ 我的特點：
${CHARACTER.style.map(style => '• ' + style).join('\n')}

有任何問題都歡迎隨時詢問我喔！💕
`;
    
    await bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/draw (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const prompt = match[1];
    
    if (!shouldRespond(msg)) {
        return;
    }
    
    await bot.sendMessage(chatId, `💖 好的！我來為你創作「${prompt}」，請稍等一下～`);
    await generateImageWithReplicate(prompt, chatId, userId);
});

bot.onText(/\/clear/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    userSessions.delete(userId);
    
    await bot.sendMessage(chatId, '💖 好的，我們的對話記錄已經清除，讓我們重新開始吧！');
    console.log(`🗑️ 清除用户会话: ${msg.from.first_name || msg.from.username}`);
});

// 处理普通文本消息
bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        await handleMessage(msg);
    }
});

// 错误处理
bot.on('error', (error) => {
    console.error('❌ Telegram Bot 错误:', error);
});

bot.on('polling_error', (error) => {
    console.error('❌ Polling 错误:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ 未处理的 Promise 拒绝:', error);
});

process.on('SIGINT', () => {
    console.log('👋 Nancy Bot 正在關閉...');
    bot.stopPolling();
    process.exit(0);
});

// 启动消息
console.log('💖 啟動 Nancy Bot (使用 Replicate)...');
console.log(`🤖 Bot 名稱: ${CHARACTER.name}`);
console.log(`📱 Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
console.log('🎨 圖片創作: Replicate SDXL Lightning');
console.log('💡 在 Telegram 中發送 /start 開始使用');
console.log('📋 等待用戶消息中...');

// 测试连接
bot.getMe().then((botInfo) => {
    console.log(`✅ Bot 連接成功: @${botInfo.username}`);
    console.log('🎨 Replicate 圖片創作功能已就緒！');
}).catch((error) => {
    console.error('❌ Bot 連接失敗:', error.message);
});