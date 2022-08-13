import { PersistenceConnector, PoolFactory } from '@etauker/connector-postgres';
import { Credentials } from '../credentials/credentials';
import { PersistenceFactory } from '../persistence/persistence.factory';
import { Database } from './database';
import { DatabaseRepository } from './database.repository';

// WIP
export class DatabaseService {

    createDatabase(adminCredentials: Credentials, database: Database): Promise<Database> {
    
        // TODO: find out what database to connect to to create a database
        const config = PersistenceFactory.makeConfig(
            database.getName(),
            adminCredentials.getUsername(),
            adminCredentials.getPassword(),
        );
        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const repository = new DatabaseRepository(connector, adminCredentials.getUsername());
        return repository.insert(database);
    }

}