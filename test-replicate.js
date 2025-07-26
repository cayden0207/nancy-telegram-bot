const Replicate = require('replicate');
require('dotenv').config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ 请设置 REPLICATE_API_TOKEN 环境变量');
    console.error('在 .env 文件中添加: REPLICATE_API_TOKEN=你的API Token');
    process.exit(1);
}

// 测试不同的模型
async function testModels() {
    console.log('🧪 开始测试 Replicate 模型...\n');

    // 1. 测试 SDXL (文字生成图片)
    console.log('📸 测试 1: SDXL - 生成币圈素材');
    try {
        const sdxlOutput = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: "bitcoin price chart going up, professional financial graphic, modern design, blue and gold colors",
                    width: 1024,
                    height: 1024,
                    num_outputs: 1
                }
            }
        );
        console.log('✅ SDXL 成功:', sdxlOutput[0]);
        console.log('预计成本: $0.0023\n');
    } catch (error) {
        console.error('❌ SDXL 失败:', error.message, '\n');
    }

    // 2. 测试 SDXL Lightning (超快速版本)
    console.log('⚡ 测试 2: SDXL Lightning - 快速生成');
    try {
        const lightningOutput = await replicate.run(
            "bytedance/sdxl-lightning-4step:5f24084160c9089501c1b3545d9be3c27883ae2239b6f412990e82d4a6210f8f",
            {
                input: {
                    prompt: "cute anime girl with cat, colorful background",
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 4
                }
            }
        );
        console.log('✅ SDXL Lightning 成功:', lightningOutput[0]);
        console.log('预计成本: $0.001\n');
    } catch (error) {
        console.error('❌ SDXL Lightning 失败:', error.message, '\n');
    }

    // 3. 测试 Flux (最新模型)
    console.log('🎨 测试 3: Flux.1 [dev] - 最新技术');
    try {
        const fluxOutput = await replicate.run(
            "black-forest-labs/flux-dev",
            {
                input: {
                    prompt: "cryptocurrency trading desk with multiple monitors showing charts",
                    num_outputs: 1,
                    aspect_ratio: "1:1",
                    output_format: "webp",
                    output_quality: 80
                }
            }
        );
        console.log('✅ Flux 成功:', fluxOutput[0]);
        console.log('预计成本: $0.03\n');
    } catch (error) {
        console.error('❌ Flux 失败:', error.message, '\n');
    }

    // 4. 测试图片编辑 (需要提供图片URL)
    console.log('✏️ 测试 4: InstructPix2Pix - 图片编辑');
    console.log('⚠️  需要提供图片URL才能测试此功能\n');

    console.log('💡 提示：');
    console.log('1. 访问 https://replicate.com/explore 查看更多模型');
    console.log('2. 每个模型页面都有详细的参数说明');
    console.log('3. 可以在网页上免费测试后再集成到代码中');
}

// 测试单个模型
async function testSingleModel(modelId, input) {
    console.log(`\n🧪 测试模型: ${modelId}`);
    console.log('输入参数:', JSON.stringify(input, null, 2));
    
    try {
        const output = await replicate.run(modelId, { input });
        console.log('✅ 成功! 输出:', output);
        return output;
    } catch (error) {
        console.error('❌ 失败:', error.message);
        return null;
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // 运行所有测试
        await testModels();
    } else if (args[0] === 'custom') {
        // 自定义测试示例
        await testSingleModel(
            "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
            {
                prompt: "a photo of an astronaut riding a horse on mars",
                width: 768,
                height: 768
            }
        );
    } else {
        console.log('用法:');
        console.log('  node test-replicate.js        # 运行预设测试');
        console.log('  node test-replicate.js custom # 运行自定义测试');
    }
}

// 运行测试
main().catch(console.error);