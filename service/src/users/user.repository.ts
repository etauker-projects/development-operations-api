import { PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { SchemaRepository } from '../schemas/schema.module';

export class UserRepository {

    public async createUser(
        transaction: PersistenceTransaction,
        username: string,
        password: string,
        strict = true,
    ): Promise<void> {
        // TODO: sanitize input
        try {
            await this.ensureUserDoesNotExist(transaction, username);
            const query = 'CREATE USER $username WITH PASSWORD \'$password\''
                .replace('$username', username)
                .replace('$password', password)
            ;
            await transaction.continue(query);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async dropUser(
        transaction: PersistenceTransaction,
        username: string,
        strict = true,
    ): Promise<void> {
        // TODO: sanitize input
        try {
            await this.ensureUserExists(transaction, username);
            const query = 'DROP ROLE $username'.replace('$username', username);
            await transaction.continue(query);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async updateUserSearchPath(
        transaction: PersistenceTransaction,
        schema: string,
        username: string,
    ): Promise<void> {
        await this.ensureUserExists(transaction, username);
        await new SchemaRepository().ensureSchemaExists(transaction, schema);
        
        // TODO: sanitize input
        const query = 'ALTER ROLE $username SET search_path TO $schema'
            .replace('$username', username)
            .replace('$schema', schema)
        ;
        await transaction.continue(query);
    }

    public async userExists(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<boolean> {
        const query = 'SELECT FROM pg_catalog.pg_roles WHERE rolname = $1;';
        const res = await transaction.continue(query, [ name ]);
        return res.results.length > 0;
    }

    public async ensureUserExists(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        const exists = await this.userExists(transaction, name);
        if (!exists) {
            throw new HttpError(409, `User with name '${ name }' not found`);
        }
    }

    public async ensureUserDoesNotExist(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        const exists = await this.userExists(transaction, name);
        if (exists) {
            throw new HttpError(409, `User with name '${ name }' already exists`);
        }
    }

}