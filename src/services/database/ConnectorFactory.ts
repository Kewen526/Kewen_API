import { BaseConnector, ConnectionConfig } from './BaseConnector';
import { MySQLConnector } from './MySQLConnector';
import { PostgreSQLConnector } from './PostgreSQLConnector';
import { MongoDBConnector } from './MongoDBConnector';

export enum DatabaseType {
  MYSQL = 'MYSQL',
  POSTGRESQL = 'POSTGRESQL',
  MONGODB = 'MONGODB',
  REDIS = 'REDIS',
  SQL_SERVER = 'SQL_SERVER',
  SQLITE = 'SQLITE',
}

export class ConnectorFactory {
  static createConnector(type: DatabaseType, config: ConnectionConfig): BaseConnector {
    switch (type) {
      case DatabaseType.MYSQL:
        return new MySQLConnector(config);

      case DatabaseType.POSTGRESQL:
        return new PostgreSQLConnector(config);

      case DatabaseType.MONGODB:
        return new MongoDBConnector(config);

      // Add more connectors as needed
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}

// Connection pool manager
export class ConnectionManager {
  private static connections: Map<string, BaseConnector> = new Map();

  static async getConnection(
    id: string,
    type: DatabaseType,
    config: ConnectionConfig
  ): Promise<BaseConnector> {
    if (this.connections.has(id)) {
      const connector = this.connections.get(id)!;
      if (connector.isConnectionActive()) {
        return connector;
      }
    }

    const connector = ConnectorFactory.createConnector(type, config);
    await connector.connect();
    this.connections.set(id, connector);
    return connector;
  }

  static async closeConnection(id: string): Promise<void> {
    const connector = this.connections.get(id);
    if (connector) {
      await connector.disconnect();
      this.connections.delete(id);
    }
  }

  static async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map((id) =>
      this.closeConnection(id)
    );
    await Promise.all(promises);
  }
}
