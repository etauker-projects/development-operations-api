import { IPersistenceConfig } from '@etauker/connector-postgres';
import { Extractor } from '../environment/extractor';

export class PersistenceFactory {

    /**
     * Provides a convenient way to instantiate database 
     * configuration using values from environment variables.
     */
    public static makeConfig(
        database: string,
        username: string,
        password: string,
        overrides: Partial<IPersistenceConfig> = {},
    ): IPersistenceConfig {

        return {
            database, user: username, password,
            // TODO: use node name to determine the url
            host: Extractor.extractString('DATABASE_HOST'),
            port: Extractor.extractNumber('DATABASE_PORT', 5432),
            ssl: Extractor.extractBoolean('DATABASE_SSL_CONNECTION', true),
            // new pool used for each request (should change to not use pools here)
            max: Extractor.extractNumber('DATABASE_MAX_POOL_SIZE', 1),
            // close idle clients after 1 second
            idleTimeoutMillis: Extractor.extractNumber('DATABASE_IDLE_TIMEOUT_MILLIS', 1000),
            // return an error after 1 second if connection could not be established
            connectionTimeoutMillis: Extractor.extractNumber('DATABASE_CONNECTION_TIMEOUT_MILLIS', 1000),
            ...overrides,
        };
    }
}
