import * as express from 'express';
import { IEndpoint, IResponse } from './api.module';


export class ApiController {

    constructor() {

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
                    const { status, body } = await registration.handler.bind(
                        this, endpoint,
                    )(req, res);
                    res.status(status).json(body);
                } catch (error) {
                    const { status, body } = this.parseError(error);
                    res.status(status).json(body);
                }
            };
            
            router[method](endpoint, handler);
            // this.logger.info(`-- ${ method.toUpperCase() } ${ endpoint }`);
        });
    }

    protected parseError(error: any): IResponse<{ message: string }> {
        const status = error?.code || 500;
        const message = error?.message || 'Unexpected error occurred';
        return { status, body: { message }};
    }

    // protected validateUuid(id: string, pathParam: boolean = false): Promise<string> {
    //     const regex = new RegExp(`[a-zA-Z|\\d]{8}-[a-zA-Z|\\d]{4}-[a-zA-Z|\\d]{4}-[a-zA-Z|\\d]{4}-[a-zA-Z|\\d]{12}`, 'iu');
    //     if (!regex.test(id)) {
    //         if (pathParam) {
    //             throw new HttpError(404, 'Invalid UUID in path');
    //         } else {
    //             throw new HttpError(400, 'Invalid UUID provided');
    //         }
    //     }
    //     return Promise.resolve(id);
    // }

    // protected validateAuthorizationHeader(auth?: string | string[]): string {
    //     if (!auth) {
    //         throw new HttpError(401, 'Missing auth credentials');
    //     } else if (Array.isArray(auth)) {
    //         throw new HttpError(401, `Multiple 'Authorization' headers set`);
    //     } else {
    //         return auth;
    //     }
    // }

    // protected extractBasicAuth(authorizationHeader: string): string {
    //     const BASIC_REGEX = /basic\s/iu;
    //     return authorizationHeader.replace(BASIC_REGEX, '');
    // }

}