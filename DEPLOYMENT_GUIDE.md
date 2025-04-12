# AINovelLab 网页版部署指南

本指南将帮助您将 AINovelLab 网页版部署到 Cloudflare Pages。

## 部署步骤

### 1. 准备工作

- 确保您拥有 Cloudflare 账号
- 确保您拥有 GitHub 账号
- 将 AINovelLab-Web 项目推送到您的 GitHub 仓库

### 2. 在 Cloudflare Dashboard 中创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧导航栏中选择 "Workers & Pages"
3. 点击 "Create application" 按钮
4. 选择 "Pages" 选项卡
5. 点击 "Connect to Git" 按钮
6. 授权 Cloudflare 访问您的 GitHub 账号
7. 选择包含 AINovelLab-Web 的仓库
8. 点击 "Begin setup" 按钮

### 3. 配置构建设置

在 "Set up builds and deployments" 页面中：

1. **项目名称**：输入您想要的项目名称，例如 "ainovellab"
2. **生产分支**：选择您的主分支，通常是 "main" 或 "master"
3. **构建设置**：
   - **框架预设**：选择 "None"
   - **构建命令**：留空
   - **构建输出目录**：输入 "public"
4. 点击 "Save and Deploy" 按钮

### 4. 创建 KV 命名空间

1. 在 Cloudflare Dashboard 中，导航到 "Workers & Pages" > "KV"
2. 点击 "Create namespace" 按钮
3. 创建两个命名空间：
   - `AINOVELLAB_FILES` - 用于存储上传和处理后的文件
   - `AINOVELLAB_TASKS` - 用于存储任务信息
4. 记下每个命名空间的 ID，稍后会用到

### 5. 配置 KV 命名空间绑定

1. 在 Cloudflare Dashboard 中，导航到您的 Pages 项目
2. 点击 "Settings" > "Functions"
3. 在 "KV namespace bindings" 部分，点击 "Add binding" 按钮
4. 添加以下绑定：
   - **变量名**：`AINOVELLAB_FILES`，**KV 命名空间**：选择 AINOVELLAB_FILES 命名空间
   - **变量名**：`AINOVELLAB_TASKS`，**KV 命名空间**：选择 AINOVELLAB_TASKS 命名空间
5. 点击 "Save" 按钮

### 6. 配置环境变量

1. 在 Cloudflare Dashboard 中，导航到您的 Pages 项目
2. 点击 "Settings" > "Environment variables"
3. 添加以下环境变量（根据您的 API 配置）：

#### Gemini API 配置（如果使用）
- **变量名**：`GEMINI_API_KEYS`，**值**：您的 Gemini API 密钥，多个密钥用逗号分隔
- **变量名**：`GEMINI_API_MODELS`，**值**：对应的模型名称，多个模型用逗号分隔
- **变量名**：`GEMINI_API_RPMS`，**值**：对应的每分钟请求数限制，多个值用逗号分隔

#### OpenAI API 配置（如果使用）
- **变量名**：`OPENAI_API_KEYS`，**值**：您的 OpenAI API 密钥，多个密钥用逗号分隔
- **变量名**：`OPENAI_API_MODELS`，**值**：对应的模型名称，多个模型用逗号分隔
- **变量名**：`OPENAI_API_RPMS`，**值**：对应的每分钟请求数限制，多个值用逗号分隔

#### 全局配置
- **变量名**：`MAX_RPM`，**值**：总体每分钟请求数限制，例如 "20"

4. 确保选择了正确的环境（Production 和/或 Preview）
5. 点击 "Save" 按钮

### 7. 重新部署项目

1. 在 Cloudflare Dashboard 中，导航到您的 Pages 项目
2. 点击 "Deployments" 选项卡
3. 点击 "Retry deployment" 按钮，应用新的配置

### 8. 访问您的网站

部署完成后，您可以通过以下 URL 访问您的 AINovelLab 网页版：

```
https://[项目名称].pages.dev
```

例如，如果您的项目名称是 "ainovellab"，则 URL 为：

```
https://ainovellab.pages.dev
```

## 故障排除

### 文件上传/下载问题

- 确保 KV 命名空间已正确配置
- 检查浏览器控制台是否有错误信息
- 验证 API 路由是否正确配置

### API 连接问题

- 确保环境变量已正确设置
- 验证 API 密钥是否有效
- 检查 API 请求限制是否已达到

### 部署失败

- 检查构建日志中的错误信息
- 确保项目结构符合 Cloudflare Pages 的要求
- 验证 wrangler.toml 文件是否正确配置

## 更新部署

要更新您的部署，只需将更改推送到 GitHub 仓库的主分支。Cloudflare Pages 将自动检测更改并重新部署您的网站。

## 自定义域名（可选）

如果您想使用自定义域名，可以按照以下步骤操作：

1. 在 Cloudflare Dashboard 中，导航到您的 Pages 项目
2. 点击 "Custom domains" 选项卡
3. 点击 "Set up a custom domain" 按钮
4. 输入您的域名并按照提示完成设置

## 注意事项

- Cloudflare Pages 的免费计划有一定的限制，包括带宽和请求数
- KV 存储也有容量限制，请确保您的使用量在限制范围内
- API 密钥应保持安全，不要在客户端代码中暴露
- 定期检查 API 使用情况，避免超出配额
