import pgk from "pg";
import envconfig from "../envconfig/envconfig.ts";

const { Pool } = pgk;

/**
 * Instantiates and return a new database connection
 * @returns The database connection
 */
export function getDbConnection(): pgk.Pool {
    const dbConnection = new Pool({
        user: envconfig.dbUser(),
        host: envconfig.dbHost(),
        database: envconfig.dbName(),
        password: envconfig.dbPassword(),
        port: envconfig.dbPort(),
    });

    return dbConnection;
}
