import { DatabaseDto } from './database.dto';

export interface DatabaseWithCredentialsDto extends DatabaseDto {
    credentials: string;    // encrypted("username:password")
}