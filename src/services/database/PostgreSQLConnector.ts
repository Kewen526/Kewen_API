import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';
import { BaseConnector, ConnectionConfig, QueryResult } from './BaseConnector';
import logger from '../../utils/logger';

export class PostgreSQLConnector extends BaseConnector {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl ? this.config.sslConfig : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ...this.config.options,
      });

      await this.pool.query('SELECT 1');
      this.isConnected = true;
      logger.info('PostgreSQL connection established');
    } catch (error) {
      logger.error('PostgreSQL connection failed:', error);
      throw new Error(`Failed to connect to PostgreSQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('PostgreSQL connection closed');
    }
  }

  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result: PgQueryResult = await this.pool.query(sql, params);

      return {
        rows: result.rows,
        fields: result.fields,
        rowCount: result.rowCount || 0,
        affectedRows: result.rowCount || 0,
      };
    } catch (error: any) {
      logger.error('PostgreSQL query execution failed:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        await this.connect();
      }
      await this.pool!.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTables(): Promise<string[]> {
    const result = await this.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    return result.rows.map((row: any) => row.table_name);
  }

  async getTableSchema(tableName: string): Promise<any[]> {
    const result = await this.execute(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    return result.rows.map((row: any) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default,
      maxLength: row.character_maximum_length,
    }));
  }

  async getTableData(tableName: string, limit: number = 100): Promise<QueryResult> {
    return this.execute(`SELECT * FROM ${tableName} LIMIT ${limit}`);
  }
}
