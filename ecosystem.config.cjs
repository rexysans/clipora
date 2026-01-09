module.exports = {
  apps: [
    {
      name: 'clipora-api',
      script: './backend/src/server.js',
      cwd: '/var/www/clipora',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/clipora/api-error.log',
      out_file: '/var/log/clipora/api-out.log',
      combine_logs: true,
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512'
    },
    {
      name: 'clipora-worker',
      script: './worker/index.js',
      cwd: '/var/www/clipora',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/clipora/worker-error.log',
      out_file: '/var/log/clipora/worker-out.log',
      combine_logs: true,
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};