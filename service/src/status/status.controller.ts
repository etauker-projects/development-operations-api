/* eslint-disable require-await */
import * as express from 'express';
import { ApiController, IResponse } from '../api/api.module';
import { Extractor } from '../environment/extractor';
import { LogService } from '../logs/log.service';


export class StatusController extends ApiController {

    private static instance: StatusController;
    private router: express.Router;
    private stopped: boolean;


    // ===========================================
    //               CONSTRUCTOR
    // ===========================================
    constructor(logger: LogService) {
        super(logger);
        // eslint-disable-next-line new-cap
        this.router = express.Router();
        this.stopped = false;
    }

    // ===========================================
    //               STATIC FUNCTIONS
    // ===========================================
    public static getInstance(logger: LogService): StatusController {
        if (!StatusController.instance) {
            StatusController.instance = new StatusController(logger);
        }
        return StatusController.instance;
    }


    // ===========================================
    //               PUBLIC FUNCTIONS
    // ===========================================
    public getRouter(prefix: string): express.Router {
        this.registerEndpoints(this.router, [
            { method: 'get', endpoint: prefix + '/status', handler: this.getStatus },
        ]);
        return this.router;
    }

    public stop(): Promise<boolean> {
        this.stopped = true;
        return Promise.resolve(this.stopped);
    }

    public async getStatus(endpoint: string, req: express.Request, res: express.Response): Promise<IResponse<any>> {
        return { status: 200, body: {
            status: this.stopped ? 'stopped' : 'running',
            mode: Extractor.extractString('MODE', 'unknown').toLowerCase(),
            time: new Date().toISOString(),
        }};
    }
}
