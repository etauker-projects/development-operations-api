export interface IResponse<T> {
    status: number;
    body: T;
}