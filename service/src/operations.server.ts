// import { IPersistenceConfig, IPool, PersistenceConnector, PoolFactory } from '@etauker/connector-postgres';
import express, { Request, Response, NextFunction } from 'express';
import { Server as HttpServer } from 'http';
import { LogService, LogFactory } from './logs/log.module';
import { NodeController } from './nodes/node.module';


export class OperationsServer {

    private apiRoot: string;
    private port: number;
    private app: express.Application;
    private server: HttpServer;
    private logger: LogService;

    constructor(
        port = 9999,
        apiRoot = '/development/operations/api',
    ) {
        this.logger = LogFactory.makeService();
        this.app = express();
        this.apiRoot = apiRoot;
        this.port = port;
    }

    public start(): OperationsServer {
        this.bootstrap();
        this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
            res.status(500).send('Unexpected error occurred');
            if (error) this.logger.error(error.message);
        });

        this.server = this.app.listen(this.port, () => {
            this.logger.info(`Server listening on port ${ this.port }.`);
        });

        return this;
    }

    public stop(): OperationsServer {
        this.server.close();
        NodeController.resetInstance();
        return this;
    }

    public getPort(): number {
        return this.port;
    }

    public getApiRoot(): string {
        return this.apiRoot;
    }

    private bootstrap(): OperationsServer {
        this.app.use(this.apiRoot + '/v1/nodes', NodeController.getInstance().getRouter());
        return this;
    }
}