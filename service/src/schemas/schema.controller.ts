/* eslint-disable require-await */
import * as bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { RequestContext } from '../api/request-context.interface';
import { ApiController, HttpError, IResponse } from '../api/api.module';
import { Schema, SchemaDto, SchemaService } from './schema.module';
import { Credentials, CredentialsService } from '../credentials/credentials.module';
import { LogFactory } from '../logs/log.factory';


export class SchemaController extends ApiController {

    private static instance?: SchemaController;
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
    public static getInstance(): SchemaController {
        if (!SchemaController.instance) {
            SchemaController.instance = new SchemaController();
        }
        return SchemaController.instance;
    }

    public static resetInstance(): void {
        SchemaController.instance = undefined;
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
            { method: 'get', endpoint: `${ prefix }/schemas`, handler: this.getSchemas },
            { method: 'post', endpoint: `${ prefix }/schemas`, handler: this.postSchema },
            { method: 'get', endpoint: `${ prefix }/schemas/:schemaId`, handler: this.getSchema },
            { method: 'delete', endpoint: `${ prefix }/schemas/:schemaId`, handler: this.deleteSchema },
        ]);
        return this.router;
    }

    public async getSchemas(endpoint: string, req: Request, res: Response): Promise<IResponse<string[]>> {
        // TODO: get from API request headers
        const context: RequestContext = { tracer: randomUUID() };
        this.logger.trace(`Received GET request for '${ endpoint }'`, context.tracer);

        const nodeName = req.params.nodeId;
        const databaseName = req.params.databaseId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));
        this.logger.trace(`Parsed provided input`, context.tracer);

        const list = await this.schemaService.listSchemas(context, nodeName, databaseName, adminCredentials);
        this.logger.trace(`Executed request logic`, context.tracer);

        return { status: 200, body: list };
    }

    public async getSchema(endpoint: string, req: Request, res: Response): Promise<IResponse<SchemaDto>> {
        // TODO: get from API request headers
        const context: RequestContext = { tracer: randomUUID() };
        this.logger.trace(`Received GET request for '${ endpoint }'`, context.tracer);

        const nodeName = req.params.nodeId;
        const databaseName = req.params.databaseId;
        const schemaName = req.params.schemaId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));
        this.logger.trace(`Parsed provided input`, context.tracer);

        const created = await this.schemaService.getSchema(
            context, nodeName, databaseName, schemaName, adminCredentials
        );
        this.logger.trace(`Executed request logic`, context.tracer);

        const dto: SchemaDto = {
            name: created.getName(),
            admin: created.getAdmin().getUsername(),
            user: created.getUser().getUsername(),
        };
        this.logger.trace(`Formatted response object`, context.tracer);

        return { status: 200, body: dto };
    }

    public async postSchema(endpoint: string, req: Request, res: Response): Promise<IResponse<SchemaDto>> {
        // TODO: get from API request headers
        const context: RequestContext = { tracer: randomUUID() };
        this.logger.trace(`Received POST request for '${ endpoint }'`, context.tracer);

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
        const schema = new Schema(
            request.name,
            this.credentialsService.decodeCredentials(request.admin, request.adminPassword),
            this.credentialsService.decodeCredentials(request.user, request.userPassword),
        );
        this.logger.trace(`Parsed provided input`, context.tracer);
        
        const created = await this.schemaService.initialiseSchema(
            context, nodeName, databaseName, adminCredentials, schema
        );
        this.logger.trace(`Executed request logic`, context.tracer);

        const dto: SchemaDto = {
            name: created.getName(),
            admin: created.getAdmin().getUsername(),
            user: created.getUser().getUsername(),
        };
        this.logger.trace(`Formatted response object`, context.tracer);

        return { status: 200, body: dto };
    }


    public async deleteSchema(endpoint: string, req: Request, res: Response): Promise<IResponse<void>> {
        // TODO: get from API request headers
        const context: RequestContext = { tracer: randomUUID() };
        this.logger.trace(`Received DELETE request for '${ endpoint }'`, context.tracer);

        const nodeName = req.params.nodeId;
        const schemaName = req.params.schemaId;
        const databaseName = req.params.databaseId;
        const adminCredentials = this.parseCredentials(req.header('authorization'));
        this.logger.trace(`Parsed provided input`, context.tracer);

        await this.schemaService.removeSchema(context, nodeName, databaseName, adminCredentials, schemaName);
        this.logger.trace(`Formatted response object`, context.tracer);

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
