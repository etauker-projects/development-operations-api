import { PersistenceConnector, PersistenceTransaction, PoolFactory } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { RequestContext } from '../api/request-context.interface';
import { Credentials } from '../credentials/credentials.module';
import { LogFactory, LogService } from '../logs/log.module';
import { PersistenceFactory } from '../persistence/persistence.factory';
import { UserRepository } from '../users/user.module';
import { Schema, SchemaRepository } from './schema.module';

export class SchemaService {

    private logger: LogService;

    constructor() {
        this.logger = LogFactory.makeService();
    }

    async initialiseSchema(
        context: RequestContext,
        nodeName: string,
        databaseName: string,
        adminCredentials: Credentials,
        schema: Schema,
    ): Promise<Schema> {

        const config = PersistenceFactory.makeConfig(
            databaseName,
            adminCredentials.getUsername(),
            adminCredentials.getPassword(),
        );
        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const schemaRepository = new SchemaRepository();
        const userRepository = new UserRepository();
        this.logger.trace(`Services instantiated`, context.tracer);

        // Part 1: schema and user creation
        const transaction1 = connector.transact();
        try {
            await schemaRepository.createSchema(context, transaction1, schema.getName());
            await userRepository.createUser(context, transaction1,
                schema.getAdmin().getUsername(),
                schema.getAdmin().getPassword()
            );
            await userRepository.createUser(context, transaction1,
                schema.getUser().getUsername(),
                schema.getUser().getPassword()
            );
            await transaction1.commit();
            this.logger.trace(`Committed schema and user creation`, context.tracer);
        } catch (error) {
            await this.handleRollback(context, transaction1);
            throw this.convertError(error);
        }

        // Part 2: permission grants and schema alterations
        const transaction2 = connector.transact();
        try {

            // ADMIN
            await userRepository.updateUserSearchPath(
                context,
                transaction2,
                schema.getName(),
                schema.getAdmin().getUsername(),
            );
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL TABLES IN SCHEMA $1 TO $2', [ schema.getName(), schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT $1 TO $2', [ schema.getAdmin().getUsername(), adminCredentials.getUsername() ]);
            await this.executeUpdate(transaction2, 'ALTER SCHEMA $1 OWNER TO $2', [ schema.getName(), schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT CREATE, USAGE ON SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL TABLES IN SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO $1', [ schema.getAdmin().getUsername() ]);
            this.logger.trace(`Granted schema permissions for admin ${ schema.getAdmin().getUsername() }`, context.tracer);

            // USER
            await userRepository.updateUserSearchPath(
                context,
                transaction2,
                schema.getName(),
                schema.getUser().getUsername()
            );
            await this.executeUpdate(transaction2, 'GRANT USAGE ON SCHEMA $1 TO $2', [ schema.getName(), schema.getUser().getUsername() ]);
            await this.executeUpdate(transaction2, 'GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA $1 TO $2', [ schema.getName(), schema.getUser().getUsername() ]);
            this.logger.trace(`Granted schema permissions for user ${ schema.getUser().getUsername() }`, context.tracer);

            await transaction2.commit();
            this.logger.trace(`Committed user search path and permission update`, context.tracer);
            return schema;
        } catch (error) {
            this.logger.error(`Error updating user search paths and permissions`, context.tracer, error);
            await this.removeSchema(context, nodeName, databaseName, adminCredentials, schema.getName());
            await this.handleRollback(context, transaction2);
            throw this.convertError(error);
        }
    }

    async listSchemas(
        context: RequestContext,
        nodeName: string,
        databaseName: string,
        adminCredentials: Credentials,
    ): Promise<string[]> {

        const config = PersistenceFactory.makeConfig(
            databaseName,
            adminCredentials.getUsername(),
            adminCredentials.getPassword(),
        );
        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const schemaRepository = new SchemaRepository();
        this.logger.trace(`Services instantiated`, context.tracer);

        try {
            return await schemaRepository.listSchemas(context, connector);
        } catch (error) {
            throw this.convertError(error);
        }
    }

    async getSchema(
        context: RequestContext,
        nodeName: string,
        databaseName: string,
        schemaName: string,
        adminCredentials: Credentials,
    ): Promise<Schema> {

        const config = PersistenceFactory.makeConfig(
            databaseName,
            adminCredentials.getUsername(),
            adminCredentials.getPassword(),
        );
        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const schemaRepository = new SchemaRepository();
        this.logger.trace(`Services instantiated`, context.tracer);

        try {
            return await schemaRepository.getSchema(context, connector, schemaName);
        } catch (error) {
            throw this.convertError(error);
        }
    }

    async removeSchema(
        context: RequestContext,
        nodeName: string,
        databaseName: string,
        adminCredentials: Credentials,
        schemaName: string,
    ): Promise<void> {

        const config = PersistenceFactory.makeConfig(
            databaseName,
            adminCredentials.getUsername(),
            adminCredentials.getPassword(),
        );
        const connectionPool = new PoolFactory().makePool(config);
        const connector = new PersistenceConnector(connectionPool);
        const schemaRepository = new SchemaRepository();
        const userRepository = new UserRepository();
        const transaction = connector.transact();
        this.logger.trace(`Services instantiated`, context.tracer);

        try {
            const strict = false; // false: handle non-existing objects gracefully
            const dropUser = username => userRepository.dropUser(
                context, transaction, username, adminCredentials.getUsername(), strict
            );

            const users = await userRepository.selectUsersBySchema(context, transaction, schemaName, strict);
            if (users.length > 2) {
                throw new Error('Too many users found for schema, deletion aborted');
            }
            this.logger.trace(`Found ${ users.length } user(s) for schema '${ schemaName }'`, context.tracer);

            await schemaRepository.dropSchema(context, transaction, schemaName, strict);
            const promises = users.map(user => dropUser(user.username));
            await Promise.all(promises);
            await transaction.commit();
        } catch (error) {
            await this.handleRollback(context, transaction);
            throw this.convertError(error);
        }
    }

    private convertError(error: any): HttpError {
        return error instanceof HttpError
            ? error
            : new HttpError(500, error.message)
        ;
    }

    /**
     * Replace placeholders in the query with given params and execute the query.
     * Query placeholders start with $1 to be more consistent with postgres library.
     */
    private async executeUpdate(
        transaction: PersistenceTransaction,
        prepared: string,
        params: string[],
    ): Promise<void> {
        const replacer = (query: string, value: string, index: number) => {
            const searchString = `\\$${ index + 1 }`; // \$1, \$2, \$3, etc.
            return query.replace(new RegExp(searchString, 'gu'), value);
        };
        const query = params.reduce(replacer, prepared);
        await transaction.continue(query);
    }

    private async handleRollback(context: RequestContext, transaction: PersistenceTransaction): Promise<void> {
        try {
            await transaction.rollback();
            this.logger.debug(`Rollback successful`, context.tracer);
        } catch (rollbackError) {
            // ignore errors that happen during rollback (usually these happen because transaction already closed)
            this.logger.warn(`Error rolling back transaction`, context.tracer, rollbackError);
        }
    }
}