import swaggerJsdoc from 'swagger-jsdoc';
import config from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kewen API Platform',
      version: '1.0.0',
      description: 'Advanced Database API Platform - Better than DBAPI',
      contact: {
        name: 'Kewen API Support',
        email: 'support@kewen-api.com',
      },
    },
    servers: [
      {
        url: `http://${config.host}:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
