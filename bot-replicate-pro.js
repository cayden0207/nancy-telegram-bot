const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const Replicate = require('replicate');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
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

// 存储用户对话历史和等待图片状态
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
            ],
            waitingForImage: false,
            imageEditPrompt: null
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
    const text = msg.text?.toLowerCase() || '';
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

// 检查是否是图片编辑请求
function isImageEditRequest(text) {
    const editKeywords = [
        '修改', '编辑', '改', '調整', '修圖', '二創', '二创',
        'edit', 'modify', 'change', 'adjust', 'remix',
        '基於', '基于', 'based on', '參考', '参考'
    ];
    
    const lowerText = text.toLowerCase();
    return editKeywords.some(keyword => lowerText.includes(keyword));
}

// 优化币圈素材提示词
function optimizeCryptoPrompt(prompt) {
    // 检查是否包含币圈相关词汇
    const cryptoKeywords = ['币', '幣', 'crypto', 'bitcoin', 'btc', 'eth', 'defi', 'nft', 'blockchain', '区块链', '區塊鏈'];
    const isCrypto = cryptoKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    
    if (isCrypto) {
        return `${prompt}, professional cryptocurrency design, modern fintech style, clean minimal aesthetic, blue and gold color scheme, high-tech feeling, suitable for social media`;
    } else {
        return `${prompt}, anime style, kawaii, cute, colorful, vibrant colors, high quality, detailed`;
    }
}

// 使用 Replicate 生成图片（文字到图片）
async function generateImageFromText(prompt, chatId, userId) {
    try {
        console.log(`🎨 开始生成图片 [用户: ${userId}]: ${prompt}`);
        
        await bot.sendChatAction(chatId, 'upload_photo');
        
        // 优化提示词
        const enhancedPrompt = optimizeCryptoPrompt(prompt);
        
        // 使用 SDXL 模型
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: enhancedPrompt,
                    width: 1024,
                    height: 1024,
                    scheduler: "K_EULER",
                    num_outputs: 1,
                    guidance_scale: 7.5,
                    num_inference_steps: 25,
                    negative_prompt: "ugly, blurry, low quality, distorted, deformed, bad anatomy"
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

// 下载 Telegram 图片
async function downloadImage(fileId) {
    const fileLink = await bot.getFileLink(fileId);
    const response = await fetch(fileLink);
    const buffer = await response.buffer();
    const tempPath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
}

// 使用 Replicate 编辑图片（图片到图片）
async function editImageWithPrompt(imagePath, prompt, chatId, userId) {
    try {
        console.log(`🎨 开始编辑图片 [用户: ${userId}]: ${prompt}`);
        
        await bot.sendChatAction(chatId, 'upload_photo');
        
        // 读取图片并转换为 base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        
        // 使用 InstructPix2Pix 模型进行智能编辑
        const output = await replicate.run(
            "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
            {
                input: {
                    image: base64Image,
                    prompt: prompt,
                    num_outputs: 1,
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    image_guidance_scale: 1.5
                }
            }
        );
        
        // 删除临时文件
        fs.unlinkSync(imagePath);
        
        // 发送编辑后的图片
        await bot.sendPhoto(chatId, output[0], {
            caption: `💖 圖片編輯完成了！希望這正是你想要的效果！✨`
        });
        
        console.log(`✅ 图片编辑成功`);
        
    } catch (error) {
        console.error('❌ 图片编辑失败:', error);
        
        // 清理临时文件
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        
        await bot.sendMessage(chatId, '抱歉，圖片編輯遇到了一些問題，請稍後再試！😊');
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
    
    const session = getUserSession(userId);
    
    console.log(`📨 收到消息 [用户: ${msg.from.first_name || msg.from.username}]: ${userMessage}`);
    
    // 检查是否是图片编辑请求
    if (isImageEditRequest(userMessage)) {
        session.waitingForImage = true;
        session.imageEditPrompt = userMessage;
        await bot.sendMessage(chatId, '💖 好的！請發送你想要編輯的圖片給我，我會根據你的要求進行修改！📸');
        return;
    }
    
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
            await generateImageFromText(cleanPrompt, chatId, userId);
        } else {
            await bot.sendMessage(chatId, '💖 請告訴我你想要創作什麼樣的圖片呢？');
        }
        return;
    }
    
    // 普通对话
    try {
        await bot.sendChatAction(chatId, 'typing');
        
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
        
        await bot.sendMessage(chatId, '抱歉，暫時無法回覆，請稍後再試！😊');
    }
}

// 处理图片消息
async function handlePhoto(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = getUserSession(userId);
    
    if (!shouldRespond(msg) && !session.waitingForImage) {
        return;
    }
    
    if (session.waitingForImage && session.imageEditPrompt) {
        // 获取最大尺寸的图片
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        try {
            // 下载图片
            const imagePath = await downloadImage(fileId);
            
            // 使用保存的编辑提示词
            await editImageWithPrompt(imagePath, session.imageEditPrompt, chatId, userId);
            
            // 重置状态
            session.waitingForImage = false;
            session.imageEditPrompt = null;
            
        } catch (error) {
            console.error('❌ 处理图片失败:', error);
            await bot.sendMessage(chatId, '抱歉，處理圖片時遇到了問題，請稍後再試！😊');
        }
    } else {
        // 如果没有在等待图片，询问用户想做什么
        await bot.sendMessage(chatId, '💖 我收到了你的圖片！你想要我怎麼處理它呢？可以告訴我你的編輯需求喔！');
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
• 創作專業的幣圈素材圖 📊
• 編輯和二創你的圖片 🎨

🎨 圖片功能：
1️⃣ **創作新圖片**：直接告訴我你想要什麼
   例如："畫一個比特幣價格上漲的圖表"

2️⃣ **編輯現有圖片**：先告訴我編輯需求，再發送圖片
   例如："幫我修改這張圖，加上 $CHAO 的 logo"

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

🎨 圖片創作功能：

**1. 文字生成圖片** (特別優化幣圈素材)
• "畫一個比特幣價格圖表"
• "創作 DeFi 概念圖"
• "生成 NFT 宣傳海報"

**2. 圖片編輯二創**
• 先說明編輯需求："修改圖片，添加 logo"
• 然後發送原圖
• AI 會智能理解並編輯

✨ 我的特點：
${CHARACTER.style.map(style => '• ' + style).join('\n')}

💡 小技巧：
• 幣圈相關圖片會自動優化為專業風格
• 編輯圖片時說明越具體效果越好

有任何問題都歡迎隨時詢問我喔！💕
`;
    
    await bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/clear/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    userSessions.delete(userId);
    
    await bot.sendMessage(chatId, '💖 好的，我們的對話記錄已經清除，讓我們重新開始吧！');
    console.log(`🗑️ 清除用户会话: ${msg.from.first_name || msg.from.username}`);
});

// 处理文本消息
bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        await handleMessage(msg);
    }
});

// 处理图片消息
bot.on('photo', async (msg) => {
    await handlePhoto(msg);
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
console.log('💖 啟動 Nancy Bot (專業版 - 支持圖片二創)...');
console.log(`🤖 Bot 名稱: ${CHARACTER.name}`);
console.log(`📱 Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
console.log('🎨 圖片功能：');
console.log('  - 文字生成圖片 (優化幣圈素材)');
console.log('  - 圖片智能編輯二創');
console.log('💡 在 Telegram 中發送 /start 開始使用');
console.log('📋 等待用戶消息中...');

// 测试连接
bot.getMe().then((botInfo) => {
    console.log(`✅ Bot 連接成功: @${botInfo.username}`);
    console.log('🎨 Replicate 圖片功能已就緒！');
}).catch((error) => {
    console.error('❌ Bot 連接失敗:', error.message);
});