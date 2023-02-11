import { PersistenceConnector, PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { RequestContext } from '../api/request-context.interface';
import { Credentials } from '../credentials/credentials';
import { LogFactory, LogService } from '../logs/log.module';
import { Schema } from './schema';

export class SchemaRepository {

    private logger: LogService;

    constructor() {
        this.logger = LogFactory.makeService();
    }

    public async listSchemas(context: RequestContext, connector: PersistenceConnector): Promise<string[]> {

        try {
            const query = `SELECT
                n.nspname AS "schema_name"
                FROM pg_catalog.pg_namespace n
                WHERE n.nspname !~ '^pg_'
                AND n.nspname <> 'information_schema'
                AND n.nspname <> 'public';
            `.replace(/\n/ug, ' ');

            const results = await connector.select<{ schema_name: string }>(query);
            this.logger.trace(`Found ${ results.length } schemas`, context.tracer);
            return results.map(res => res.schema_name);
        } catch (error) {
            this.logger.error(`Error listing schemas`, context.tracer, error);
            throw error;
        }
    }

    public async getSchema(
        context: RequestContext, 
        transaction: PersistenceTransaction,
        schemaName: string,
    ): Promise<Schema> {

        try {
            this.ensureValidSymbol(schemaName, 'schema');
            const query = `SELECT
                n.nspowner AS "owner_id",
                u.usename AS "owner_username",
                n.nspname AS "schema_name",
                n.nspacl AS "schema_acl"
                FROM pg_catalog.pg_namespace n
                LEFT JOIN pg_user u ON n.nspowner = u.usesysid
                WHERE n.nspname !~ '^pg_'
                AND n.nspname <> 'information_schema'
                AND n.nspname <> 'public'
                AND n.nspname = '${ schemaName }';
            `;

            const response = await transaction.continue<{
                owner_id: string,
                owner_username: string,
                schema_name: string,
                schema_acl: string,
            }>(query);
            
            this.logger.debug(`Found schema`, context.tracer, response.results);

            if (response.results.length < 1) {
                throw new HttpError(404, 'Schema not found');
            } else if (response.results.length > 1) {
                throw new HttpError(500, 'Multiple schemas found');
            }

            const schema = response.results[0];

            // extract list of users with permissions for this schema
            const userPermissions = schema.schema_acl.replace(/[{}]/ug, '').split(',');
            this.logger.debug(`Extracted user permissions`, context.tracer, userPermissions);

            // search for users with UPDATE (U) permissions
            const regex = /^(?<username>.*)=U\/.*$/u;
            const users = userPermissions.filter(perm => regex.test(perm));

            if (users.length > 1) {
                throw new Error('Unexpected error occurred when reading database users: multiple schema users exist');
            }

            // extract the name of the user
            const username = users[0]?.match(regex)?.groups?.username || '';
            this.logger.debug(`Extracted schema username: ${ username }`, context.tracer);

            return new Schema(
                schema.schema_name,
                new Credentials(schema.owner_username, ''),
                new Credentials(username, ''),
            );
        } catch (error) { 
            this.logger.error(`Error getting schema '${ schemaName }'`, context.tracer, error);
            throw error;
        }
    }

    public async createSchema(
        context: RequestContext, 
        transaction: PersistenceTransaction,
        name: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(name, 'name');
            await this.ensureSchemaDoesNotExist(context, transaction, name);
            const query = 'CREATE SCHEMA $name'.replace('$name', name);
            await transaction.continue(query);
            this.logger.trace(`Schema created`, context.tracer);
        } catch (error) {
            this.logger.error(`Error creating schema '${ name }'`, context.tracer, error);
            if (strict) throw error;
        }
    }

    public async dropSchema(
        context: RequestContext,
        transaction: PersistenceTransaction,
        name: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(name, 'name');
            await this.ensureSchemaExists(context, transaction, name);
            const query = 'DROP SCHEMA $name'.replace('$name', name);
            await transaction.continue(query);
            this.logger.trace(`Dropped schema '${ name }'`, context.tracer);
        } catch (error) {
            this.logger.trace(`Error dropping schema '${ name }'`, context.tracer, error);
            if (strict) throw error;
        }
    }

    public async ensureSchemaExists(
        context: RequestContext,
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        const exists = await this.schemaExists(transaction, name);
        if (!exists) {
            throw new HttpError(409, `Schema with name '${ name }' not found`);
        }
        this.logger.debug(`Schema ${ name } exists`, context.tracer);
    }

    public async ensureSchemaDoesNotExist(
        context: RequestContext,
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        const exists = await this.schemaExists(transaction, name);
        if (exists) {
            throw new HttpError(409, `Schema with name '${ name }' already exists`);
        }
        this.logger.debug(`Schema ${ name } does not exist`, context.tracer);
    }

    private async schemaExists(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<boolean> {
        const query = 'SELECT FROM pg_namespace WHERE nspname = $1;';
        const res = await transaction.continue(query, [ name ]);
        return res.results.length > 0;
    }

    private ensureValidSymbol(input: string, symbol = 'symbol'): void {
        const regex = /^[a-z|_]+$/u;        
        if (!regex.test(input)) {
            throw new HttpError(400, `Invalid ${ symbol } '${ input }' provided, only snake_case is allowed.`);
        }
    }

}