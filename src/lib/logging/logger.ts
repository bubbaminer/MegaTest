export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Readonly<Record<string, unknown>>;

const ranks: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configuredLevel = (): LogLevel => import.meta.env.LOG_LEVEL ?? 'info';

function write(level: LogLevel, message: string, context: LogContext = {}): void {
  if (ranks[level] < ranks[configuredLevel()]) return;
  const entry = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...context });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
