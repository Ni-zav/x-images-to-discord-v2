export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export function log(level: LogLevel, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}]`, message, ...args);
}

export const info = (msg: string, ...args: any[]) => log(LogLevel.INFO, msg, ...args);
export const warn = (msg: string, ...args: any[]) => log(LogLevel.WARN, msg, ...args);
export const error = (msg: string, ...args: any[]) => log(LogLevel.ERROR, msg, ...args);
