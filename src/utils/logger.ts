/**
 * Logger utility for handling application errors and events
 */

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000; // Maximum number of logs to keep in memory

  private constructor() {
    // Load any existing logs from localStorage
    try {
      const savedLogs = localStorage.getItem('folderfusionx-logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private saveLogs(): void {
    try {
      localStorage.setItem('folderfusionx-logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  private addLog(level: LogEntry['level'], message: string, details?: any): void {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };

    this.logs.push(newLog);
    
    // Keep only the latest MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    this.saveLogs();

    // Also log to console for development
    console[level](message, details || '');
  }

  public info(message: string, details?: any): void {
    this.addLog('info', message, details);
  }

  public warn(message: string, details?: any): void {
    this.addLog('warn', message, details);
  }

  public error(message: string, details?: any): void {
    this.addLog('error', message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.saveLogs();
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();