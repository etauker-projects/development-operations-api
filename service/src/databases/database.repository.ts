import { PersistenceConnector, PersistenceTransaction } from '@etauker/connector-postgres';
import { HttpError } from '../api/http-error';
import { Schema } from '../schemas/schema.module';
import { Database } from './database';

export class DatabaseRepository {

    private connector: PersistenceConnector;

    constructor(connector: PersistenceConnector) {
        this.connector = connector;
    }

    // TODO: finish implementing and test
    async insert(database: Database): Promise<Database> {

        const params = [
            database.getName(),
            database.getCredentials().getUsername(),
            database.getCredentials().getPassword(),
        ];

        // const statements = `

        //     -- Create database
        //     CREATE DATABASE $1 WITH OWNER = $2;

        //     -- Create procedures
        //     CREATE OR REPLACE PROCEDURE create_user_if_not_exists(username name, password text)
        //     LANGUAGE plpgsql
        //     AS \$\$
            
        //     BEGIN
        //         IF NOT EXISTS (SELECT * FROM pg_catalog.pg_user WHERE usename = username) THEN 
        //             EXECUTE FORMAT('CREATE USER "%I" WITH PASSWORD ''%I''', username, password);
        //         ELSE
        //             RAISE NOTICE 'user "%" already exists, skipping', username;
        //         END IF;
        //     END
        //     \$\$;
            
        //     -- Create database user
        //     CALL create_user_if_not_exists('$2', '$3');
        //     ALTER USER $2 CREATEROLE;
        //     GRANT ALL PRIVILEGES ON DATABASE $1 to $2;
        //     ALTER DATABASE $1 OWNER TO $2;

        //     -- Clean up helpers
        //     DROP FUNCTION create_user_if_not_exists(name, text);
        // `;

        const statements = `

            -- Create database
            CREATE DATABASE $1;

            -- Create database user
            CREATE USER $2 WITH PASSWORD '$3';
            ALTER USER $2 CREATEROLE;
            GRANT ALL PRIVILEGES ON DATABASE $1 to $2;
            ALTER DATABASE $1 OWNER TO $2;

        `;

        const transaction = this.connector.transact();
        const res = await transaction.continue<any>(statements, params);
        console.log(res); // TODO: remove after testing
        await transaction.end(true);
        return database;
    }

    async insertSchema(schema: Schema): Promise<Schema> {

        const params = [
            schema.getName(),
            schema.getAdmin().getUsername(),
            schema.getAdmin().getPassword(),
            schema.getUser().getUsername(),
            schema.getUser().getPassword(),
        ];

        const statements = `

            -- Create the schema
            CREATE SCHEMA $1;

            -- Create admin user
            CREATE USER $2 WITH PASSWORD '$3';
            ALTER ROLE $2 SET search_path TO $1;
            GRANT ALL ON ALL TABLES IN SCHEMA $1 TO $2;
            ALTER SCHEMA $1 OWNER TO $2;
            GRANT CREATE, USAGE ON SCHEMA public TO $2;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO $2;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $2;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO $2;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $2;

            -- Create standard user
            CREATE USER $4 WITH PASSWORD '$5';
            ALTER ROLE $4 SET search_path TO $1;
            GRANT USAGE ON SCHEMA $1 TO $4;
            GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA $1 TO $4;
        `;

        const transaction = this.connector.transact();

        const [ schemaExists, adminExists, userExists ] = await Promise.all([
            this.schemaExists(transaction, schema.getName()),
            this.userExists(transaction, schema.getAdmin().getUsername()),
            this.userExists(transaction, schema.getUser().getUsername()),
        ]);

        if (schemaExists) {
            await transaction.end(false);
            throw new HttpError(409, `Schema with name "${ schema.getName() }" already exists`);
        }

        if (adminExists) {
            await transaction.end(false);
            throw new HttpError(409, `User with name "${ schema.getAdmin().getUsername() }" already exists`);
        }

        if (userExists) {
            await transaction.end(false);
            throw new HttpError(409, `User with name "${ schema.getUser().getUsername() }" already exists`);
        }

        try {
            const res = await transaction.continue<any>(statements, params);
            console.log(res); // TODO: remove after testing
            await transaction.commit();
            return schema;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async schemaExists(transaction: PersistenceTransaction, name: string): Promise<boolean> {
        const query = 'SELECT FROM pg_namespace WHERE nspname = $1;';
        const res = await transaction.continue(query, [name]);
        console.log(res); // TODO: remove after testing
        return res.results.length > 0; // TODO: fix after testing
    }

    private async userExists(transaction: PersistenceTransaction, name: string): Promise<boolean> {
        const query = 'SELECT FROM pg_catalog.pg_roles WHERE rolname = $1;';
        const res = await transaction.continue(query, [name]);
        console.log(res); // TODO: remove after testing
        return res.results.length > 0; // TODO: fix after testing
    }

}