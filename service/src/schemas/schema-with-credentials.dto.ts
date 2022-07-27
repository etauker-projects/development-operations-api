import { SchemaDto } from './schema.dto';

export interface SchemaWithCredentialsDto extends SchemaDto {
    adminCredentials: string;    // encrypted("username:password")
    userCredentials: string;     // encrypted("username:password")
}