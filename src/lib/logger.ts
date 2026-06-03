/**
 * Logger según entorno
 * - info / warn / error: también en producción (stdout para PM2, Docker, etc.)
 * - debug: solo en desarrollo, o en producción si LOG_DEBUG=1
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = process.env.NODE_ENV === 'development';
const debugInProd = process.env.LOG_DEBUG === "1" || process.env.LOG_DEBUG === "true";

/**
 * Formatea el mensaje con timestamp y nivel
 */
function formatMessage(level: LogLevel, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}`;
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de información (desarrollo y producción)
   */
  info: (...args: unknown[]) => {
    console.log(formatMessage("info", ...args));
  },

  /**
   * Log de advertencias (siempre visible)
   */
  warn: (...args: unknown[]) => {
    console.warn(formatMessage('warn', ...args));
  },

  /**
   * Log de errores (siempre visible)
   */
  error: (...args: unknown[]) => {
    console.error(formatMessage('error', ...args));
  },

  /**
   * Log de debug (desarrollo; en producción solo con LOG_DEBUG=1/true)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment || debugInProd) {
      console.log(formatMessage("debug", ...args));
    }
  },

  /**
   * Log condicional según nivel
   */
  log: (level: LogLevel, ...args: unknown[]) => {
    switch (level) {
      case 'info':
        logger.info(...args);
        break;
      case 'warn':
        logger.warn(...args);
        break;
      case 'error':
        logger.error(...args);
        break;
      case 'debug':
        logger.debug(...args);
        break;
    }
  }
};

export default logger;

