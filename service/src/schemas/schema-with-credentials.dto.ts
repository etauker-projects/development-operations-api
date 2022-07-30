import { SchemaDto } from './schema.dto';

export interface SchemaWithCredentialsDto extends SchemaDto {
    adminPassword: string;    // encrypted
    userPassword: string;     // encrypted
}