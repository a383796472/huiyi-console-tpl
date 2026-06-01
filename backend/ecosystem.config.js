module.exports = {
  apps: [
    {
      name: 'huiyi-backend',
      script: 'app.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_USER: 'console-backend',
        DB_PASSWORD: '76NCneXiAGBXYSSy',
        DB_NAME: 'console-backend'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000
    }
  ]
};
