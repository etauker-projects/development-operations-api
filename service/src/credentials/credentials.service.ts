// import crypto from 'crypto'
import { Credentials } from './credentials';

export class CredentialsService {

    // private privateKey: crypto.KeyObject;
    // private publicKey: crypto.KeyObject;
    // private encryptionOptions;

    constructor() {

        // // The standard secure default length for RSA keys is 2048 bits
        // const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        //     modulusLength: 2048,
        // });

        // // TODO: find a way to share the keys across pods
        // this.privateKey = privateKey;
        // this.publicKey = publicKey;

        // // must be the same for encryption and decryption
        // this.encryptionOptions = {
        //     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        //     oaepHash: 'sha256'
        // }
    }

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

    // // TODO: implement for v2 of the API
    // decrypt(encrypted: string): string {
    //     // const key = fs.readFileSync('private_key.pem', 'utf8');
    //     const key = this.privateKey;
    //     const options = { key, ...this.encryptionOptions };
    //     return crypto.privateDecrypt(options, Buffer.from(encrypted)).toString();
    // }

    // // TODO: implement for v2 of the API
    // encrypt(decrypted: string): string {
    //     // const key = fs.readFileSync('public_key.pem', 'utf8');
    //     const key = this.publicKey;
    //     const options = { key, ...this.encryptionOptions };
    //     return crypto.publicEncrypt(options, Buffer.from(decrypted)).toString();
    // }

    // // TODO: implement for v2 of the API
    // getPublicKey(): string {
    //     return this.publicKey.export({
    //         type: 'spki',
    //         format: 'pem',
    //     }).toString('utf-8');
    // }
}