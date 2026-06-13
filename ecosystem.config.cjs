/**
 * Configuración PM2 para Next.js en producción (Vivapay).
 *
 * Uso:
 *   1. mkdir -p logs
 *   2. Compilar: pnpm build
 *   3. Iniciar:  pnpm pm2:start   o   pm2 start ecosystem.config.cjs
 *   4. Ver:      pm2 status
 *   5. Logs:     pm2 logs vivapay   (también en ./logs/ vía rutas absolutas)
 *   6. Parar:    pm2 stop vivapay
 */

const path = require("path");

const logDir = path.join(__dirname, "logs");

module.exports = {
  apps: [
    {
      name: "vivapay",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4566",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_restarts: 10,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4566,
      },
      env_development: {
        NODE_ENV: "development",
      },
      error_file: path.join(logDir, "pm2-error.log"),
      out_file: path.join(logDir, "pm2-out.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
    },
  ],
};
