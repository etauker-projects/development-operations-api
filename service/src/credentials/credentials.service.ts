import { Credentials } from './credentials';

export class CredentialsService {

    public decryptCredentials(username: string, encryptedPassword: string): Credentials {

        // TODO: decrypt the string using private key
        const decryptedPassword = encryptedPassword;
        return new Credentials(username, decryptedPassword);
    }

    constructor() {

    }

}