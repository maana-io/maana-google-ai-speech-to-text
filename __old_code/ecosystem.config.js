module.exports = {
  apps: [
    {
      name: 'Audio Analyzer',
      script: 'src/index.js',
      instances: 10,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
