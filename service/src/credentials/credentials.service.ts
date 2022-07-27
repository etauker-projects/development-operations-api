import { Credentials } from './credentials';

export class CredentialsService {

    public decryptCredentials(credentials: string): Credentials {

        // TODO: decrypt the string using private key
        const decrypted = credentials;

        const parts = decrypted.split(':');
        return new Credentials(parts[0], parts[1]);
    }

    constructor() {

    }

}