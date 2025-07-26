module.exports = {
  apps: [{
    name: 'nancy-bot',
    script: './bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // 崩溃后自动重启
    exp_backoff_restart_delay: 100,
    
    // 进程管理
    kill_timeout: 5000,
    listen_timeout: 5000,
    
    // 自动重启策略
    restart_delay: 4000,
    min_uptime: '10s',
    max_restarts: 10
  }]
};