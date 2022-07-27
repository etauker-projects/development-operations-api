import { Credentials } from '../credentials/credentials';

export class Schema {

    private name: string;
    private admin: Credentials;
    private user: Credentials;

    constructor(name: string, admin: Credentials, user: Credentials) {
        this.name = name;
        this.admin = admin;
        this.user = user;
    }

    public getName(): string {
        return this.name;
    }
    public getAdmin(): Credentials {
        return this.admin;
    }
    public getUser(): Credentials {
        return this.user;
    }
}