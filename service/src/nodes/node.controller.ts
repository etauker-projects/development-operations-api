/* eslint-disable require-await */
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { ApiController, IResponse } from '../api/api.module';
import { Database, DatabaseDto, DatabaseService, DatabaseWithCredentialsDto } from '../databases/database.module';
import { Schema, SchemaDto, SchemaWithCredentialsDto } from '../schemas/schema.module';
import { Credentials, CredentialsService } from '../credentials/credentials.module';


export class NodeController extends ApiController {

    private static instance?: NodeController;
    private router: express.Router;
    private credentialsService: CredentialsService;
    private databaseService: DatabaseService;


    // ===========================================
    //               CONSTRUCTOR
    // ===========================================
    constructor() {
        super();
        // eslint-disable-next-line new-cap
        this.router = express.Router();
        this.credentialsService = new CredentialsService();
        this.databaseService = new DatabaseService();
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
            { method: 'post', endpoint: '/:nodeId/database/:databaseId/schema', handler: this.postSchema },
            // TODO: { method: 'post', endpoint: '/:nodeId/database/:databaseId/schema/:schemaId', handler: this.deleteSchema },
        ]);
        return this.router;
    }


    // TODO: finish implementing
    public async postDatabase(
        endpoint: string,
        req: express.Request,
        res: express.Response,
    ): Promise<IResponse<DatabaseDto>> {

        // TODO: extract requestDto
        const adminCredentials = new Credentials('superuser', 'superuser:pass');
        const request: DatabaseWithCredentialsDto = {
            name: 'test',
            credentials: 'encrypted("username:password")'
        }

        // convert request to an entity
        const database = new Database(
            request.name,
            this.credentialsService.decryptCredentials(request.credentials),
        );

        // call the service and return result
        const created = await this.databaseService.createDatabase(adminCredentials, database);
        const dto: DatabaseDto = { name: created.getName() }
        return { status: 200, body: dto };
    }


    public async postSchema(
        endpoint: string,
        req: express.Request,
        res: express.Response,
    ): Promise<IResponse<SchemaDto>> {

        // TODO: extract requestDto
        const nodeName = 'k8s-worker-1';
        const databaseName = 'local_01';
        const adminCredentials = new Credentials('dbadmin', 'dbadmin:pass'); // from header
        const request: SchemaWithCredentialsDto = {
            name: 'development',
            adminCredentials: 'encrypted("admin_username:admin_password")',
            userCredentials: 'encrypted("user_username:user_password")',
        }

        // convert request to an entity
        const schema = new Schema(
            request.name,
            this.credentialsService.decryptCredentials(request.adminCredentials),
            this.credentialsService.decryptCredentials(request.userCredentials),
        );

        // call the service and return result
        const created = await this.databaseService.createSchema(nodeName, databaseName, adminCredentials, schema);
        const dto: SchemaDto = { name: created.getName() }
        return { status: 200, body: dto };
    }

}
