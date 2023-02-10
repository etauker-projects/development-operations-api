/* eslint-disable require-await */
import * as bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { ApiController, HttpError, IResponse } from '../api/api.module';
import { Schema, SchemaDto, SchemaService } from '../schemas/schema.module';
import { Credentials, CredentialsService } from '../credentials/credentials.module';
import { LogFactory } from '../logs/log.factory';


export class NodeController extends ApiController {

    private static instance?: NodeController;
    private router: express.Router;
    private credentialsService: CredentialsService;
    private schemaService: SchemaService;


    // ===========================================
    //               CONSTRUCTOR
    // ===========================================
    constructor() {
        super(LogFactory.makeService());
        // eslint-disable-next-line new-cap
        this.router = express.Router();
        this.credentialsService = new CredentialsService();
        this.schemaService = new SchemaService();
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
        // this.router.use(cookieParser.default());
        this.router.use((bodyParser as any).default.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        //  Endpoint registrations
        this.registerEndpoints(this.router, [
            // TODO: { method: 'post', endpoint: `${ prefix }/:nodeId/database`, handler: this.postDatabase },
            // TODO: { method: 'delete', endpoint: `${ prefix }/:nodeId/database/:databaseId`, handler: this.deleteDatabase },
            { method: 'get', endpoint: `${ prefix }/:nodeId/databases/:databaseId/schemas`, handler: this.getSchemas },
            { method: 'get', endpoint: `${ prefix }/:nodeId/databases/:databaseId/schemas/:schemaId`, handler: this.getSchema },
            { method: 'post', endpoint: `${ prefix }/:nodeId/databases/:databaseId/schemas`, handler: this.postSchema },
            { method: 'delete', endpoint: `${ prefix }/:nodeId/databases/:databaseId/schemas/:schemaId`, handler: this.deleteSchema },
        ]);
        return this.router;
    }

    public async getSchemas(
        endpoint: string,
        req: Request,
        res: Response
    ): Promise<IResponse<string[]>> {
        const nodeName = req.params.nodeId;
        const databaseName = req.params.databaseId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));
        const list = await this.schemaService.listSchemas(nodeName, databaseName, adminCredentials);
        return { status: 200, body: list };
    }

    public async getSchema(
        endpoint: string,
        req: Request,
        res: Response
    ): Promise<IResponse<SchemaDto>> {
        const nodeName = req.params.nodeId;
        const databaseName = req.params.databaseId;
        const schemaName = req.params.schemaId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));
        const created = await this.schemaService.getSchema(
            nodeName, databaseName, schemaName, adminCredentials
        );

        const dto: SchemaDto = {
            name: created.getName(),
            admin: created.getAdmin().getUsername(),
            user: created.getUser().getUsername(),
        };

        return { status: 200, body: dto };
    }

    public async postSchema(
        endpoint: string,
        req: Request,
        res: Response
    ): Promise<IResponse<SchemaDto>> {

        const dtoSchema = z.object({
            name: z.string().min(5),
            admin: z.string().min(5),
            user: z.string().min(5),
            adminPassword: z.string().min(5),
            userPassword: z.string().min(5),
        }).strict();

        const request = dtoSchema.parse(req.body);
        const nodeName = req.params.nodeId;
        const databaseName = req.params.databaseId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));

        // convert request to an entity
        const schema = new Schema(
            request.name,
            this.credentialsService.decodeCredentials(request.admin, request.adminPassword),
            this.credentialsService.decodeCredentials(request.user, request.userPassword),
        );

        // call the service and return result
        const created = await this.schemaService.initialiseSchema(
            nodeName, databaseName, adminCredentials, schema
        );

        const dto: SchemaDto = {
            name: created.getName(),
            admin: created.getAdmin().getUsername(),
            user: created.getUser().getUsername(),
        };

        return { status: 200, body: dto };
    }


    public async deleteSchema(
        endpoint: string,
        req: Request,
        res: Response
    ): Promise<IResponse<void>> {
        const nodeName = req.params.nodeId;
        const schemaName = req.params.schemaId;
        const databaseName = req.params.databaseId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));
        await this.schemaService.removeSchema(nodeName, databaseName, adminCredentials, schemaName);
        return { status: 204, body: undefined };
    }


    private parseCredentials(authorization?: string): Credentials {
        if (!authorization) {
            throw new HttpError(401, 'Missing authorization');
        }

        const decoded = this.credentialsService.decode(authorization.replace('Basic ', ''));
        const parts = decoded.split(':');
        return new Credentials(parts[0], parts[1]);
    }

}
