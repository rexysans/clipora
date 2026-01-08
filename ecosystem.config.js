// PM2 ecosystem configuration file
// Deploy with: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'clipora-api',
      script: './backend/src/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/clipora/api-error.log',
      out_file: '/var/log/clipora/api-out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
    },
    {
      name: 'clipora-worker',
      script: './worker/index.js',
      instances: 1, // Single instance for video processing
      exec_mode: 'fork',
      cwd: '/var/www/clipora',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO',
      },
      error_file: '/var/log/clipora/worker-error.log',
      out_file: '/var/log/clipora/worker-out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',
    },
  ],
};
