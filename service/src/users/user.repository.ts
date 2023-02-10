import { PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { LogFactory } from '../logs/log.factory';
import { LogService } from '../logs/log.service';
import { SchemaRepository } from '../schemas/schema.module';
import { User } from './user.interface';

export class UserRepository {

    private logger: LogService;

    constructor() {
        this.logger = LogFactory.makeService();
    }

    /**
     * Returns users that have provided schema set as their default search path.
     * Also excludes users with extended security permissions.
     */
    public async selectUsersBySchema(
        transaction: PersistenceTransaction,
        schema: string,
        strict = true,
    ): Promise<User[]> {
        this.ensureValidSymbol(schema, 'schema');
        const query = `
            SELECT 
                u.usesysid as id,
                u.usename as username
            FROM pg_user u
            WHERE array_to_string(useconfig, ',') LIKE 'search_path=${ schema }'
            AND u.usecreatedb = false
            AND u.usesuper = false
            AND u.usebypassrls = false
        `;
        const res = await transaction.continue<{
            username: string, 
            id: number,
        }>(query);

        if (strict && res.results.length < 1) {
            throw new HttpError(400, 'No users found');
        }

        return res.results;
    }

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
            await this.grantRoleToUser(transaction, username, admin, strict);
            await this.reassignOwned(transaction, username, admin, strict);
            await this.dropRole(transaction, username);
        } catch (error) {
            this.logger.error(`error dropping user '${ username }'`, '', error);
            if (strict) throw error;
        }
    }

    public async grantRoleToUser(
        transaction: PersistenceTransaction,
        role: string,
        username: string,
        strict: boolean,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(role, 'role');
            await this.ensureUserExists(transaction, username);

            const query = 'GRANT $role TO $user'
                .replace('$role', role)
                .replace('$user', username)
            ;

            await transaction.continue(query);
            this.logger.trace(`'${ role }' role granted to '${ username }'`);
        } catch (error) {
            this.logger.error(`error granting role '${ role }' to '${ username }'`, '', error);
            if (strict) throw error;
        }
    }

    /**
     * Re-assign ownership of all objects to another user.
     */
    public async reassignOwned(
        transaction: PersistenceTransaction,
        from: string,
        to: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(from, 'username');
            await this.ensureUserExists(transaction, from);
            await this.ensureUserExists(transaction, to);

            const query = 'REASSIGN OWNED BY $from TO $to'
                .replace('$from', from)
                .replace('$to', to)
            ;

            await transaction.continue(query);
            this.logger.trace(`re-assigned object ownership from '${ from }' to '${ to }'`);
        } catch (error) {
            this.logger.error(`error re-assigning object ownership from '${ from }' to '${ to }'`, '', error);
            if (strict) throw error;
        }
    }

    public async dropRole(
        transaction: PersistenceTransaction,
        role: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(role, 'role');
            await this.ensureUserExists(transaction, role);
            const query = 'DROP ROLE $role'.replace('$role', role);
            await transaction.continue(query);
            this.logger.trace(`dropped '${ role }'`);
        } catch (error) {
            this.logger.error(`error dropping role '${ role }'`, '', error);
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
        const regex = /^[a-z0-9|_]+$/u;        
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