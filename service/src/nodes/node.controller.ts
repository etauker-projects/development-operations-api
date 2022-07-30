/* eslint-disable require-await */
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { ApiController, IResponse } from '../api/api.module';
import { Schema, SchemaDto, SchemaWithCredentialsDto, SchemaService } from '../schemas/schema.module';
import { Credentials, CredentialsService } from '../credentials/credentials.module';


export class NodeController extends ApiController {

    private static instance?: NodeController;
    private router: express.Router;
    private credentialsService: CredentialsService;
    private schemaService: SchemaService;


    // ===========================================
    //               CONSTRUCTOR
    // ===========================================
    constructor() {
        super();
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
    public getRouter() {
        this.router.use((bodyParser as any).default.json());         // to support JSON-encoded bodies
        // this.router.use(cookieParser.default());
        this.router.use((bodyParser as any).default.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        //  Endpoint registrations
        this.registerEndpoints(this.router, [
            // TODO: { method: 'post', endpoint: '/:nodeId/database', handler: this.postDatabase },
            // TODO: { method: 'delete', endpoint: '/:nodeId/database/:databaseId', handler: this.deleteDatabase },
            { method: 'post', endpoint: '/:nodeId/databases/:databaseId/schemas', handler: this.postSchema },
            { method: 'delete', endpoint: '/:nodeId/databases/:databaseId/schemas/:schemaId', handler: this.deleteSchema },
        ]);
        return this.router;
    }

    public async postSchema(
        endpoint: string,
        req: express.Request,
        res: express.Response,
    ): Promise<IResponse<SchemaDto>> {

        // TODO: extract requestDto
        const nodeName = 'node-name';
        const databaseName = 'database-name';
        const schemaName = 'schema-name';
        const adminCredentials = new Credentials('db_admin', 'db_admin_password'); // from header

        const request: SchemaWithCredentialsDto = {
            name: schemaName,
            adminCredentials: `${schemaName}_admin_username:${schemaName}_admin_password)`,
            userCredentials: `${schemaName}_user_username:${schemaName}_user_password)`,
        }

        // convert request to an entity
        const schema = new Schema(
            request.name,
            this.credentialsService.decryptCredentials(request.adminCredentials),
            this.credentialsService.decryptCredentials(request.userCredentials),
        );

        // call the service and return result
        const created = await this.schemaService.initialiseSchema(nodeName, databaseName, adminCredentials, schema);
        const dto: SchemaDto = { name: created.getName() }
        return { status: 200, body: dto };
    }

    public async deleteSchema(
        endpoint: string,
        req: express.Request,
        res: express.Response,
    ): Promise<IResponse<void>> {

        // TODO: accept a request body and extract requestDto
        const nodeName = 'node-name';
        const databaseName = 'database-name';
        const schemaName = 'schema-name';
        const adminCredentials = new Credentials('db_admin', 'db_admin_password'); // from header

        const request: SchemaWithCredentialsDto = {
            name: schemaName,
            adminCredentials: `${schemaName}_admin_username:${schemaName}_admin_password)`,
            userCredentials: `${schemaName}_user_username:${schemaName}_user_password)`,
        }

        // convert request to an entity
        const schema = new Schema(
            request.name,
            this.credentialsService.decryptCredentials(request.adminCredentials),
            this.credentialsService.decryptCredentials(request.userCredentials),
        );

        // call the service and return result
        await this.schemaService.removeSchema(nodeName, databaseName, adminCredentials, schema);
        return { status: 204, body: undefined };
    }

}
