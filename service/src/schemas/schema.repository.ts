import { PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/api.module';

export class SchemaRepository {

    constructor() {

    }

    public async createSchema(transaction: PersistenceTransaction, name: string, strict = true): Promise<void> {
        // TODO: sanitize input
        try {
            await this.ensureSchemaDoesNotExist(transaction, name);
            const query = 'CREATE SCHEMA $name'.replace('$name', name);
            await transaction.continue(query);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async dropSchema(transaction: PersistenceTransaction, name: string, strict = true): Promise<void> {
        // TODO: sanitize input
        try {
            await this.ensureSchemaExists(transaction, name);
            const query = 'DROP SCHEMA $name'.replace('$name', name);
            await transaction.continue(query);
        } catch (error) {
            if (strict) throw error;
        }
    }

    public async schemaExists(transaction: PersistenceTransaction, name: string): Promise<boolean> {
        const query = 'SELECT FROM pg_namespace WHERE nspname = $1;';
        const res = await transaction.continue(query, [name]);
        return res.results.length > 0;
    }

    public async ensureSchemaExists(transaction: PersistenceTransaction, name: string): Promise<void> {
        const exists = await this.schemaExists(transaction, name);
        if (!exists) {
            throw new HttpError(409, `Schema with name '${ name }' not found`);
        }
    }

    public async ensureSchemaDoesNotExist(transaction: PersistenceTransaction, name: string): Promise<void> {
        const exists = await this.schemaExists(transaction, name);
        if (exists) {
            throw new HttpError(409, `Schema with name '${ name }' already exists`);
        }
    }

}