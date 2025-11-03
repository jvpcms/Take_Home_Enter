import envConfig from '../envconfig/envconfig.ts';
import { getIsoString } from './timestamp.ts';

enum LogLevel {
    DEBUG = 5,
    INFO = 4,
    WARN = 3,
    ERROR = 2,
    FATAL = 1
}

export interface ICustomLogger {
    debug(message: any): void;
    info(message: any): void;
    warn(message: any): void;
    error(message: any): void;
    fatal(message: any): void;
}

class DummyLogger implements ICustomLogger {
    debug(message: any): void { };
    info(message: any): void { };
    warn(message: any): void { };
    error(message: any): void { };
    fatal(message: any): void { };
}

class CustomLogger implements ICustomLogger {
    private readonly logging_level: LogLevel;
    private readonly name: string;

    // ANSI color codes
    private readonly colors = {
        reset: '\x1b[0m',
        debug: '\x1b[36m',    // Cyan
        info: '\x1b[34m',     // Blue
        warn: '\x1b[33m',     // Yellow
        error: '\x1b[31m',    // Red
        fatal: '\x1b[35m',    // Magenta
    };

    constructor(name: string) {
        this.logging_level = envConfig.loggingLevel() as LogLevel;
        this.name = name;
    }

    private getColorForLevel(level: string): string {
        const levelUpper = level.toUpperCase();
        switch (levelUpper) {
            case 'DEBUG':
                return this.colors.debug;
            case 'INFO':
                return this.colors.info;
            case 'WARN':
                return this.colors.warn;
            case 'ERROR':
                return this.colors.error;
            case 'FATAL':
                return this.colors.fatal;
            default:
                return this.colors.reset;
        }
    }

    private log(level: any, message: string): void {
        const color = this.getColorForLevel(level);
        const reset = this.colors.reset;
        console.log(`${color}[${getIsoString()}] ${this.name} [${level}]${reset} ${message}`);
    }

    debug(message: any): void {
        if (this.logging_level >= LogLevel.DEBUG) {
            this.log('DEBUG', message);
        }
    }

    info(message: any): void {
        if (this.logging_level >= LogLevel.INFO) {
            this.log('INFO', message);
        }
    }

    warn(message: any): void {
        if (this.logging_level >= LogLevel.WARN) {
            this.log('WARN', message);
        }
    }

    error(message: any): void {
        if (this.logging_level >= LogLevel.ERROR) {
            this.log('ERROR', message);
        }
    }

    fatal(message: any): void {
        if (this.logging_level >= LogLevel.FATAL) {
            this.log('FATAL', message);
        }
    }
}

export function createLogger(name: string): ICustomLogger {
    return new CustomLogger(name);
}