// import { IPersistenceConfig, IPool, PersistenceConnector, PoolFactory } from '@etauker/connector-postgres';
import express from 'express';
import { Server as HttpServer } from 'http';
import { NodeController } from './nodes/node.module';
// import { SessionController } from './sessions/session.controller';
// import { UserController } from './users/user.controller';

// TODO: cleanup
export class OperationsServer {

    // // setup
    // private _connector: PersistenceConnector;

    private apiRoot: string;
    private port: number;
    private logsEnabled: boolean;
    private app: express.Application;
    private server: HttpServer;

    constructor(
        port = 9999,
        apiRoot = '/development/operations/api',
    ) {
        this.logsEnabled = true; // TODO: replace with logger
        this.app = express();
        this.apiRoot = apiRoot;
        this.port = port;
    }

    // public connector(connector: PersistenceConnector): OperationsServer {
    //     if (!connector) {
    //         const config: IPersistenceConfig = {
    //             database: process.env.DATABASE_DATABASE,
    //             user: process.env.DATABASE_USER,
    //             password: process.env.DATABASE_PASSWORD,
    //             host: process.env.DATABASE_HOST,
    //             port: parseInt(process.env?.DATABASE_PORT || '5432'),
    //             ssl: false,
    //             max: 5,
    //             idleTimeoutMillis: 1000, // close idle clients after 1 second
    //             connectionTimeoutMillis: 1000, // return an error after 1 second if connection could not be established
    //         };

    //         const connectionPool: IPool = new PoolFactory().makePool(config);
    //         connector = new PersistenceConnector(connectionPool);
    //     }
    // 
    //     this._connector = connector;
    //     return this;
    // }

    // public register(endpoint: string, router: express.Router): OperationsServer {
    //     this.app.use(this.apiRoot + endpoint, router);
    //     return this;
    // }

    public start(): OperationsServer {
        this.bootstrap();
        this.app.use(function (err, req, res, next) {
            res.status(500).send('Something broke!')
        });

        this.server = this.app.listen(this.port, () => {
            if (this.logsEnabled) {
                console.log(`Server listening on port ${this.port}.`);
            }
        });

        return this;
    }

    public stop(): OperationsServer {
        this.server.close();
        NodeController.resetInstance();
        // UserController.resetInstance();
        // SessionController.resetInstance();
        return this;
    }

    public silent(): OperationsServer {
        this.logsEnabled = false;
        return this;
    }

    public getPort(): number {
        return this.port;
    }

    public getApiRoot(): string {
        return this.apiRoot;
    }

    private bootstrap(): OperationsServer {
        this.app.use(this.apiRoot + '/v1/node',  NodeController.getInstance().getRouter());
        return this;
    }
}