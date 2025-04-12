// Cloudflare Pages Functions 配置文件
export const onRequest = async (context) => {
  // 获取请求路径
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 根据路径分发请求
  if (path.startsWith('/api/')) {
    return handleAPIRequest(path, context);
  }

  // 对于其他请求，继续正常的静态资源处理
  return context.next();
};

// 处理API请求
async function handleAPIRequest(path, context) {
  try {
    // 根据API路径处理不同的请求
    if (path === '/api/status') {
      return handleStatusRequest(context);
    } else if (path === '/api/epub-split') {
      return handleEpubSplitRequest(context);
    } else if (path === '/api/novel-condenser') {
      return handleNovelCondenserRequest(context);
    } else if (path === '/api/txt-to-epub') {
      return handleTxtToEpubRequest(context);
    } else if (path.startsWith('/api/download/')) {
      return handleDownloadRequest(path, context);
    }

    // 未找到匹配的API路径
    return new Response(JSON.stringify({ error: '未找到API端点' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API处理错误:', error);
    return new Response(JSON.stringify({ error: error.message || '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理API状态请求
async function handleStatusRequest(context) {
  // 从环境变量获取API配置
  const apiConfig = getAPIConfig(context.env);

  // 检查API配置状态
  const apiStatus = {
    apis: []
  };

  // 检查Gemini API
  if (apiConfig.gemini_api && apiConfig.gemini_api.length > 0) {
    for (const api of apiConfig.gemini_api) {
      apiStatus.apis.push({
        name: 'Gemini API',
        model: api.model || 'gemini-2.0-flash',
        active: Boolean(api.key),
      });
    }
  }

  // 检查OpenAI API
  if (apiConfig.openai_api && apiConfig.openai_api.length > 0) {
    for (const api of apiConfig.openai_api) {
      apiStatus.apis.push({
        name: 'OpenAI API',
        model: api.model || 'gpt-3.5-turbo',
        active: Boolean(api.key),
      });
    }
  }

  return new Response(JSON.stringify(apiStatus), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 处理EPUB分割请求
async function handleEpubSplitRequest(context) {
  const request = context.request;
  
  // 检查请求方法
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '方法不允许' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file');
    const pattern = formData.get('pattern') || '第[0-9一二三四五六七八九十百千]+章';

    if (!file) {
      return new Response(JSON.stringify({ error: '未提供文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成唯一的任务ID
    const taskId = generateTaskId();
    
    // 存储文件到KV存储
    const fileName = file.name;
    const fileData = await file.arrayBuffer();
    
    // 使用Cloudflare KV存储文件
    await context.env.AINOVELLAB_FILES.put(
      `uploads/${taskId}/${fileName}`, 
      fileData,
      { expirationTtl: 86400 } // 24小时过期
    );

    // 创建处理任务
    const task = {
      id: taskId,
      type: 'epub-split',
      fileName: fileName,
      pattern: pattern,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 存储任务信息
    await context.env.AINOVELLAB_TASKS.put(
      taskId, 
      JSON.stringify(task),
      { expirationTtl: 86400 } // 24小时过期
    );

    // 触发后台处理（在实际环境中，这里会调用Cloudflare Worker或其他处理服务）
    // 这里我们模拟处理已完成，实际实现需要根据Cloudflare Pages的能力进行调整
    
    // 生成下载链接
    const downloadUrl = `/api/download/${taskId}/${fileName.replace('.epub', '.zip')}`;

    return new Response(JSON.stringify({
      taskId: taskId,
      status: 'completed',
      downloadUrl: downloadUrl
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('EPUB分割处理错误:', error);
    return new Response(JSON.stringify({ error: error.message || 'EPUB分割处理失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理小说脱水请求
async function handleNovelCondenserRequest(context) {
  const request = context.request;
  
  // 检查请求方法
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '方法不允许' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析表单数据
    const formData = await request.formData();
    const files = formData.getAll('files');
    const ratio = formData.get('ratio') || '40';

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: '未提供文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取API配置
    const apiConfig = getAPIConfig(context.env);
    
    // 检查API配置
    if ((!apiConfig.gemini_api || apiConfig.gemini_api.length === 0) && 
        (!apiConfig.openai_api || apiConfig.openai_api.length === 0)) {
      return new Response(JSON.stringify({ error: '未配置API，无法进行小说脱水处理' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成唯一的任务ID
    const taskId = generateTaskId();
    
    // 存储文件到KV存储
    for (const file of files) {
      const fileName = file.name;
      const fileData = await file.arrayBuffer();
      
      // 使用Cloudflare KV存储文件
      await context.env.AINOVELLAB_FILES.put(
        `uploads/${taskId}/${fileName}`, 
        fileData,
        { expirationTtl: 86400 } // 24小时过期
      );
    }

    // 创建处理任务
    const task = {
      id: taskId,
      type: 'novel-condenser',
      fileCount: files.length,
      fileNames: files.map(file => file.name),
      ratio: ratio,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 存储任务信息
    await context.env.AINOVELLAB_TASKS.put(
      taskId, 
      JSON.stringify(task),
      { expirationTtl: 86400 } // 24小时过期
    );

    // 触发后台处理（在实际环境中，这里会调用Cloudflare Worker或其他处理服务）
    // 这里我们模拟处理已完成，实际实现需要根据Cloudflare Pages的能力进行调整
    
    // 生成下载链接
    const downloadUrl = `/api/download/${taskId}/condensed_files.zip`;

    return new Response(JSON.stringify({
      taskId: taskId,
      status: 'completed',
      downloadUrl: downloadUrl
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('小说脱水处理错误:', error);
    return new Response(JSON.stringify({ error: error.message || '小说脱水处理失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理TXT合并转EPUB请求
async function handleTxtToEpubRequest(context) {
  const request = context.request;
  
  // 检查请求方法
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '方法不允许' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析表单数据
    const formData = await request.formData();
    const files = formData.getAll('files');
    const title = formData.get('title') || '未命名小说';
    const author = formData.get('author') || '佚名';

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: '未提供文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成唯一的任务ID
    const taskId = generateTaskId();
    
    // 存储文件到KV存储
    for (const file of files) {
      const fileName = file.name;
      const fileData = await file.arrayBuffer();
      
      // 使用Cloudflare KV存储文件
      await context.env.AINOVELLAB_FILES.put(
        `uploads/${taskId}/${fileName}`, 
        fileData,
        { expirationTtl: 86400 } // 24小时过期
      );
    }

    // 创建处理任务
    const task = {
      id: taskId,
      type: 'txt-to-epub',
      fileCount: files.length,
      fileNames: files.map(file => file.name),
      title: title,
      author: author,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 存储任务信息
    await context.env.AINOVELLAB_TASKS.put(
      taskId, 
      JSON.stringify(task),
      { expirationTtl: 86400 } // 24小时过期
    );

    // 触发后台处理（在实际环境中，这里会调用Cloudflare Worker或其他处理服务）
    // 这里我们模拟处理已完成，实际实现需要根据Cloudflare Pages的能力进行调整
    
    // 生成下载链接
    const epubFileName = `${title}.epub`;
    const downloadUrl = `/api/download/${taskId}/${encodeURIComponent(epubFileName)}`;

    return new Response(JSON.stringify({
      taskId: taskId,
      status: 'completed',
      downloadUrl: downloadUrl
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('TXT合并转EPUB处理错误:', error);
    return new Response(JSON.stringify({ error: error.message || 'TXT合并转EPUB处理失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理文件下载请求
async function handleDownloadRequest(path, context) {
  try {
    // 解析路径获取任务ID和文件名
    // 格式: /api/download/{taskId}/{fileName}
    const parts = path.split('/');
    if (parts.length < 5) {
      return new Response(JSON.stringify({ error: '无效的下载路径' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const taskId = parts[3];
    const fileName = decodeURIComponent(parts.slice(4).join('/'));

    // 获取任务信息
    const taskJson = await context.env.AINOVELLAB_TASKS.get(taskId);
    if (!taskJson) {
      return new Response(JSON.stringify({ error: '任务不存在或已过期' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const task = JSON.parse(taskJson);

    // 根据任务类型获取处理后的文件
    // 在实际实现中，这里需要根据任务类型和状态返回相应的文件
    // 这里我们模拟返回一个简单的文件内容
    
    let fileContent;
    let contentType;
    
    if (fileName.endsWith('.zip')) {
      // 返回一个简单的ZIP文件（实际应用中需要真实生成ZIP文件）
      fileContent = new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      contentType = 'application/zip';
    } else if (fileName.endsWith('.epub')) {
      // 返回一个简单的EPUB文件（实际应用中需要真实生成EPUB文件）
      fileContent = new Uint8Array([80, 75, 3, 4, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      contentType = 'application/epub+zip';
    } else {
      // 返回一个简单的文本文件
      fileContent = new TextEncoder().encode(`这是任务 ${taskId} 的处理结果文件 ${fileName}`);
      contentType = 'text/plain';
    }

    // 返回文件
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('文件下载处理错误:', error);
    return new Response(JSON.stringify({ error: error.message || '文件下载失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 从环境变量获取API配置
function getAPIConfig(env) {
  const config = {
    gemini_api: [],
    openai_api: [],
    max_rpm: 20
  };

  // 获取Gemini API配置
  const geminiApiKeys = env.GEMINI_API_KEYS || '';
  const geminiApiModels = env.GEMINI_API_MODELS || '';
  const geminiApiRpms = env.GEMINI_API_RPMS || '';

  if (geminiApiKeys) {
    const keys = geminiApiKeys.split(',');
    const models = geminiApiModels ? geminiApiModels.split(',') : [];
    const rpms = geminiApiRpms ? geminiApiRpms.split(',').map(Number) : [];

    for (let i = 0; i < keys.length; i++) {
      config.gemini_api.push({
        key: keys[i].trim(),
        model: (models[i] || 'gemini-2.0-flash').trim(),
        rpm: rpms[i] || 5
      });
    }
  }

  // 获取OpenAI API配置
  const openaiApiKeys = env.OPENAI_API_KEYS || '';
  const openaiApiModels = env.OPENAI_API_MODELS || '';
  const openaiApiRpms = env.OPENAI_API_RPMS || '';

  if (openaiApiKeys) {
    const keys = openaiApiKeys.split(',');
    const models = openaiApiModels ? openaiApiModels.split(',') : [];
    const rpms = openaiApiRpms ? openaiApiRpms.split(',').map(Number) : [];

    for (let i = 0; i < keys.length; i++) {
      config.openai_api.push({
        key: keys[i].trim(),
        model: (models[i] || 'gpt-3.5-turbo').trim(),
        rpm: rpms[i] || 3
      });
    }
  }

  // 获取最大RPM
  if (env.MAX_RPM) {
    config.max_rpm = parseInt(env.MAX_RPM, 10) || 20;
  }

  return config;
}

// 生成唯一的任务ID
function generateTaskId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}
