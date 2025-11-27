import mysql, { Pool, PoolConnection, RowDataPacket, FieldPacket } from 'mysql2/promise';
import { BaseConnector, ConnectionConfig, QueryResult } from './BaseConnector';
import logger from '../../utils/logger';

export class MySQLConnector extends BaseConnector {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: this.config.ssl ? this.config.sslConfig : undefined,
        ...this.config.options,
      });

      await this.pool.query('SELECT 1');
      this.isConnected = true;
      logger.info('MySQL connection established');
    } catch (error) {
      logger.error('MySQL connection failed:', error);
      throw new Error(`Failed to connect to MySQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('MySQL connection closed');
    }
  }

  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const [rows, fields] = await this.pool.query<RowDataPacket[]>(sql, params);

      return {
        rows: Array.isArray(rows) ? rows : [rows],
        fields: fields as FieldPacket[],
        rowCount: Array.isArray(rows) ? rows.length : 1,
        affectedRows: (rows as any).affectedRows,
      };
    } catch (error: any) {
      logger.error('MySQL query execution failed:', error);
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
    const result = await this.execute('SHOW TABLES');
    return result.rows.map((row: any) => Object.values(row)[0] as string);
  }

  async getTableSchema(tableName: string): Promise<any[]> {
    const result = await this.execute(`DESCRIBE ${tableName}`);
    return result.rows.map((row: any) => ({
      name: row.Field,
      type: row.Type,
      nullable: row.Null === 'YES',
      key: row.Key,
      default: row.Default,
      extra: row.Extra,
    }));
  }

  async getTableData(tableName: string, limit: number = 100): Promise<QueryResult> {
    return this.execute(`SELECT * FROM ${tableName} LIMIT ${limit}`);
  }
}
