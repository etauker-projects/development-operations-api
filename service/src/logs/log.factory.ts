import { Level } from './level.enum';
import { Config } from './config.interface';
import { Format } from './format.type';
import { LogService } from './log.service';
import { Extractor } from '../environment/extractor';

export class LogFactory {

    /**
     * Provides a convenient way to instantiate a logging service
     * using configuration values from environment variables.
     */
    public static makeService(overrides: Partial<Config> = {}): LogService {
        const config = LogFactory.makeConfig(overrides);
        return new LogService(config);
    }

    /**
     * Provides a convenient way to instantiate a logging 
     * configuration using values from environment variables.
     */
    public static makeConfig(overrides: Partial<Config> = {}): Config {
        const level = Extractor.extractEnum('LOGGER_LOG_LEVEL', Object.keys(Level), Level.ALL.toString());
        const format = Extractor.extractEnum('LOGGER_OUTPUT_FORMAT', [ 'JSON', 'BASIC', 'GROUP' ], 'GROUP');

        return {
            coloursEnabled: Extractor.extractBoolean('LOGGER_COLOURS_ENABLED', true),
            logLevel: Level[level],
            outputFormat: format as Format,
            ...overrides,
        };
    }

}