import { Credentials } from './credentials';

export class CredentialsService {

    decodeCredentials(username: string, encodedPassword: string): Credentials {
        const decodedPassword = this.decode(encodedPassword);
        return new Credentials(username, decodedPassword);
    }

    decode(encoded: string): string {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    }

    encode(decoded: string): string {
        return Buffer.from(decoded).toString('base64');
    }
}