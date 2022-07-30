import { PersistenceConnector, PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { Schema } from '../schemas/schema.module';
import { Database } from './database';

export class DatabaseRepository {

    private connector: PersistenceConnector;
    private currentUser: string;

    constructor(connector: PersistenceConnector, currentUser: string) {
        this.connector = connector;
        this.currentUser = currentUser;
    }

    // TODO: finish implementing and test
    async insert(database: Database): Promise<Database> {

        const params = [
            database.getName(),
            database.getCredentials().getUsername(),
            database.getCredentials().getPassword(),
        ];

        const statements = `

            -- Create database
            CREATE DATABASE $1;

            -- Create database user
            CREATE USER $2 WITH PASSWORD '$3';
            ALTER USER $2 CREATEROLE;
            GRANT ALL PRIVILEGES ON DATABASE $1 to $2;
            ALTER DATABASE $1 OWNER TO $2;

        `;

        const transaction = this.connector.transact();
        const res = await transaction.continue<any>(statements, params);
        console.log(res); // TODO: remove after testing
        await transaction.end(true);
        return database;
    }
}