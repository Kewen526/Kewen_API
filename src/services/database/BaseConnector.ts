export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  sslConfig?: any;
  options?: any;
}

export interface QueryResult {
  rows: any[];
  fields?: any[];
  rowCount?: number;
  affectedRows?: number;
}

export abstract class BaseConnector {
  protected config: ConnectionConfig;
  protected connection: any;
  protected isConnected: boolean = false;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract execute(sql: string, params?: any[]): Promise<QueryResult>;
  abstract testConnection(): Promise<boolean>;
  abstract getTables(): Promise<string[]>;
  abstract getTableSchema(tableName: string): Promise<any[]>;
  abstract getTableData(tableName: string, limit?: number): Promise<QueryResult>;

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}
