# 跆拳道课时管理微信小程序

> 面向培训机构日常运营的课时管理系统 | UniApp + UniCloud Serverless

## 项目简介

针对中小培训机构的经营痛点，实现多角色权限控制、课时充值/消费管理、课程排班、数据统计等核心业务功能。

## 技术栈

- **前端**：uni-app (Vue 3)
- **后端/云服务**：UniCloud（云函数 + 云数据库 MongoDB + 云存储 OSS）
- **认证**：uni-id-common

## 项目结构

```
├── pages/                     # 页面
│   ├── index/                 # 首页（数据统计看板）
│   ├── login/                 # 登录（学员/教练/管理员）
│   ├── coach/                 # 教练端（课时管理、排班、扣课）
│   └── ...
├── uniCloud-aliyun/           # 阿里云 UniCloud
│   └── cloudfunctions/        # 云函数
│       ├── auth/              # 用户认证
│       ├── coach/             # 教练相关业务
│       └── common/            # 公共模块
├── utils/                     # 工具函数
│   ├── common.js              # 常量、工具方法
│   └── share.js               # 微信分享安全机制
├── static/                    # 静态资源
├── .env.example               # 环境变量模板
└── .gitignore
```

## 功能模块

- **多角色权限控制**：管理员、教练、学员三级权限，差异化功能访问与数据隔离
- **课时充值**：支持按次/按天/私教课三种课时类型
- **消费扣减**：课时消费自动扣减，数据库事务保障数据一致性
- **课程排班管理**：教练创建课程、学员查看排课
- **消息通知**：课时预警、到期提醒
- **微信分享安全**：统一转发配置 + 分享链接自动携带登录重定向参数
- **数据统计看板**：课时使用趋势、学员活跃度
- **合规功能**：用户协议、隐私政策、账号注销

## 项目截图

### 学员端

| 首页 | 课程历史 | 课时详情 |
|------|----------|----------|
| ![](./screenshots/parent-home.png) | ![](./screenshots/parent-history.png) | ![](./screenshots/parent-hours.png) |

| 通知消息 | 绑定学生 | 个人中心 |
|----------|----------|----------|
| ![](./screenshots/parent-notifications.png) | ![](./screenshots/parent-bind.png) | ![](./screenshots/parent-profile.png) |

### 教练端

| 课程列表 | 课时管理 | 消费扣减 |
|----------|----------|----------|
| ![](./screenshots/coach-classes.png) | ![](./screenshots/coach-hours.png) | ![](./screenshots/coach-deduct.png) |

| 学生管理 | 数据统计 | 通知发送 |
|----------|----------|----------|
| ![](./screenshots/coach-students.png) | ![](./screenshots/coach-stats.png) | ![](./screenshots/coach-notify.png) |

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入真实的微信小程序 AppID 和 AppSecret
```

### 2. 启动项目

使用 HBuilder X 打开项目，关联 UniCloud 阿里云服务空间，运行到微信开发者工具。

## 许可证

本项目仅用于学习与求职展示。
