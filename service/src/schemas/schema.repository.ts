import { PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { Credentials } from '../credentials/credentials';
import { Schema } from './schema';

export class SchemaRepository {

    public async listSchemas(
        connector: PersistenceConnector,
        strict = true,
    ): Promise<string[]> {

        try {
            const query = `SELECT
                n.nspname AS "schema_name"
                FROM pg_catalog.pg_namespace n
                WHERE n.nspname !~ '^pg_'
                AND n.nspname <> 'information_schema'
                AND n.nspname <> 'public';
            `.replace(/\n/ug, ' ');
            const results = await connector.select<{ schema_name: string }>(query, []);
            return results.map(res => res.schema_name);
        } catch (error) {
            if (strict) throw error;
            return [];
        }
    }

    public async getSchema(
        transaction: PersistenceTransaction,
        schemaName: string,
    ): Promise<Schema> {

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
        
        // // TODO: log in debug mode?
        // console.log(response.results);

        if (response.results.length < 1) {
            throw new HttpError(404, 'Schema not found');
        } else if (response.results.length > 1) {
            throw new Error('Multiple schemas found');
        }

        const schema = response.results[0];

        // extract list of users with permissions for this schema
        const user_permissions = schema.schema_acl.replace(/[{}]/ug, '').split(',');

        // TODO: log in debug mode
        // console.log(user_permissions);

        // search for users with UPDATE (U) permissions
        const regex = /^(?<username>.*)=U\/.*$/u;
        const users = user_permissions.filter(perm => regex.test(perm));

        if (users.length > 1) {
            throw new Error('Unexpected error occurred when reading database users: multiple schema users exist');
        }

        // extract the name of the user
        const username = users[0]?.match(regex)?.groups?.username || '';

        return new Schema(
            schema.schema_name,
            new Credentials(schema.owner_username, ''),
            new Credentials(username, ''),
        );
    }

    public async createSchema(
        transaction: PersistenceTransaction,
        name: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(name, 'name');
            await this.ensureSchemaDoesNotExist(transaction, name);
            const query = 'CREATE SCHEMA $name'.replace('$name', name);
            await transaction.continue(query);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async dropSchema(
        transaction: PersistenceTransaction,
        name: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(name, 'name');
            await this.ensureSchemaExists(transaction, name);
            const query = 'DROP SCHEMA $name'.replace('$name', name);
            await transaction.continue(query);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async schemaExists(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<boolean> {
        const query = 'SELECT FROM pg_namespace WHERE nspname = $1;';
        const res = await transaction.continue(query, [ name ]);
        return res.results.length > 0;
    }

    public async ensureSchemaExists(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        const exists = await this.schemaExists(transaction, name);
        if (!exists) {
            throw new HttpError(409, `Schema with name '${ name }' not found`);
        }
    }

    public async ensureSchemaDoesNotExist(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        const exists = await this.schemaExists(transaction, name);
        if (exists) {
            throw new HttpError(409, `Schema with name '${ name }' already exists`);
        }
    }

    private ensureValidSymbol(input: string, symbol = 'symbol'): void {
        const regex = /^[a-z|_]+$/u;        
        if (!regex.test(input)) {
            throw new HttpError(400, `Invalid ${ symbol } '${ input }' provided, only snake_case is allowed.`);
        }
    }

}