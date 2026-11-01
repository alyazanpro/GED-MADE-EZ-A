export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private environment: string;

  constructor() {
    this.minLevel = this.getLogLevelFromEnv();
    this.environment = process.env.NODE_ENV || "development";
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      return envLevel as LogLevel;
    }
    return this.environment === "production" ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      environment: this.environment,
      ...(context && { context })
    };
    return JSON.stringify(logEntry);
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // In production, you might want to send logs to a service
    if (this.environment === "production") {
      this.sendToLoggingService(level, message, context);
    }
  }

  private sendToLoggingService(level: LogLevel, message: string, context?: LogContext): void {
    // Implement sending to external logging service (Datadog, CloudWatch, etc.)
    // This is a placeholder for production implementation
    try {
      // Example: Send to your logging service
      // await fetch('https://your-logging-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ level, message, context, timestamp: new Date().toISOString() })
      // });
    } catch (error) {
      console.error("Failed to send log to external service:", error);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  // Convenience methods for common scenarios
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, context);
  }

  databaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug(`Database Query: ${query} (${duration}ms)`, context);
  }

  errorOccurred(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name
    });
  }

  userAction(action: string, userId: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, { userId, ...context });
  }
}

// Global logger instance
export const logger = new Logger();

// Create child loggers with specific context
export function createLogger(context: LogContext): Logger {
  const childLogger = new Logger();
  const originalLog = childLogger.log.bind(childLogger);
  
  childLogger.log = (level: LogLevel, message: string, additionalContext?: LogContext) => {
    originalLog(level, message, { ...context, ...additionalContext });
  };
  
  return childLogger;
}
