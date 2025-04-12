# AINovelLab Cloudflare Pages 环境变量配置指南

本文档提供了在 Cloudflare Pages 上部署 AINovelLab 网页版所需的环境变量配置说明。

## 必要的 KV 命名空间

在部署前，需要在 Cloudflare Dashboard 中创建两个 KV 命名空间：

1. **AINOVELLAB_FILES** - 用于存储上传和处理后的文件
2. **AINOVELLAB_TASKS** - 用于存储任务信息和状态

## 环境变量配置

AINovelLab 网页版使用以下环境变量来配置 AI API：

### Gemini API 配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `GEMINI_API_KEYS` | Gemini API 密钥，多个密钥用逗号分隔 | `key1,key2,key3` |
| `GEMINI_API_MODELS` | 对应的模型名称，多个模型用逗号分隔 | `gemini-2.0-flash,gemini-2.0-pro,gemini-2.0-flash` |
| `GEMINI_API_RPMS` | 对应的每分钟请求数限制，多个值用逗号分隔 | `5,3,5` |

### OpenAI API 配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `OPENAI_API_KEYS` | OpenAI API 密钥，多个密钥用逗号分隔 | `key1,key2,key3` |
| `OPENAI_API_MODELS` | 对应的模型名称，多个模型用逗号分隔 | `gpt-3.5-turbo,gpt-4,gpt-3.5-turbo` |
| `OPENAI_API_RPMS` | 对应的每分钟请求数限制，多个值用逗号分隔 | `3,1,3` |

### 全局配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `MAX_RPM` | 总体每分钟请求数限制 | `20` |

## 在 Cloudflare Dashboard 中设置环境变量

1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目设置
3. 点击 "Settings" > "Environment variables"
4. 添加上述环境变量及其值
5. 选择应用环境（Production 和/或 Preview）
6. 点击 "Save" 保存设置

## 在 Cloudflare Dashboard 中设置 KV 命名空间

1. 登录 Cloudflare Dashboard
2. 进入 "Workers & Pages" > "KV"
3. 点击 "Create namespace"
4. 创建 `AINOVELLAB_FILES` 和 `AINOVELLAB_TASKS` 两个命名空间
5. 记下每个命名空间的 ID
6. 进入 Pages 项目设置 > "Settings" > "Functions" > "KV namespace bindings"
7. 添加以下绑定：
   - 变量名：`AINOVELLAB_FILES`，KV 命名空间：选择对应的命名空间
   - 变量名：`AINOVELLAB_TASKS`，KV 命名空间：选择对应的命名空间
8. 点击 "Save" 保存设置

## API 密钥获取方法

### Gemini API

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账号
3. 创建 API 密钥
4. 复制 API 密钥并添加到环境变量中

### OpenAI API

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录 OpenAI 账号
3. 创建新的 API 密钥
4. 复制 API 密钥并添加到环境变量中

## 注意事项

- 环境变量中的 API 密钥数量、模型名称和 RPM 限制必须一一对应
- 如果只使用一种 API，可以只配置对应的环境变量
- 建议至少配置一个 API 密钥，否则小说脱水功能将无法使用
- 在生产环境中，请确保 API 密钥的安全性，不要在客户端代码中暴露密钥
