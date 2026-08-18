module.exports = {
  apps: [
    {
      name: 'nammari-tree-staging',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
