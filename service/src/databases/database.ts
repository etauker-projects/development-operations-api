import { Credentials } from '../credentials/credentials.module';

export class Database {

    private name: string;
    private credentials: Credentials;

    constructor(name: string, credentials: Credentials) {
        this.name = name;
        this.credentials = credentials;
    }

    public getName(): string {
        return this.name;
    }
    public getCredentials(): Credentials {
        return this.credentials;
    }
}