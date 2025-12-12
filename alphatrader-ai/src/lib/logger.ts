/**
 * Production-ready logging utility
 * Supports different log levels and structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));

    // In production, send to monitoring service (e.g., Sentry)
    if (this.isProduction && typeof window !== 'undefined') {
      // TODO: Integrate with error tracking service
      // Sentry.captureException(error, { extra: context });
    }
  }

  // API-specific logging
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, status: number, duration: number): void {
    this.info(`API Response: ${method} ${path}`, { status, duration: `${duration}ms` });
  }

  apiError(method: string, path: string, error: Error | unknown): void {
    this.error(`API Error: ${method} ${path}`, error);
  }
}

export const logger = new Logger();
