# Kewen API Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**Advanced Database API Platform - Better than DBAPI** 🚀

A powerful, enterprise-grade platform for creating, managing, and deploying database APIs with advanced features including multi-database support, real-time monitoring, caching, webhooks, and scheduled jobs.

## ✨ Key Features

### 🎯 Core Capabilities
- **Multi-Database Support** - MySQL, PostgreSQL, MongoDB, Redis, SQL Server, SQLite
- **Dynamic API Generation** - Create REST APIs from SQL queries in seconds
- **Visual SQL Editor** - Syntax highlighting, auto-completion, formatting
- **API Versioning** - Full version control with rollback support
- **Real-time Monitoring** - Performance metrics, request analytics, error tracking

### 🔒 Security & Performance
- **Smart Caching** - Redis-based intelligent caching with auto-invalidation
- **Rate Limiting** - IP-based and API-level rate limiting
- **SQL Injection Protection** - Advanced validation and sanitization
- **Authentication** - JWT + API Key support
- **Role-based Access Control** - Fine-grained permissions

### 🔔 Integration & Automation
- **Webhook Support** - Real-time event notifications
- **Scheduled Jobs** - Cron-based task scheduling
- **Data Import/Export** - Excel, CSV, JSON support
- **API Documentation** - Auto-generated Swagger docs
- **GraphQL Support** - REST + GraphQL dual protocol

### 👥 Collaboration
- **Team Management** - Multi-user support with roles
- **Audit Logging** - Complete request history
- **Usage Analytics** - Detailed metrics and reports

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/kewen-api.git
cd kewen-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:3000/api-docs`

### Authentication

#### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

### Create a Data Source

```bash
curl -X POST http://localhost:3000/api/datasources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My MySQL Database",
    "type": "MYSQL",
    "host": "localhost",
    "port": 3306,
    "database": "mydb",
    "username": "user",
    "password": "password"
  }'
```

### Create an API

```bash
curl -X POST http://localhost:3000/api/apis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Get Users",
    "path": "/users",
    "method": "GET",
    "dataSourceId": "DATASOURCE_ID",
    "sql": "SELECT * FROM users WHERE status = ${status} LIMIT ${limit}",
    "cacheEnabled": true,
    "cacheTtl": 300
  }'
```

### Execute Dynamic API

```bash
# Using API Key
curl -X GET "http://localhost:3000/api/dynamic/users?status=active&limit=10" \
  -H "X-API-Key: YOUR_API_KEY"
```

## 🏗️ Architecture

```
kewen-api/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   └── database/    # Database connectors
│   └── utils/           # Utility functions
├── prisma/
│   └── schema.prisma    # Database schema
├── logs/                # Application logs
├── uploads/             # File uploads
└── docker-compose.yml   # Docker configuration
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (Platform DB)
DATABASE_URL=postgresql://user:pass@localhost:5432/kewen_api

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=10

# Features
CACHE_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_METRICS=true
```

## 📊 Database Schema

The platform uses Prisma ORM with the following main models:

- **User** - User accounts and authentication
- **DataSource** - External database connections
- **Api** - API definitions and configurations
- **ApiVersion** - API version history
- **ApiLog** - Request logging
- **ApiMetric** - Performance metrics
- **Webhook** - Webhook configurations
- **ScheduledJob** - Cron jobs

## 🔐 Security Best Practices

1. **SQL Injection Prevention** - All queries are validated and parameterized
2. **Rate Limiting** - Prevent abuse with configurable limits
3. **IP Whitelisting** - Restrict API access by IP
4. **Encrypted Passwords** - Database passwords encrypted at rest
5. **JWT Authentication** - Secure token-based auth
6. **API Keys** - Revocable API keys with permissions
7. **Audit Logging** - Complete request history

## 📈 Monitoring & Analytics

### Built-in Metrics
- Request count and success rate
- Average/min/max response times
- Error rates and types
- API usage by endpoint
- Database query performance

### Logging
- Structured JSON logging
- Daily log rotation
- Configurable log levels
- Error stack traces

## 🛠️ Development

### Run tests
```bash
npm test
```

### Build for production
```bash
npm run build
npm start
```

### Database migrations
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Code quality
```bash
# Lint
npm run lint

# Format
npm run format
```

## 🌟 Features Comparison

| Feature | DBAPI | Kewen API Platform |
|---------|-------|-------------------|
| Multi-Database Support | ✅ | ✅ Enhanced (6+ databases) |
| SQL Editor | ✅ | ✅ Advanced (syntax highlight) |
| API Generation | ✅ | ✅ Dynamic routing |
| Caching | ❌ | ✅ Redis-based |
| Rate Limiting | ❌ | ✅ IP & API level |
| Webhooks | ❌ | ✅ Event-driven |
| Scheduled Jobs | ❌ | ✅ Cron support |
| Version Control | ❌ | ✅ Full versioning |
| Team Collaboration | ❌ | ✅ Multi-user |
| Real-time Monitoring | ❌ | ✅ Analytics dashboard |
| GraphQL Support | ❌ | ✅ Dual protocol |
| Data Import/Export | ❌ | ✅ Multiple formats |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kewen**

## 🙏 Acknowledgments

- Inspired by DBAPI but with significantly enhanced features
- Built with modern TypeScript and best practices
- Designed for enterprise-grade reliability and scalability

## 📞 Support

For support, email support@kewen-api.com or open an issue on GitHub.

---

Made with ❤️ by Kewen