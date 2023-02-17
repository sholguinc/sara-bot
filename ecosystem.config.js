module.exports = {
  apps: [
    {
      name: 'sara-bot',
      script: './src/main.js',
      watch: true,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker',
      script: 'worker.js',
    },
  ],
};
