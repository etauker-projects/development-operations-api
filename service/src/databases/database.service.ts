import { IPersistenceConfig, PersistenceConnector, PoolFactory } from '@etauker/connector-postgres';
import { Credentials } from '../credentials/credentials';
import { Schema } from '../schemas/schema.module';
import { Database } from './database';
import { DatabaseRepository } from './database.repository';

// WIP
export class DatabaseService {

    constructor() {

    }

    createDatabase(adminCredentials: Credentials, database: Database): Promise<Database> {
    
        // TODO: consider moving into the repository
        // TODO: find out what database to connect to to create a database
        const config: IPersistenceConfig = {
            database: database.getName(),
            user: adminCredentials.getUsername(),
            password: adminCredentials.getPassword(),
            ...this.getRemainingConnection(''),
        };

        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const repository = new DatabaseRepository(connector);
        return repository.insert(database);
    }

    createSchema(nodeName: string, databaseName: string, adminCredentials: Credentials, schema: Schema): Promise<Schema> {

        const config: IPersistenceConfig = {
            database: databaseName,
            user: adminCredentials.getUsername(),
            password: adminCredentials.getPassword(),
            ...this.getRemainingConnection(nodeName),
        };

        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const repository = new DatabaseRepository(connector);
        return repository.insertSchema(schema);
    }


    // TODO: get configuration from factory or somewhere else
    private getRemainingConnection(nodeName: string): Omit<IPersistenceConfig, 'database' | 'user' | 'password'> {
        return {
            host: process.env.DATABASE_HOST, // TODO: use node name to determine the url
            port: parseInt(process.env?.DATABASE_PORT || '5432'),
            ssl: true,
            max: 1,                         // new pool used for each request (should change to not use pools here)
            idleTimeoutMillis: 1000,        // close idle clients after 1 second
            connectionTimeoutMillis: 1000,  // return an error after 1 second if connection could not be established
        };
    }

}