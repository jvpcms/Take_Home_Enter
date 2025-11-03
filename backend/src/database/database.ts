import { Mutex } from "async-mutex";
import { getDbConnection } from "./databaseConnection.ts";

import type pgk from "pg";
import type { DatabaseSchema } from "./types/databaseSchema.ts";

export interface IDatabase {
    /**
     * Inserts data into the database
     * 
     * @param table 
     * @param data 
     * @returns The inserted data
     */
    insert<tableName extends keyof DatabaseSchema>(
        table: tableName,
        data: DatabaseSchema[tableName]
    ): Promise<DatabaseSchema[tableName]>;

    /**
     * Selects data from the database
     * 
     * @param table The table to select from
     * @param where The where clause
     * @param params The query parameters
     * 
     */
    select<tableName extends keyof DatabaseSchema>(
        table: tableName,
        where?: Partial<DatabaseSchema[tableName]>,
        params?: { order?: string; limit?: number; offset?: number }
    ): Promise<DatabaseSchema[tableName][]>;

    /**
     * Updates data in the database
     * 
     * @param table The table to select from
     * @param where The where clause
     * @param change The new data values
     */
    update<tableName extends keyof DatabaseSchema>(
        table: tableName,
        where: Partial<DatabaseSchema[tableName]>,
        change: Partial<DatabaseSchema[tableName]>
    ): Promise<DatabaseSchema[tableName][]>;

    /**
     * Deletes data from the database
     * 
     * @param table The table to select from
     * @param where The where clause
     */
    delete<tableName extends keyof DatabaseSchema>(
        table: tableName,
        where: Partial<DatabaseSchema[tableName]>
    ): Promise<void>;
}


class Database implements IDatabase {
    private dbConnection: pgk.Pool;
    private writeMutex: Mutex;

    constructor() {
        this.writeMutex = new Mutex();
        this.dbConnection = getDbConnection();
    }

    async insert<tableName extends keyof DatabaseSchema>(
        table: tableName,
        data: DatabaseSchema[tableName]
    ): Promise<DatabaseSchema[tableName]> {

        const pairs = Object.entries(data);

        const query = (
            `INSERT INTO ${table} (${pairs
                .map(([key]) => key).join(", ")}) VALUES (${pairs.map((_, index) => `$${index + 1}`)
                    .join(", ")}) RETURNING *`
        );
        const values = pairs.map(([, value]) => value);

        const insertedData = await this.writeMutex.runExclusive(async () => {
            const insertedData = await this.dbConnection.query(query, values);
            const insertedRows = insertedData.rows;
            return insertedRows[0] as DatabaseSchema[tableName];
        });

        return insertedData;
    }

    async select<tableName extends keyof DatabaseSchema>(
        table: tableName,
        where: Partial<DatabaseSchema[tableName]> = {},
        params: { order?: string; limit?: number; offset?: number } = {}
    ): Promise<DatabaseSchema[tableName][]> {

        const pairs = Object.entries(where);
        const hasWhereClause = pairs.length > 0;

        const query = (
            `SELECT * FROM ${table} 
            ${hasWhereClause ? `WHERE ${pairs.map(([key], index) => `${key} = $${index + 1}`).join(" AND ")}` : ""} 
            ${params.order ? `ORDER BY ${params.order}` : ""} 
            ${params.limit ? `LIMIT ${params.limit}` : ""} 
            ${params.offset ? `OFFSET ${params.offset}` : ""}`
        );
        const values = pairs.map(([, value]) => value);

        const selectedData = await this.dbConnection.query(query, values);

        return selectedData.rows as DatabaseSchema[tableName][];
    }

    async update<tableName extends keyof DatabaseSchema>(
        table: tableName,
        where: Partial<DatabaseSchema[tableName]>,
        change: Partial<DatabaseSchema[tableName]>
    ): Promise<DatabaseSchema[tableName][]> {
        const wherePairs = Object.entries(where);
        const dataPairs = Object.entries(change);

        const query = (
            `UPDATE ${table} SET ${dataPairs
                .map(([key], index) => `${key} = $${index + 1}`)
                .join(", ")} WHERE ${wherePairs
                    .map(([key], index) => `${key} = $${dataPairs.length + index + 1}`)
                    .join(" AND ")} RETURNING *`
        );

        const whereValues = wherePairs.map(([, value]) => value);
        const dataValues = dataPairs.map(([, value]) => value);

        const values = [...dataValues, ...whereValues];

        const updatedData = await this.writeMutex.runExclusive(async () => {
            const updatedData = await this.dbConnection.query(query, values);
            const updatedRows = updatedData.rows;
            return updatedRows as DatabaseSchema[tableName][];
        });

        return updatedData;
    }

    async delete<tableName extends keyof DatabaseSchema>(
        table: tableName,
        where: Partial<DatabaseSchema[tableName]>
    ): Promise<void> {

        const pairs = Object.entries(where);

        const query = (
            `DELETE FROM ${table} 
            WHERE ${pairs.map(([key], index) => `${key} = $${index + 1}`)
                .join(" AND ")}`
        );
        const values = pairs.map(([, value]) => value);

        await this.dbConnection.query(query, values);
    }
}


let database: IDatabase | null = null;

/**
 * Instantiates a new database instance if it does not exist, if it does, it returns the existing instance
 * 
 * @returns The database instance
 */
export function getDatabase(): IDatabase {
    if (!database) {
        database = new Database();
    }
    return database;
}