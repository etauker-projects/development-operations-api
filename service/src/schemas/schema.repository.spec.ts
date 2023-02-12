import 'mocha';
import assert, { AssertionError } from 'assert';
import { PersistenceTransactionMock } from '@etauker/connector-postgres';
import { SchemaRepository } from './schema.repository';
import { RequestContext } from '../api/request-context.interface';
import { randomUUID } from 'crypto';

describe('SchemaRepository', () => {

    const context: RequestContext = { tracer: randomUUID() };
    let transaction: PersistenceTransactionMock;

    beforeEach(() => {
        transaction = new PersistenceTransactionMock();
    });

    afterEach(() => {
        transaction = undefined as any;
    });

    describe('createSchema', () => {
        it('strict = false, special character in name => 400', async () => {
            const repository = new SchemaRepository();
            const name = 'snake_case;';
            const strict = true;

            try {
                await repository.createSchema(context, transaction as any, name, strict);
                assert(false, 'expected method to throw exception but none was thrown');
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                assert.equal(error?.code, 400, 'incorrect error code');
                const expectedMessage = `Invalid name '${ name }' provided, only snake_case is allowed.`;
                assert.equal(error.message, expectedMessage, 'incorrect error message');
            }
        });
        it('strict = false, uppercase character in name => 400', async () => {
            const repository = new SchemaRepository();
            const name = 'Snake_case;';
            const strict = true;

            try {
                await repository.createSchema(context, transaction as any, name, strict);
                assert(false, 'expected method to throw exception but none was thrown');
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                assert.equal(error?.code, 400, 'incorrect error code');
                const expectedMessage = `Invalid name '${ name }' provided, only snake_case is allowed.`;
                assert.equal(error.message, expectedMessage, 'incorrect error message');
            }
        });
        it('strict = false, space in name => 400', async () => {
            const repository = new SchemaRepository();
            const name = 'snake case;';
            const strict = true;

            try {
                await repository.createSchema(context, transaction as any, name, strict);
                assert(false, 'expected method to throw exception but none was thrown');
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                assert.equal(error?.code, 400, 'incorrect error code');
                const expectedMessage = `Invalid name '${ name }' provided, only snake_case is allowed.`;
                assert.equal(error.message, expectedMessage, 'incorrect error message');
            }
        });
    });

    describe('dropSchema', () => {
        it('strict = false, special character in name => 400', async () => {
            const repository = new SchemaRepository();
            const name = 'snake_case;';
            const strict = true;

            try {
                await repository.dropSchema(context, transaction as any, name, strict);
                assert(false, 'expected method to throw exception but none was thrown');
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                assert.equal(error?.code, 400, 'incorrect error code');
                const expectedMessage = `Invalid name '${ name }' provided, only snake_case is allowed.`;
                assert.equal(error.message, expectedMessage, 'incorrect error message');
            }
        });
        it('strict = false, uppercase character in name => 400', async () => {
            const repository = new SchemaRepository();
            const name = 'Snake_case;';
            const strict = true;

            try {
                await repository.dropSchema(context, transaction as any, name, strict);
                assert(false, 'expected method to throw exception but none was thrown');
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                assert.equal(error?.code, 400, 'incorrect error code');
                const expectedMessage = `Invalid name '${ name }' provided, only snake_case is allowed.`;
                assert.equal(error.message, expectedMessage, 'incorrect error message');
            }
        });
        it('strict = false, space in name => 400', async () => {
            const repository = new SchemaRepository();
            const name = 'snake case;';
            const strict = true;

            try {
                await repository.dropSchema(context, transaction as any, name, strict);
                assert(false, 'expected method to throw exception but none was thrown');
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                assert.equal(error?.code, 400, 'incorrect error code');
                const expectedMessage = `Invalid name '${ name }' provided, only snake_case is allowed.`;
                assert.equal(error.message, expectedMessage, 'incorrect error message');
            }
        });
    });

});
