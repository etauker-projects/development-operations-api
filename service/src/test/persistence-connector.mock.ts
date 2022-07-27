import sinon, { SinonStub } from 'sinon';
import {
    IPersistenceResult,
    PersistenceConnector,
    PersistenceTransaction,
    PersistenceTransactionMock
} from '@etauker/connector-postgres';

// TODO: move to connector-postgres
export class PersistenceConnectorMock {

    static getInstance(): PersistenceConnectorMock {
        return new PersistenceConnectorMock();
    }

    public transaction: PersistenceTransactionMock;
    public results: any[];
    public queries: string[];

    public select: SinonStub;
    public insert: SinonStub;
    public update: SinonStub;
    public delete: SinonStub;

    constructor() {
        // TODO: change to return PersistenceTransactionMock
        // TODO: implement .realistic() method
        this.transaction = PersistenceTransactionMock
            .getInstance() as any as PersistenceTransactionMock;
        this.results = [];
        this.queries = [];
        this.select = sinon.stub().resolves([]);
        this.insert = sinon.stub().resolves(0);
        this.update = sinon.stub().resolves(0);
        this.delete = sinon.stub().resolves(0);
    }

    // ------------------------------
    // Public methods
    // ------------------------------
    /**
     * Returns the mock as PersistenceConnector to make 
     * the stubbed properties appear real.
     */
    public realistic(): PersistenceConnector {
        return this as any as PersistenceConnector;
    }

    /**
     * Mock implementation of PersistenceConnector.transact method
     * returning a mock of PersistenceTransaction. The continue
     * method of this mock resolves to data provided to `continueWith` and
     * `continueWithFull` methods.
     */
    public transact(): PersistenceTransaction {
        this.transaction.continue.callsFake(this.getNextResult.bind(this));
        return this.transaction as any as PersistenceTransaction;
    }

    // TODO: consider moving to PersistenceTransactionMock
    public continueWith<T>(data: T[]): PersistenceConnectorMock {
        return this.continueWithFull<T>(0, 0, 0, data);
    }

    public continueWithFull<T>(
        inserted = 0,
        updated = 0,
        deleted = 0, 
        results: T[] = [],
    ): PersistenceConnectorMock {
        const result: IPersistenceResult<T> = {
            inserted,
            updated,
            deleted,
            results,
        };
        this.results.push(result);
        return this;
    }

    public reset(): void {

        // TODO implement: this.transaction.reset();
        this.transaction.ready.reset();
        this.transaction.continue.reset();
        this.transaction.end.reset();
        this.transaction.commit.reset();
        this.transaction.rollback.reset();

        this.insert.reset();
        this.select.reset();
        this.update.reset();
        this.delete.reset();
    }

    private getNextResult(query, params): void {
        this.queries.push(query);
        const result = this.results.shift();
        if (!result) {
            let message = `PersistenceTransactionMock is depleted. Called ${ this.queries.length } times with the following queries:\n`;
            message += this.queries.map(sql => `\n--- ${ sql } ---\n`);
            throw Error(message);

        }
        return result;
    } 
}
