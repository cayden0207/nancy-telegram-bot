# Nancy Bot 部署指南

## 🚀 快速部署到 VPS 服务器

### 1. 准备服务器
选择一个 VPS 服务商：
- DigitalOcean（推荐）
- Vultr
- Linode
- AWS EC2

创建一个 Ubuntu 20.04 或更高版本的服务器。

### 2. 连接到服务器
```bash
ssh root@你的服务器IP
```

### 3. 安装 Node.js
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4. 克隆或上传代码
```bash
# 创建应用目录
mkdir -p /var/apps
cd /var/apps

# 上传你的代码（使用 scp 或 git）
# 例如：scp -r ./simple-telegram-bot root@服务器IP:/var/apps/
```

### 5. 配置环境变量
```bash
cd /var/apps/simple-telegram-bot

# 创建 .env 文件
nano .env

# 添加以下内容：
TELEGRAM_BOT_TOKEN=8409622608:AAF5dtMG5CDJoCtsZHMoFKNmtyv3yZycqBI
OPENAI_API_KEY=你的OpenAI密钥
OPENAI_IMAGE_API_KEY=你的OpenAI图片密钥
```

### 6. 运行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🐳 Docker 部署（可选）

### 使用已有的 Dockerfile
```bash
# 构建镜像
docker build -t nancy-bot .

# 运行容器
docker run -d \
  --name nancy-bot \
  --restart always \
  -e TELEGRAM_BOT_TOKEN=你的Token \
  -e OPENAI_API_KEY=你的密钥 \
  -e OPENAI_IMAGE_API_KEY=你的图片密钥 \
  nancy-bot
```

## 🚂 Railway 部署（最简单）

1. 访问 [Railway](https://railway.app)
2. 使用 GitHub 登录
3. 创建新项目 -> Deploy from GitHub repo
4. 选择你的仓库
5. 添加环境变量
6. 点击 Deploy

## 📊 监控和管理

### PM2 常用命令
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs nancy-bot

# 重启
pm2 restart nancy-bot

# 停止
pm2 stop nancy-bot

# 查看详细信息
pm2 show nancy-bot

# 监控
pm2 monit
```

### 设置日志轮转
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🔒 安全建议

1. **使用环境变量**：永远不要在代码中硬编码密钥
2. **设置防火墙**：只开放必要的端口
3. **定期更新**：保持系统和依赖项更新
4. **备份**：定期备份你的 .env 文件和数据

## 🆘 故障排除

### Bot 无响应
```bash
# 检查进程状态
pm2 status

# 查看错误日志
pm2 logs --err

# 重启
pm2 restart nancy-bot
```

### 内存不足
```bash
# 查看内存使用
pm2 monit

# 调整内存限制（在 ecosystem.config.js 中）
max_memory_restart: '300M'
```

## 💰 成本估算

- **VPS**：$5-10/月
- **Railway**：有免费额度，超出后约 $5/月
- **Docker on Cloud**：按使用量计费，轻量使用约 $3-5/月

选择最适合你的方案！