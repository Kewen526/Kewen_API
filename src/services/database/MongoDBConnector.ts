import { MongoClient, Db } from 'mongodb';
import { BaseConnector, ConnectionConfig, QueryResult } from './BaseConnector';
import logger from '../../utils/logger';

export class MongoDBConnector extends BaseConnector {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    try {
      const uri = `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;

      this.client = new MongoClient(uri, {
        ssl: this.config.ssl,
        ...this.config.options,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.isConnected = true;
      logger.info('MongoDB connection established');
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    }
  }

  async execute(query: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const queryObj = JSON.parse(query);
      const collection = this.db.collection(queryObj.collection);

      let result: any;
      switch (queryObj.operation) {
        case 'find':
          result = await collection.find(queryObj.filter || {}).toArray();
          return { rows: result, rowCount: result.length };

        case 'findOne':
          result = await collection.findOne(queryObj.filter || {});
          return { rows: result ? [result] : [], rowCount: result ? 1 : 0 };

        case 'insert':
          result = await collection.insertMany(queryObj.documents);
          return {
            rows: [],
            rowCount: 0,
            affectedRows: result.insertedCount,
          };

        case 'update':
          result = await collection.updateMany(queryObj.filter, queryObj.update);
          return {
            rows: [],
            rowCount: 0,
            affectedRows: result.modifiedCount,
          };

        case 'delete':
          result = await collection.deleteMany(queryObj.filter);
          return {
            rows: [],
            rowCount: 0,
            affectedRows: result.deletedCount,
          };

        case 'aggregate':
          result = await collection.aggregate(queryObj.pipeline).toArray();
          return { rows: result, rowCount: result.length };

        default:
          throw new Error(`Unsupported operation: ${queryObj.operation}`);
      }
    } catch (error: any) {
      logger.error('MongoDB query execution failed:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }
      await this.db!.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTables(): Promise<string[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    const collections = await this.db.listCollections().toArray();
    return collections.map((col) => col.name);
  }

  async getTableSchema(collectionName: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const collection = this.db.collection(collectionName);
    const sample = await collection.findOne();

    if (!sample) {
      return [];
    }

    return Object.keys(sample).map((key) => ({
      name: key,
      type: typeof sample[key],
      nullable: true,
    }));
  }

  async getTableData(collectionName: string, limit: number = 100): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const collection = this.db.collection(collectionName);
    const rows = await collection.find().limit(limit).toArray();

    return {
      rows,
      rowCount: rows.length,
    };
  }
}
