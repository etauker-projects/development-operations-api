import { Level } from './level.enum';
import { Category } from './category.type';
import { Format } from './format.type';
import { Config } from './config.interface';
import { Entry } from './entry';

export class LogService {

    private logLevel: Level;
    private outputFormat: Format;
    private coloursEnabled: boolean;

    constructor(config: Config) {
        this.coloursEnabled = config.coloursEnabled;
        this.logLevel = config.logLevel;
        this.outputFormat = config.outputFormat;
    }

    // ===========================================
    //              LOGGING FUNCTIONS
    // ===========================================
    public trace(message: string, tracker?: string, object?: any) {
        this.print('TRACE', message, tracker, object);
    }
    public debug(message: string, tracker?: string, object?: any) {
        this.print('DEBUG', message, tracker, object);
    }
    public config(message: string, tracker?: string, object?: any) {
        this.print('CONFIG', message, tracker, object);
    }
    public info(message: string, tracker?: string, object?: any) {
        this.print('INFO', message, tracker, object);
    }
    public warn(message: string, tracker?: string, object?: any) {
        this.print('WARN', message, tracker, object);
    }
    public error(message: string, tracker?: string, object?: any) {
        this.print('ERROR', message, tracker, object);
    }
    public print(
        category: Category,
        message: string,
        tracker?: string,
        object?: any,
    ) {
        const entry = new Entry(category, message, tracker, object);
        this.printEntry(entry);
    }
    private printEntry(entry: Entry) {
        if (this.isCategoryEnabled(entry.category())) {
            const colour = this.getColour(entry.category());

            if (this.outputFormat === 'JSON') {
                const content = JSON.stringify(entry.json());
                console.log(colour, content);
            }
            else if (this.outputFormat === 'BASIC') {
                const hasStack = Boolean(entry.stack());
                const content = `${ entry.category() }: ${ entry.message() } ${ entry.details() }`;
                console.log(colour, content);
                if (hasStack) console.log(colour, entry.stack());
            }
            else if (this.outputFormat === 'GROUP') {
                console.log(colour, entry.category());
                console.group();
                if (entry.tracker()) console.log(colour, `tracker: ${ entry.tracker() }`);
                if (entry.datetime()) console.log(colour, `datetime: ${ entry.datetime().toISOString() }`);
                // if (entry.datetime()) console.log(colour, `date: ${ entry.datetime().format('DD/MM/YYYY') }`);
                // if (entry.datetime()) console.log(colour, `time: ${ entry.datetime().format('HH:mm:ss') }`);
                console.log(colour, `message: ${ entry.message() }`);
                if (entry.details()) console.log(colour, `details: ${ entry.details() }`);
                if (entry.stack()) console.log(colour, `stack: ${ entry.stack() }`);
                console.groupEnd();
            }
        }
    }

    // ===========================================
    //                HELPERS
    // ===========================================
    private isCategoryEnabled(category: Category): boolean {
        const value: number = Level[category];
        const logValue = typeof this.logLevel === 'number' ? this.logLevel : Level[this.logLevel] as unknown as number;
        return value <= logValue;
    }

    private getColour(level: Category) {
        if (!this.coloursEnabled) {
            return '';
        }

        const colours = {
            white: '[97m',
            grey: '[90m',
            cyan: '[36m',
            magenta: '[35m',
            green: '[32m',
            yellow: '[33m',
            red: '[31m'
        };

        switch (level) {
        case 'TRACE':
            return `\x1b${ colours.cyan }%s\x1b[0m`;
        case 'DEBUG':
            return `\x1b${ colours.magenta }%s\x1b[0m`;
        case 'CONFIG':
            return `\x1b${ colours.grey }%s\x1b[0m`;
        case 'INFO':
            return `\x1b${ colours.green }%s\x1b[0m`;
        case 'WARN':
            return `\x1b${ colours.yellow }%s\x1b[0m`;
        case 'ERROR':
            return `\x1b${ colours.red }%s\x1b[0m`;
        default:
            return '';
        }
    }
}