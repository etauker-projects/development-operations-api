import { PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';
import { RequestContext } from '../api/request-context.interface';
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
        context: RequestContext,
        transaction: PersistenceTransaction,
        schema: string,
        strict = true,
    ): Promise<User[]> {
        try {
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
    
            this.logger.trace(`Found ${ res.results.length } users for schema '${ schema }'`, context.tracer);
            return res.results;
        } catch (error) {
            this.logger.error(`Error selecting users for schema '${ schema }'`, context.tracer, error);
            throw error;
        }
    }

    public async createUser(
        context: RequestContext,
        transaction: PersistenceTransaction,
        username: string,
        password: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(username, 'username');
            this.ensureValidSecret(password, 'password');
            await this.ensureUserDoesNotExist(context, transaction, username);
            const query = 'CREATE USER $username WITH PASSWORD \'$password\''
                .replace('$username', username)
                .replace('$password', password)
            ;
            await transaction.continue(query);
            this.logger.trace(`User ${ username } created`, context.tracer);
        } catch (error) {
            this.logger.error(`Error creating user ${ username }`, context.tracer, error);
            if (strict) throw error;
        }
    }

    public async dropUser(
        context: RequestContext,
        transaction: PersistenceTransaction,
        username: string,
        admin: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(username, 'username');
            await this.ensureUserExists(context, transaction, username);
            await this.grantRoleToUser(context, transaction, username, admin, strict);
            await this.reassignOwned(context, transaction, username, admin, strict);
            await this.dropRole(context, transaction, username);
            this.logger.trace(`Dropped user '${ username }'`, context.tracer);
        } catch (error) {
            this.logger.error(`Error dropping user '${ username }'`, context.tracer, error);
            if (strict) throw error;
        }
    }

    public async grantRoleToUser(
        context: RequestContext,
        transaction: PersistenceTransaction,
        role: string,
        username: string,
        strict: boolean,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(role, 'role');
            await this.ensureUserExists(context, transaction, username);

            const query = 'GRANT $role TO $user'
                .replace('$role', role)
                .replace('$user', username)
            ;

            await transaction.continue(query);
            this.logger.trace(`Granted role '${ role }' to '${ username }'`, context.tracer);
        } catch (error) {
            this.logger.error(`Error granting role '${ role }' to '${ username }'`, context.tracer, error);
            if (strict) throw error;
        }
    }

    /**
     * Re-assign ownership of all objects to another user.
     */
    public async reassignOwned(
        context: RequestContext,
        transaction: PersistenceTransaction,
        from: string,
        to: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(from, 'username');
            await this.ensureUserExists(context, transaction, from);
            await this.ensureUserExists(context, transaction, to);

            const query = 'REASSIGN OWNED BY $from TO $to'
                .replace('$from', from)
                .replace('$to', to)
            ;

            await transaction.continue(query);
            this.logger.trace(`Re-assigned object ownership from '${ from }' to '${ to }'`, context.tracer);
        } catch (error) {
            this.logger.error(`Error re-assigning object ownership from '${ from }' to '${ to }'`, context.tracer, error);
            if (strict) throw error;
        }
    }

    public async dropRole(
        context: RequestContext,
        transaction: PersistenceTransaction,
        role: string,
        strict = true,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(role, 'role');
            await this.ensureUserExists(context, transaction, role);
            const query = 'DROP ROLE $role'.replace('$role', role);
            await transaction.continue(query);
            this.logger.trace(`Dropped '${ role }'`, context.tracer);
        } catch (error) {
            this.logger.error(`Error dropping role '${ role }'`, context.tracer, error);
            if (strict) throw error;
        }
    }

    public async updateUserSearchPath(
        context: RequestContext,
        transaction: PersistenceTransaction,
        schema: string,
        username: string,
    ): Promise<void> {
        try {
            this.ensureValidSymbol(schema, 'schema');
            this.ensureValidSymbol(username, 'username');
    
            await this.ensureUserExists(context, transaction, username);
            await new SchemaRepository().ensureSchemaExists(context, transaction, schema);
            
            const query = 'ALTER ROLE $username SET search_path TO $schema'
                .replace('$username', username)
                .replace('$schema', schema)
            ;
            await transaction.continue(query);
            this.logger.trace(`Updated search path for user '${ username }' to '${ schema }'`, context.tracer);
        } catch (error) {
            this.logger.error(`Error updating search path for user '${ username }' to '${ schema }'`, context.tracer, error);
            throw error;
        }
    }

    public async ensureUserExists(
        context: RequestContext,
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        this.ensureValidSymbol(name, 'name');
        const exists = await this.userExists(transaction, name);
        if (!exists) {
            throw new HttpError(404, `User with name '${ name }' not found`);
        }
        this.logger.debug(`User ${ name } exists`, context.tracer);
    }

    public async ensureUserDoesNotExist(
        context: RequestContext,
        transaction: PersistenceTransaction,
        name: string,
    ): Promise<void> {
        this.ensureValidSymbol(name, 'name');
        const exists = await this.userExists(transaction, name);
        if (exists) {
            throw new HttpError(409, `User with name '${ name }' already exists`);
        }
        this.logger.debug(`User ${ name } does not exist`, context.tracer);
    }

    private async userExists(transaction: PersistenceTransaction, name: string): Promise<boolean> {
        this.ensureValidSymbol(name, 'name');
        const query = 'SELECT FROM pg_catalog.pg_roles WHERE rolname = $1;';
        const res = await transaction.continue(query, [ name ]);
        return res.results.length > 0;
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