const path = require('path');

module.exports = {
  apps: [
    {
      name: "aipcore-frontend",
      script: "serve",
      env: {
        PM2_SERVE_PATH: path.join(__dirname, 'dist'),
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: './index.html'
      }
    },
    {
      name: "aipcore-backend",
      script: path.join(__dirname, "server", "server.js"),
      cwd: path.join(__dirname, "server"),
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
}
