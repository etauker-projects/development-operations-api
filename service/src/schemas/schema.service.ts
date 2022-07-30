import { IPersistenceConfig, PersistenceConnector, PersistenceTransaction, PoolFactory } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { Credentials } from '../credentials/credentials.module';
import { UserRepository } from '../users/user.module';
import { Schema, SchemaRepository } from './schema.module';

export class SchemaService {

    constructor() {

    }

    async initialiseSchema(nodeName: string, databaseName: string, adminCredentials: Credentials, schema: Schema): Promise<Schema> {

        const config: IPersistenceConfig = {
            database: databaseName,
            user: adminCredentials.getUsername(),
            password: adminCredentials.getPassword(),
            ...this.getRemainingConnection(nodeName),
        };

        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const schemaRepository = new SchemaRepository();
        const userRepository = new UserRepository();

        // Part 1: schema and user creation
        const transaction1 = connector.transact();
        try {
            await schemaRepository.createSchema(transaction1, schema.getName());
            await userRepository.createUser(transaction1, schema.getAdmin().getUsername(), schema.getAdmin().getPassword());
            await userRepository.createUser(transaction1, schema.getUser().getUsername(), schema.getUser().getPassword());
            await transaction1.commit();
        } catch (error) {
            await this.handleRollback(transaction1);
            throw this.convertError(error);
        }

        // Part 2: permission grants and schema alterations
        const transaction2 = connector.transact();
        try {

            // ADMIN
            await userRepository.updateUserSearchPath(transaction2, schema.getName(), schema.getAdmin().getUsername());
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL TABLES IN SCHEMA $1 TO $2', [ schema.getName(), schema.getAdmin().getUsername() ] );
            await this.executeUpdate(transaction2, 'GRANT $1 TO $2', [ schema.getAdmin().getUsername(), adminCredentials.getUsername() ]);
            await this.executeUpdate(transaction2, 'ALTER SCHEMA $1 OWNER TO $2', [ schema.getName(), schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT CREATE, USAGE ON SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL TABLES IN SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);

            // USER
            await userRepository.updateUserSearchPath(transaction2, schema.getName(), schema.getUser().getUsername());
            await this.executeUpdate(transaction2, 'GRANT USAGE ON SCHEMA $1 TO $2', [ schema.getName(), schema.getUser().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA $1 TO $2', [ schema.getName(), schema.getUser().getUsername() ]);

            await transaction2.commit();
            return schema;
        } catch (error) {
            await this.removeSchema(nodeName, databaseName, adminCredentials, schema);
            await this.handleRollback(transaction2);
            throw this.convertError(error);
        }
    }

    async removeSchema(nodeName: string, databaseName: string, adminCredentials: Credentials, schema: Schema): Promise<void> {

        const config: IPersistenceConfig = {
            database: databaseName,
            user: adminCredentials.getUsername(),
            password: adminCredentials.getPassword(),
            ...this.getRemainingConnection(nodeName),
        };

        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const schemaRepository = new SchemaRepository();
        const userRepository = new UserRepository();
        const transaction = connector.transact();

        try {
            const strict = false; // handle non-existing objects gracefully
            await schemaRepository.dropSchema(transaction, schema.getName(), strict);
            await userRepository.dropUser(transaction, schema.getAdmin().getUsername(), strict);
            await userRepository.dropUser(transaction, schema.getUser().getUsername(), strict);
            await transaction.commit();
        } catch (error) {
            await this.handleRollback(transaction);
            throw this.convertError(error);
        }
    }

    private convertError(error: any): HttpError {
        // console.log(error);
        return error instanceof HttpError
            ? error
            : new HttpError(500, error.message)
        ;
    }

    /**
     * Replace placeholders in the query with given params and execute the query.
     * Query placeholders start with $1 to be more consistent with postgres library.
     */
    private async executeUpdate(transaction: PersistenceTransaction, prepared: string, params: string[]): Promise<void> {
        const replacer = (query: string, value: string, index: number) => {
            const searchString = `\\$${ index + 1 }`; // \$1, \$2, \$3, etc.
            return query.replace(new RegExp(searchString, 'g'), value);
        };
        const query = params.reduce(replacer, prepared);
        await transaction.continue(query);
    }

    private async handleRollback(transaction: PersistenceTransaction): Promise<void> {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            // ignore errors that happen during rollback (usually these happen because transaction already closed)
            console.warn(rollbackError);
        }
    }

    // TODO: get configuration from factory or somewhere else
    private getRemainingConnection(nodeName: string): Omit<IPersistenceConfig, 'database' | 'user' | 'password'> {
        return {
            host: process.env.DATABASE_HOST, // TODO: use node name to determine the url
            port: parseInt(process.env?.DATABASE_PORT || '5432'),
            ssl: false,
            max: 1,                         // new pool used for each request (should change to not use pools here)
            idleTimeoutMillis: 1000,        // close idle clients after 1 second
            connectionTimeoutMillis: 1000,  // return an error after 1 second if connection could not be established
        };
    }

}