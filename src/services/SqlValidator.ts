import logger from '../utils/logger';

export class SqlValidator {
  private static readonly DANGEROUS_KEYWORDS = [
    'DROP',
    'TRUNCATE',
    'DELETE FROM',
    'ALTER',
    'GRANT',
    'REVOKE',
    'CREATE USER',
    'DROP USER',
  ];

  private static readonly SENSITIVE_TABLES = [
    'users',
    'user',
    'admin',
    'password',
    'authentication',
  ];

  static validateSql(sql: string, allowWrite: boolean = false): { valid: boolean; error?: string } {
    const upperSql = sql.trim().toUpperCase();

    // Check for SQL injection patterns
    if (this.hasSqlInjectionPattern(sql)) {
      return {
        valid: false,
        error: 'Potential SQL injection detected',
      };
    }

    // Check for dangerous operations
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      if (upperSql.includes(keyword)) {
        logger.warn(`Dangerous SQL keyword detected: ${keyword}`);
        return {
          valid: false,
          error: `Dangerous operation not allowed: ${keyword}`,
        };
      }
    }

    // Check write operations if not allowed
    if (!allowWrite) {
      const writeOps = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
      for (const op of writeOps) {
        if (upperSql.startsWith(op)) {
          return {
            valid: false,
            error: 'Write operations are not allowed for this API',
          };
        }
      }
    }

    // Check for multi-statement queries
    if (this.hasMultipleStatements(sql)) {
      return {
        valid: false,
        error: 'Multiple SQL statements are not allowed',
      };
    }

    return { valid: true };
  }

  private static hasSqlInjectionPattern(sql: string): boolean {
    const injectionPatterns = [
      /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
      /UNION\s+SELECT/i,
      /--.*$/m,
      /#.*$/m,
      /\/\*.*\*\//,
      /'\s*OR\s+'?1'?\s*=\s*'?1/i,
      /'\s*OR\s+'?1'?\s*=\s*'?1'?\s*--/i,
    ];

    return injectionPatterns.some((pattern) => pattern.test(sql));
  }

  private static hasMultipleStatements(sql: string): boolean {
    const statements = sql.split(';').filter((s) => s.trim().length > 0);
    return statements.length > 1;
  }

  static sanitizeParameters(params: any[]): any[] {
    return params.map((param) => {
      if (typeof param === 'string') {
        return param.replace(/[';--#]/g, '');
      }
      return param;
    });
  }

  static extractTableNames(sql: string): string[] {
    const upperSql = sql.toUpperCase();
    const fromMatch = upperSql.match(/FROM\s+([a-zA-Z0-9_,\s]+)/);
    const joinMatch = upperSql.match(/JOIN\s+([a-zA-Z0-9_,\s]+)/);

    const tables: string[] = [];

    if (fromMatch) {
      tables.push(...fromMatch[1].split(',').map((t) => t.trim()));
    }

    if (joinMatch) {
      tables.push(...joinMatch[1].split(',').map((t) => t.trim()));
    }

    return tables;
  }
}
