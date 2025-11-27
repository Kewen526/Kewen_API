# Kewen API 平台 - Web 管理界面

基于 React + TypeScript + Ant Design 的现代化数据库 API 管理系统。

## 功能特点

- 🎨 **精美的中文界面** - 全中文界面，符合国人使用习惯
- 📊 **实时监控仪表板** - 可视化展示 API 性能和使用情况
- 🗄️ **数据源管理** - 支持多种数据库的可视化管理
- 💻 **SQL 编辑器** - 内置 Monaco Editor，支持语法高亮
- 🚀 **API 管理** - 可视化创建、编辑、发布 API
- 📈 **性能分析** - 详细的 API 调用日志和性能指标

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3021

### 生产构建

```bash
npm run build
```

## 技术栈

- React 18
- TypeScript
- Ant Design 5
- React Router 6
- React Query
- Zustand (状态管理)
- Monaco Editor (代码编辑器)
- Ant Design Charts (图表)
- Axios (HTTP 请求)

## 项目结构

```
web/
├── src/
│   ├── api/              # API 接口定义
│   ├── components/       # 公共组件
│   ├── pages/            # 页面组件
│   ├── stores/           # 状态管理
│   ├── utils/            # 工具函数
│   ├── App.tsx           # 应用入口
│   └── main.tsx          # 主入口
├── public/               # 静态资源
└── index.html            # HTML 模板
```

## 默认登录

- 用户名: `admin` 密码: `admin123`
- 用户名: `demo` 密码: `demo123`

## 界面预览

- 🏠 **仪表板** - 数据概览和快速访问
- 🗄️ **数据源** - 管理多个数据库连接
- 💻 **SQL 编辑器** - 在线执行和测试 SQL
- 🔌 **API 管理** - 创建和管理 RESTful API
- 📊 **监控中心** - 实时性能监控和分析

## 开发说明

### 代理配置

开发环境下，所有 `/api` 请求会被代理到 `http://localhost:3020`

### 状态持久化

使用 Zustand + localStorage 实现登录状态持久化

### 主题定制

在 `src/main.tsx` 中可以自定义 Ant Design 主题

## License

MIT
