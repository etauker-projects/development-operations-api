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
        try {
            this.ensureValidSymbol(username, 'username');
            this.ensureValidSecret(password, 'password');
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
        admin: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(username, 'username');
            await this.ensureUserExists(transaction, username);

            // re-assign all objects to admin
            const reassignQuery = 'REASSIGN OWNED BY $user TO $admin'
                .replace('$user', username)
                .replace('$admin', admin)
            ;
            await transaction.continue(reassignQuery);

            // drop role
            const dropQuery = 'DROP ROLE $username'.replace('$username', username);
            await transaction.continue(dropQuery);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async updateUserSearchPath(
        transaction: PersistenceTransaction,
        schema: string,
        username: string,
    ): Promise<void> {
        this.ensureValidSymbol(schema, 'schema');
        this.ensureValidSymbol(username, 'username');

        await this.ensureUserExists(transaction, username);
        await new SchemaRepository().ensureSchemaExists(transaction, schema);
        
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
        this.ensureValidSymbol(name, 'name');
        const query = 'SELECT FROM pg_catalog.pg_roles WHERE rolname = $1;';
        const res = await transaction.continue(query, [ name ]);
        return res.results.length > 0;
    }

    public async ensureUserExists(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        this.ensureValidSymbol(name, 'name');
        const exists = await this.userExists(transaction, name);
        if (!exists) {
            throw new HttpError(409, `User with name '${ name }' not found`);
        }
    }

    public async ensureUserDoesNotExist(
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        this.ensureValidSymbol(name, 'name');
        const exists = await this.userExists(transaction, name);
        if (exists) {
            throw new HttpError(409, `User with name '${ name }' already exists`);
        }
    }

    private ensureValidSymbol(input: string, symbol = 'symbol'): void {
        const regex = /^[a-z|_]+$/u;        
        if (!regex.test(input)) {
            throw new HttpError(400, `Invalid ${ symbol } '${ input }' provided, only snake_case is allowed.`);
        }
    }

    private ensureValidSecret(input: string, symbol = 'symbol'): void {
        if (input.includes(':') || input.includes(';') || input.includes('\\') || input.includes('"') || input.includes('`')) {
            throw new HttpError(400, `Provided ${ symbol } contains invalid character(s).`);
        }
    }

}