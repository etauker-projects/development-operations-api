import dotenv from 'dotenv';
import { OperationsServer } from './operations.server';

dotenv.config({ path: 'config/.env' });

try {
    const port = parseInt(process.env?.PORT || '9999');
    const server = new OperationsServer(port).start();

} catch (error) {
    console.log(error);
    process.exit(1);
}
