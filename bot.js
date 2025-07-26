const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
require('dotenv').config();

// Bot 配置
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8409622608:AAF5dtMG5CDJoCtsZHMoFKNmtyv3yZycqBI';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_API_KEY = process.env.OPENAI_IMAGE_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ 请设置 OPENAI_API_KEY 环境变量');
    console.error('请在 .env 文件中添加: OPENAI_API_KEY=你的API密钥');
    process.exit(1);
}

if (!OPENAI_IMAGE_API_KEY) {
    console.error('❌ 请设置 OPENAI_IMAGE_API_KEY 环境变量');
    console.error('请在 .env 文件中添加: OPENAI_IMAGE_API_KEY=你的图片生成API密钥');
    process.exit(1);
}

// 初始化服务
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// 两个不同的 OpenAI 客户端
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY, // 用于对话
});

const openaiImage = new OpenAI({
    apiKey: OPENAI_IMAGE_API_KEY, // 用于图片生成
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

// 存储用户对话历史（简单内存存储）
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

// 清理用户会话（防止内存过载）
function cleanUserSession(userId) {
    const session = getUserSession(userId);
    if (session.messages.length > 20) {
        // 保留系统消息和最近10条对话
        const systemMessage = session.messages[0];
        const recentMessages = session.messages.slice(-10);
        session.messages = [systemMessage, ...recentMessages];
    }
}

// 检查是否应该回应消息
function shouldRespond(msg) {
    const text = msg.text.toLowerCase();
    const botUsername = 'NancyChao_bot'; // 你的 bot 用户名
    
    // 检查是否提到了 Nancy
    if (text.includes('nancy') || text.includes('南希')) {
        return true;
    }
    
    // 检查是否艾特了 bot
    if (msg.entities) {
        for (const entity of msg.entities) {
            if (entity.type === 'mention' && text.includes(`@${botUsername}`)) {
                return true;
            }
        }
    }
    
    // 私聊总是回应
    if (msg.chat.type === 'private') {
        return true;
    }
    
    return false;
}

// 检查是否是画画请求
function isImageRequest(text) {
    const imageKeywords = [
        '画', '画画', '画个', '画一个', '画张', '画幅',
        '畫', '畫畫', '畫個', '畫一個', '畫張', '畫幅',  // 繁體中文
        'draw', 'paint', 'create', 'generate', 'make',
        '生成', '创建', '制作', '做个',
        '創作', '製作', '做個',  // 繁體中文
        'image', 'picture', 'photo', '图片', '照片', '图像',
        '圖片', '照片', '圖像'  // 繁體中文
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
}

// 图片生成函数
async function generateImage(prompt, chatId, userId) {
    try {
        console.log(`🎨 开始生成图片 [用户: ${userId}]: ${prompt}`);
        
        // 显示正在生成图片的状态
        await bot.sendChatAction(chatId, 'upload_photo');
        
        // 优化提示词，添加动漫风格
        const enhancedPrompt = `${prompt}, anime style, kawaii, cute, colorful, vibrant rainbow gradient background, pastel colors, manga art style, cheerful, bright lighting, high quality, detailed`;
        
        // 调用 DALL-E 3 API
        const response = await openaiImage.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });
        
        const imageUrl = response.data[0].url;
        
        // 發送圖片
        await bot.sendPhoto(chatId, imageUrl, {
            caption: `💖 圖片已經創作完成了！希望你會喜歡這張作品！🎨`
        });
        
        console.log(`✅ 图片生成成功 [${CHARACTER.name}]: ${prompt}`);
        
    } catch (error) {
        console.error('❌ 图片生成失败:', error);
        
        let errorMessage = '抱歉，暫時無法創作圖片，請稍後再試試看！😊';
        
        if (error.message?.includes('content_policy')) {
            errorMessage = '這個內容可能不太適合創作圖片，請換個其他的主題試試！💕';
        } else if (error.message?.includes('rate limit')) {
            errorMessage = '系統目前有些繁忙，請稍等一下再試！⏰';
        } else if (error.message?.includes('API key')) {
            errorMessage = '系統出現了一些問題，我會盡快解決的！🔧';
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
}

// 处理文本消息
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userMessage = msg.text;
    
    // 检查是否应该回应
    if (!shouldRespond(msg)) {
        return; // 不回应
    }
    
    console.log(`📨 收到消息 [用户: ${msg.from.first_name || msg.from.username}]: ${userMessage}`);
    
    // 检查是否是画画请求
    if (isImageRequest(userMessage)) {
        // 提取画画内容
        let prompt = userMessage;
        
        // 清理提示词，移除画画关键词但保留nancy/南希等内容词
        const cleanPrompt = prompt
            .replace(/画|画画|画个|画一个|画张|画幅/g, '')
            .replace(/畫|畫畫|畫個|畫一個|畫張|畫幅/g, '')  // 繁體中文
            .replace(/draw|paint|create|generate|make/gi, '')
            .replace(/生成|创建|制作|做个/g, '')
            .replace(/創作|製作|做個/g, '')  // 繁體中文
            .replace(/@\w+/g, '') // 移除艾特
            .trim();
        
        if (cleanPrompt.length > 0) {
            await generateImage(cleanPrompt, chatId, userId);
        } else {
            await bot.sendMessage(chatId, '💖 請告訴我你想要創作什麼樣的圖片呢？');
        }
        return;
    }
    
    try {
        // 显示输入中状态
        await bot.sendChatAction(chatId, 'typing');
        
        // 获取用户会话
        const session = getUserSession(userId);
        
        // 添加用户消息到历史
        session.messages.push({
            role: 'user',
            content: userMessage
        });
        
        // 调用 OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: session.messages,
            max_tokens: 1000,
            temperature: 0.8, // 增加一点随机性，让回复更有趣
        });
        
        const aiResponse = completion.choices[0].message.content;
        
        // 添加AI回复到历史
        session.messages.push({
            role: 'assistant',
            content: aiResponse
        });
        
        // 清理过长的会话历史
        cleanUserSession(userId);
        
        // 发送回复
        await bot.sendMessage(chatId, aiResponse);
        
        console.log(`✅ 已回覆 [${CHARACTER.name}]: ${aiResponse.substring(0, 50)}...`);
        
    } catch (error) {
        console.error('❌ 处理消息时出错:', error);
        
        let errorMessage = '抱歉，暫時無法回覆，請稍後再試！😊';
        
        if (error.message?.includes('rate limit')) {
            errorMessage = '請稍等一下，讓我慢慢回覆你！😊';
        } else if (error.message?.includes('API key')) {
            errorMessage = '系統出現了一些問題，我會盡快解決的！🔧';
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
}

// 處理 /start 命令
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
💖 嗨！我是 ${CHARACTER.name}！

${CHARACTER.bio}

我可以幫助你：
• 解答幣圈相關問題 💰
• 耐心傾聽你的想法 🗣️
• 創作美麗的圖片 🎨

🎨 圖片創作：
只要告訴我你想要的內容，例如"畫一隻貓"、"draw a sunset"

群組中請提到"Nancy"或「南希」，或者@我
私聊時我會隨時回覆你！

有任何問題都可以告訴我喔！💕
`;
    
    await bot.sendMessage(chatId, welcomeMessage);
    console.log(`✅ 新用户启动: ${msg.from.first_name || msg.from.username}`);
});

// 處理 /help 命令
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

🎨 圖片創作：
• 中文：畫一隻貓、畫個風景、生成美麗圖片
• 英文：draw a cat、paint landscape、create beautiful art
• 使用 DALL-E 3 為你創作高質量圖片

✨ 我的特點：
${CHARACTER.style.map(style => '• ' + style).join('\n')}

有任何問題都歡迎隨時詢問我喔！💕
`;
    
    await bot.sendMessage(chatId, helpMessage);
});

// 处理 /draw 命令
bot.onText(/\/draw (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const prompt = match[1];
    
    if (!shouldRespond(msg)) {
        return;
    }
    
    await bot.sendMessage(chatId, `💖 好的！我來為你創作「${prompt}」，請稍等一下～`);
    await generateImage(prompt, chatId, userId);
});

// 处理 /clear 命令
bot.onText(/\/clear/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // 清除用户会话
    userSessions.delete(userId);
    
    await bot.sendMessage(chatId, '💖 好的，我們的對話記錄已經清除，讓我們重新開始吧！');
    console.log(`🗑️ 清除用户会话: ${msg.from.first_name || msg.from.username}`);
});

// 处理普通文本消息
bot.on('message', async (msg) => {
    // 忽略命令消息
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
    console.log('👋 DONKEY 要下班了...');
    bot.stopPolling();
    process.exit(0);
});

// 启动消息
console.log('🐴 启动金驴 DONKEY Bot (现在会画画了!)...');
console.log(`🤖 驴子名称: ${CHARACTER.name}`);
console.log(`📱 Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
console.log('🎨 图片生成功能: DALL-E 3 已启用');
console.log('💡 在 Telegram 中发送 /start 开始使用');
console.log('📋 等待主人们的消息中...');

// 測試連接
bot.getMe().then((botInfo) => {
    console.log(`✅ Bot 連接成功: @${botInfo.username}`);
    console.log('🎨 圖片創作功能已就緒！');
}).catch((error) => {
    console.error('❌ Bot 連接失敗:', error.message);
}); 