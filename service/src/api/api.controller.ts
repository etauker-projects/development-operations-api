import * as express from 'express';
import { ZodError } from 'zod';
import { LogService } from '../logs/log.module';
import { IEndpoint, IResponse } from './api.module';


export class ApiController {
    
    protected logger: LogService;

    constructor(logger: LogService) {
        this.logger = logger;
    }

    protected registerEndpoints(
        router: express.Router,
        registrations: IEndpoint[]
    ) {

        // this.logger.info('Registering  endpoints:');
        registrations.forEach(registration => {
            const method = registration.method;
            const endpoint = registration.endpoint;
            const handler = async (req: express.Request, res: express.Response) => {
                try {
                    const handlerFn = registration.handler.bind(this, endpoint);
                    const { status, body } = await handlerFn(req, res);
                    res.status(status).json(body);
                } catch (error) {
                    const { status, body } = this.parseError(error);
                    res.status(status || 500).json(body);
                }
            };
            
            router[method](endpoint, handler);
            this.logger.info(`registered: ${ method.toUpperCase() } ${ endpoint }`);
        });
    }

    protected parseError(error: any): IResponse<{ message: string }> {
        if (error instanceof ZodError) {
            return { status: 400, body: error };
        }

        const status = isNaN(parseInt(error?.code)) ? 500 : parseInt(error?.code);
        const message = error?.message || 'Unexpected error occurred';
        return { status, body: { message }};
    }

}