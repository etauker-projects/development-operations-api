import { Level } from './level.enum';
import { Format } from './format.type';

export interface Config {
    readonly coloursEnabled: boolean;
    readonly logLevel: Level;
    readonly outputFormat: Format;
}