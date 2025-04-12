# AINovelLab Web 版本

这是 AINovelLab 的网页版本，基于原始的 [AINovelLab](https://github.com/wb-hwang/AINovelLab) 项目开发，专为 Cloudflare Pages 部署而设计。

## 功能特点

- **EPUB分割器**：将EPUB电子书分割为单章TXT文件
- **小说脱水工具**：使用AI自动将小说内容缩减至原文的30%-50%
- **TXT合并转EPUB**：将TXT文件合并为EPUB电子书
- **网页界面**：支持文件上传和下载
- **Cloudflare Pages部署**：通过环境变量配置API

## 项目结构

```
AINovelLab-Web/
├── functions/               # Cloudflare Pages Functions
│   └── _middleware.js       # API处理中间件
├── public/                  # 静态资源目录
│   ├── css/                 # 样式文件
│   │   └── style.css        # 主样式表
│   ├── js/                  # JavaScript文件
│   │   └── main.js          # 主脚本
│   ├── _routes.json         # 路由配置
│   └── index.html           # 主页面
├── API_ENV_CONFIG.md        # API环境变量配置指南
├── README.md                # 项目说明
└── wrangler.toml            # Cloudflare Pages配置文件
```

## 部署说明

1. 克隆本仓库
2. 在 Cloudflare Dashboard 中创建一个新的 Pages 项目
3. 连接到你的 GitHub 仓库
4. 按照 [API_ENV_CONFIG.md](API_ENV_CONFIG.md) 中的说明配置环境变量和KV命名空间
5. 部署项目

## 本地开发

1. 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. 运行 `wrangler pages dev public`
3. 访问 `http://localhost:8788` 查看网页

## 环境变量配置

详细的环境变量配置说明请参阅 [API_ENV_CONFIG.md](API_ENV_CONFIG.md)。

## 许可证

本项目采用与原始 AINovelLab 项目相同的 MIT 许可证。
