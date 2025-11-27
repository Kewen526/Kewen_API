# Kewen API 平台 - 快速部署指南

## 🚀 一键启动（Docker 推荐）

### 1. 启动所有服务

```bash
cd Kewen_API
docker-compose up -d
```

### 2. 初始化数据库

```bash
# 进入 API 容器
docker-compose exec api sh

# 运行数据库迁移
npx prisma migrate deploy

# 创建初始数据（可选）
npx prisma db seed

# 退出容器
exit
```

### 3. 访问服务

启动成功后，您可以访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| **🎨 Web 管理界面** | http://localhost:3021 | 中文管理界面 |
| **🔌 API 服务** | http://localhost:3020 | 后端 API |
| **📚 API 文档** | http://localhost:3020/api-docs | Swagger 文档 |
| **🗄️ pgAdmin** | http://localhost:5050 | 数据库管理 |
| **📦 Redis Commander** | http://localhost:8081 | 缓存管理 |

### 4. 默认登录账号

Web 管理界面登录：
- **管理员**: `admin` / `admin123`
- **演示用户**: `demo` / `demo123`

pgAdmin 登录：
- **邮箱**: admin@kewen-api.com
- **密码**: admin123

---

## 💻 手动部署（开发环境）

### 后端服务

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 3. 初始化数据库
npx prisma migrate dev
npx prisma generate

# 4. 启动开发服务器
npm run dev
```

后端将运行在 http://localhost:3020

### 前端服务

```bash
# 1. 进入 web 目录
cd web

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

前端将运行在 http://localhost:3021

---

## 📦 服务管理

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看 API 服务日志
docker-compose logs -f api

# 查看 Web 服务日志
docker-compose logs -f web
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启指定服务
docker-compose restart api
docker-compose restart web
```

### 停止服务

```bash
docker-compose down
```

### 停止并删除数据

```bash
docker-compose down -v
```

---

## 🎯 使用流程

### 1. 登录系统

访问 http://localhost:3021，使用默认账号登录

### 2. 创建数据源

1. 点击左侧菜单 "数据源"
2. 点击 "创建数据源" 按钮
3. 填写数据库连接信息
4. 点击 "测试" 验证连接
5. 保存数据源

### 3. 编写 SQL

1. 点击左侧菜单 "SQL 编辑器"
2. 选择数据源
3. 编写 SQL 查询
4. 点击 "执行" 测试查询

### 4. 创建 API

1. 点击左侧菜单 "API 管理"
2. 点击 "创建 API" 按钮
3. 填写 API 信息：
   - API 名称
   - 请求路径（如 `/users`）
   - 请求方法（GET/POST/PUT/DELETE）
   - 选择数据源
   - 粘贴 SQL 查询
   - 配置缓存、限流等选项
4. 点击 "创建" 保存

### 5. 发布 API

1. 在 API 列表中找到刚创建的 API
2. 点击 "发布" 按钮
3. API 立即生效！

### 6. 调用 API

使用生成的 API 路径调用：

```bash
# 示例：调用 GET /v1/users API
curl -X GET "http://localhost:3020/api/dynamic/v1/users" \
  -H "X-API-Key: YOUR_API_KEY"
```

### 7. 监控 API

1. 点击 API 的 "详情" 查看：
   - 性能指标图表
   - 调用日志
   - 错误统计
2. 在 "监控中心" 查看全局统计

---

## 🔧 常见问题

### 1. 端口被占用

如果 3020 或 3021 端口被占用，可以修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  api:
    ports:
      - "YOUR_PORT:3020"  # 修改左侧端口号
  web:
    ports:
      - "YOUR_PORT:80"    # 修改左侧端口号
```

### 2. 数据库连接失败

检查 `.env` 文件中的 `DATABASE_URL` 是否正确

### 3. Redis 连接失败

确保 Redis 服务正在运行：

```bash
docker-compose ps redis
```

### 4. 前端无法访问后端

检查 CORS 配置，确保 `.env` 中的 `CORS_ORIGIN` 包含前端地址

---

## 📝 生产环境部署

详细的生产环境部署指南请查看：[DEPLOYMENT.md](DEPLOYMENT.md)

包括：
- Nginx 反向代理配置
- SSL/HTTPS 设置
- 性能优化
- 安全加固
- 备份策略
- 监控告警

---

## 🆘 获取帮助

- 📖 [完整文档](README.md)
- 🚀 [快速开始](QUICKSTART.md)
- 🐛 [问题反馈](https://github.com/Kewen526/Kewen_API/issues)
- 📧 Email: support@kewen-api.com

---

**祝你使用愉快！** 🎉
