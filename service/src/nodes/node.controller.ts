/* eslint-disable require-await */
import * as bodyParser from 'body-parser';
import express from 'express';
import { ApiController } from '../api/api.module';
import { LogFactory } from '../logs/log.factory';


export class NodeController extends ApiController {

    private static instance?: NodeController;
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
    public static getInstance(): NodeController {
        if (!NodeController.instance) {
            NodeController.instance = new NodeController();
        }
        return NodeController.instance;
    }

    public static resetInstance(): void {
        NodeController.instance = undefined;
    }


    // ===========================================
    //               PUBLIC FUNCTIONS
    // ===========================================
    public getRouter(prefix: string) {
        this.router.use((bodyParser as any).default.json());         // to support JSON-encoded bodies
        this.router.use((bodyParser as any).default.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        //  Endpoint registrations
        this.registerEndpoints(this.router, []);
        return this.router;
    }
}
