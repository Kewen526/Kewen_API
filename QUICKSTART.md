# Kewen API Platform - 快速开始指南

## 5 分钟快速部署

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/Kewen526/Kewen_API.git
cd Kewen_API

# 2. 一键启动所有服务
docker-compose up -d

# 3. 等待服务启动（约 30 秒）
docker-compose logs -f api

# 4. 访问平台
# API: http://localhost:3000
# 文档: http://localhost:3000/api-docs
# pgAdmin: http://localhost:5050 (admin@kewen-api.com / admin123)
# Redis Commander: http://localhost:8081
```

就这么简单！🎉

### 方式二：手动部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 3. 初始化数据库
npx prisma migrate dev
npx prisma generate

# 4. 启动开发服务器
npm run dev
```

## 第一次使用

### 1. 注册账号

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

或者使用默认账号（如果运行了 seed）：
- 用户名: `admin` 密码: `admin123`
- 用户名: `demo` 密码: `demo123`

### 2. 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

将返回的 `token` 保存，后续请求需要使用。

### 3. 创建数据源

```bash
curl -X POST http://localhost:3000/api/datasources \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MySQL 测试库",
    "type": "MYSQL",
    "host": "localhost",
    "port": 3306,
    "database": "test",
    "username": "root",
    "password": "password",
    "description": "测试数据库"
  }'
```

保存返回的 `id`，创建 API 时需要使用。

### 4. 测试数据源连接

```bash
curl -X POST http://localhost:3000/api/datasources/YOUR_DATASOURCE_ID/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. 创建第一个 API

```bash
curl -X POST http://localhost:3000/api/apis \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "获取用户列表",
    "path": "/users",
    "method": "GET",
    "dataSourceId": "YOUR_DATASOURCE_ID",
    "sql": "SELECT * FROM users WHERE status = '\''active'\'' LIMIT 10",
    "description": "获取活跃用户列表",
    "cacheEnabled": true,
    "cacheTtl": 300
  }'
```

保存返回的 `id`。

### 6. 发布 API

```bash
curl -X POST http://localhost:3000/api/apis/YOUR_API_ID/publish \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. 生成 API Key

首先需要创建 API Key（可以通过管理界面或直接操作数据库）：

```sql
-- 在数据库中执行
INSERT INTO api_keys (id, name, key, user_id, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'My API Key',
  'your-api-key-here',  -- 使用随机生成的密钥
  'YOUR_USER_ID',
  'ACTIVE',
  NOW(),
  NOW()
);
```

### 8. 调用动态 API

```bash
# 使用 API Key 调用
curl -X GET http://localhost:3000/api/dynamic/users \
  -H "X-API-Key: YOUR_API_KEY"
```

## 常用操作

### 查看所有数据源

```bash
curl http://localhost:3000/api/datasources \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 查看所有 API

```bash
curl http://localhost:3000/api/apis \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 执行 SQL 查询

```bash
curl -X POST http://localhost:3000/api/datasources/YOUR_DATASOURCE_ID/query \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT * FROM users LIMIT 5"
  }'
```

### 查看 API 性能指标

```bash
curl http://localhost:3000/api/apis/YOUR_API_ID/metrics?days=7 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 查看 API 调用日志

```bash
curl http://localhost:3000/api/apis/YOUR_API_ID/logs?page=1&pageSize=20 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 高级功能

### 1. 参数化查询

创建带参数的 API：

```json
{
  "name": "根据条件查询用户",
  "path": "/users/search",
  "method": "GET",
  "sql": "SELECT * FROM users WHERE name LIKE '%${keyword}%' AND age > ${minAge} LIMIT ${limit}",
  "parameters": {
    "keyword": { "type": "string", "required": false, "default": "" },
    "minAge": { "type": "number", "required": false, "default": 0 },
    "limit": { "type": "number", "required": false, "default": 10 }
  }
}
```

调用：
```bash
curl "http://localhost:3000/api/dynamic/users/search?keyword=John&minAge=25&limit=20" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 2. 响应字段映射

```json
{
  "responseMapping": {
    "userId": "id",
    "userName": "name",
    "userEmail": "email"
  }
}
```

### 3. IP 白名单

```json
{
  "ipWhitelist": ["192.168.1.100", "10.0.0.1"]
}
```

### 4. 自定义限流

```json
{
  "rateLimitEnabled": true,
  "rateLimit": 60  // 每分钟 60 次请求
}
```

## 管理界面

访问 Swagger 文档进行可视化操作：
```
http://localhost:3000/api-docs
```

在 Swagger UI 中，你可以：
- 📝 测试所有 API 接口
- 🔍 查看完整的 API 文档
- 🎯 直接执行请求
- 📊 查看请求响应示例

## 数据库管理工具

### pgAdmin (PostgreSQL)
- URL: http://localhost:5050
- 邮箱: admin@kewen-api.com
- 密码: admin123

### Redis Commander
- URL: http://localhost:8081

## 故障排查

### 服务无法启动

```bash
# 查看日志
docker-compose logs api

# 重启服务
docker-compose restart api
```

### 数据库连接失败

```bash
# 检查 PostgreSQL
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres
```

### Redis 连接失败

```bash
# 检查 Redis
docker-compose ps redis

# 测试连接
docker-compose exec redis redis-cli ping
```

## 生产环境部署

详细的生产环境部署指南请查看 [DEPLOYMENT.md](DEPLOYMENT.md)

## 常见问题

**Q: 如何修改默认端口？**
A: 编辑 `.env` 文件中的 `PORT` 变量，或修改 `docker-compose.yml` 中的端口映射。

**Q: 如何启用 HTTPS？**
A: 参考 [DEPLOYMENT.md](DEPLOYMENT.md) 中的 SSL/HTTPS 配置章节。

**Q: 如何添加新的数据库类型？**
A: 实现对应的 Connector 类，继承 `BaseConnector` 并注册到 `ConnectorFactory`。

**Q: 如何备份数据？**
A: 使用 `pg_dump` 备份 PostgreSQL，参考 [DEPLOYMENT.md](DEPLOYMENT.md) 中的备份章节。

## 下一步

1. 📖 阅读完整文档：[README.md](README.md)
2. 🚀 部署到生产环境：[DEPLOYMENT.md](DEPLOYMENT.md)
3. 🎨 开发前端界面（即将推出）
4. 🤝 加入社区讨论

## 获取帮助

- 📧 邮箱: support@kewen-api.com
- 🐛 问题反馈: GitHub Issues
- 📚 文档: http://localhost:3000/api-docs

祝你使用愉快！🎉
