/* eslint-disable require-await */
import * as bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import { ApiController, IResponse } from '../api/api.module';
import { LogFactory } from '../logs/log.factory';


export class DatabaseController extends ApiController {

    private static instance?: DatabaseController;
    private router: express.Router;


    // ===========================================
    //               CONSTRUCTOR
    // ===========================================
    constructor() {
        super(LogFactory.makeService());
        // eslint-disable-next-line new-cap
        this.router = express.Router();
    }

    // ===========================================
    //               STATIC FUNCTIONS
    // ===========================================
    public static getInstance(): DatabaseController {
        if (!DatabaseController.instance) {
            DatabaseController.instance = new DatabaseController();
        }
        return DatabaseController.instance;
    }

    public static resetInstance(): void {
        DatabaseController.instance = undefined;
    }


    // ===========================================
    //               PUBLIC FUNCTIONS
    // ===========================================
    public getRouter(prefix: string) {
        this.router.use((bodyParser as any).default.json());         // to support JSON-encoded bodies
        this.router.use((bodyParser as any).default.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        this.registerEndpoints(this.router, [
            { method: 'get', endpoint: `${ prefix }/databases`, handler: this.getDatabases },
        ]);
        return this.router;
    }

    public async getDatabases(endpoint: string, req: Request, res: Response): Promise<IResponse<string[]>> {
        // TODO: check credentials
        // return { status: 200, body: [ 'local_01' ]};
        return { status: 501, body: []};
    }
}
