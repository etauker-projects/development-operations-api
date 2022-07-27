import { Request, Response } from 'express';
import { IResponse } from './response.interface';

export interface IEndpoint {
    method: string;
    endpoint: string;
    handler: (
        endpoint: string,
        req: Request,
        res: Response,
    ) => Promise<IResponse<any>>;
}