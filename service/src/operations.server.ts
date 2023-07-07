import express, { Request, Response, NextFunction } from 'express';
import { Server as HttpServer } from 'http';
import { LogService, LogFactory } from './logs/log.module';
import { NodeController } from './nodes/node.module';
import { DatabaseController } from './databases/database.controller';
import { SchemaController } from './schemas/schema.module';
import { StatusController } from './status/status.controller';


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
        DatabaseController.resetInstance();
        SchemaController.resetInstance();
        return this;
    }

    public getPort(): number {
        return this.port;
    }

    public getApiRoot(): string {
        return this.apiRoot;
    }

    private bootstrap(): OperationsServer {
        this.app.use(StatusController.getInstance(this.logger).getRouter(this.apiRoot));
        this.app.use(NodeController.getInstance().getRouter(this.apiRoot + '/v1'));
        this.app.use(DatabaseController.getInstance().getRouter(this.apiRoot + '/v1/nodes/:nodeId'));
        this.app.use(SchemaController.getInstance().getRouter(this.apiRoot + '/v1/nodes/:nodeId/databases/:databaseId'));
        return this;
    }
}