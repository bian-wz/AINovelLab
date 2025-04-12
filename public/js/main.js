// AINovelLab Web 主脚本
document.addEventListener('DOMContentLoaded', function() {
    // 初始化UI组件
    initUI();
    
    // 绑定表单提交事件
    bindFormSubmitEvents();
    
    // 检查API状态
    checkAPIStatus();
    
    // 初始化任务列表
    initTaskList();
});

// 初始化UI组件
function initUI() {
    // 压缩比例滑块值显示
    const compressionRatio = document.getElementById('compression-ratio');
    const compressionRatioValue = document.getElementById('compression-ratio-value');
    
    if (compressionRatio && compressionRatioValue) {
        compressionRatio.addEventListener('input', function() {
            compressionRatioValue.textContent = this.value + '%';
        });
    }
    
    // 初始化文件上传区域的拖放功能
    initDragAndDrop();
}

// 初始化拖放上传功能
function initDragAndDrop() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        const form = input.closest('form');
        
        if (form) {
            // 创建拖放区域
            const dropArea = document.createElement('div');
            dropArea.className = 'file-upload-area';
            dropArea.innerHTML = '<i class="bi bi-cloud-arrow-up fs-3"></i><p>拖放文件到此处或点击选择文件</p>';
            
            // 在input前插入拖放区域
            input.parentNode.insertBefore(dropArea, input);
            
            // 隐藏原始input
            input.style.display = 'none';
            
            // 点击拖放区域触发文件选择
            dropArea.addEventListener('click', () => {
                input.click();
            });
            
            // 文件拖放事件
            dropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropArea.classList.add('dragover');
            });
            
            dropArea.addEventListener('dragleave', () => {
                dropArea.classList.remove('dragover');
            });
            
            dropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dropArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length) {
                    input.files = e.dataTransfer.files;
                    updateFileList(input, dropArea);
                }
            });
            
            // 监听文件选择变化
            input.addEventListener('change', () => {
                updateFileList(input, dropArea);
            });
        }
    });
}

// 更新文件列表显示
function updateFileList(input, dropArea) {
    // 移除旧的文件列表
    const oldFileList = dropArea.nextElementSibling;
    if (oldFileList && oldFileList.classList.contains('file-list')) {
        oldFileList.remove();
    }
    
    if (input.files.length) {
        // 创建新的文件列表
        const fileList = document.createElement('div');
        fileList.className = 'file-list';
        
        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            
            const fileRemove = document.createElement('div');
            fileRemove.className = 'file-remove';
            fileRemove.innerHTML = '<i class="bi bi-x-circle"></i>';
            fileRemove.addEventListener('click', () => {
                // 由于无法直接修改FileList，需要重置input
                if (input.multiple) {
                    // 对于多文件上传，需要创建一个新的FileList（通过DataTransfer）
                    const dt = new DataTransfer();
                    for (let j = 0; j < input.files.length; j++) {
                        if (j !== i) {
                            dt.items.add(input.files[j]);
                        }
                    }
                    input.files = dt.files;
                } else {
                    // 对于单文件上传，直接重置
                    input.value = '';
                }
                
                // 更新文件列表
                updateFileList(input, dropArea);
            });
            
            fileItem.appendChild(fileName);
            fileItem.appendChild(fileSize);
            fileItem.appendChild(fileRemove);
            fileList.appendChild(fileItem);
        }
        
        // 插入文件列表
        dropArea.parentNode.insertBefore(fileList, dropArea.nextSibling);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 绑定表单提交事件
function bindFormSubmitEvents() {
    // EPUB分割器表单
    const epubSplitForm = document.getElementById('epub-split-form');
    if (epubSplitForm) {
        epubSplitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processEpubSplit();
        });
    }
    
    // 小说脱水工具表单
    const novelCondenserForm = document.getElementById('novel-condenser-form');
    if (novelCondenserForm) {
        novelCondenserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processNovelCondenser();
        });
    }
    
    // TXT合并转EPUB表单
    const txtToEpubForm = document.getElementById('txt-to-epub-form');
    if (txtToEpubForm) {
        txtToEpubForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processTxtToEpub();
        });
    }
}

// 处理EPUB分割
function processEpubSplit() {
    const epubFile = document.getElementById('epub-file').files[0];
    const splitPattern = document.getElementById('split-pattern').value;
    
    if (!epubFile) {
        showAlert('请选择EPUB文件', 'danger');
        return;
    }
    
    // 显示进度条
    const progressContainer = document.getElementById('epub-split-progress-container');
    const progressBar = document.getElementById('epub-split-progress');
    progressContainer.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    
    // 创建任务
    const taskId = addTask('EPUB分割', epubFile.name, 'processing');
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', epubFile);
    formData.append('pattern', splitPattern);
    
    // 发送请求
    fetch('/api/epub-split', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        return response.json();
    })
    .then(data => {
        // 更新进度条为100%
        progressBar.style.width = '100%';
        progressBar.setAttribute('aria-valuenow', 100);
        
        // 显示结果
        const resultContainer = document.getElementById('epub-split-result');
        resultContainer.classList.remove('d-none');
        
        // 设置下载链接
        const downloadButton = document.getElementById('epub-split-download');
        downloadButton.href = data.downloadUrl;
        
        // 更新任务状态
        updateTask(taskId, 'completed', '处理完成');
        
        showAlert('EPUB分割完成！', 'success');
    })
    .catch(error => {
        console.error('处理错误:', error);
        
        // 隐藏进度条
        progressContainer.classList.add('d-none');
        
        // 更新任务状态
        updateTask(taskId, 'error', error.message);
        
        showAlert('处理失败: ' + error.message, 'danger');
    });
}

// 处理小说脱水
function processNovelCondenser() {
    const txtFiles = document.getElementById('txt-files').files;
    const compressionRatio = document.getElementById('compression-ratio').value;
    
    if (txtFiles.length === 0) {
        showAlert('请选择TXT文件', 'danger');
        return;
    }
    
    // 显示进度条
    const progressContainer = document.getElementById('novel-condenser-progress-container');
    const progressBar = document.getElementById('novel-condenser-progress');
    progressContainer.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    
    // 创建任务
    const taskId = addTask('小说脱水', txtFiles.length + '个文件', 'processing');
    
    // 创建FormData
    const formData = new FormData();
    for (let i = 0; i < txtFiles.length; i++) {
        formData.append('files', txtFiles[i]);
    }
    formData.append('ratio', compressionRatio);
    
    // 发送请求
    fetch('/api/novel-condenser', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        return response.json();
    })
    .then(data => {
        // 更新进度条为100%
        progressBar.style.width = '100%';
        progressBar.setAttribute('aria-valuenow', 100);
        
        // 显示结果
        const resultContainer = document.getElementById('novel-condenser-result');
        resultContainer.classList.remove('d-none');
        
        // 设置下载链接
        const downloadButton = document.getElementById('novel-condenser-download');
        downloadButton.href = data.downloadUrl;
        
        // 更新任务状态
        updateTask(taskId, 'completed', '处理完成');
        
        showAlert('小说脱水完成！', 'success');
    })
    .catch(error => {
        console.error('处理错误:', error);
        
        // 隐藏进度条
        progressContainer.classList.add('d-none');
        
        // 更新任务状态
        updateTask(taskId, 'error', error.message);
        
        showAlert('处理失败: ' + error.message, 'danger');
    });
}

// 处理TXT合并转EPUB
function processTxtToEpub() {
    const txtFiles = document.getElementById('txt-files-merge').files;
    const bookTitle = document.getElementById('book-title').value;
    const bookAuthor = document.getElementById('book-author').value;
    
    if (txtFiles.length === 0) {
        showAlert('请选择TXT文件', 'danger');
        return;
    }
    
    // 显示进度条
    const progressContainer = document.getElementById('txt-to-epub-progress-container');
    const progressBar = document.getElementById('txt-to-epub-progress');
    progressContainer.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    
    // 创建任务
    const taskId = addTask('TXT转EPUB', txtFiles.length + '个文件', 'processing');
    
    // 创建FormData
    const formData = new FormData();
    for (let i = 0; i < txtFiles.length; i++) {
        formData.append('files', txtFiles[i]);
    }
    formData.append('title', bookTitle);
    formData.append('author', bookAuthor);
    
    // 发送请求
    fetch('/api/txt-to-epub', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        return response.json();
    })
    .then(data => {
        // 更新进度条为100%
        progressBar.style.width = '100%';
        progressBar.setAttribute('aria-valuenow', 100);
        
        // 显示结果
        const resultContainer = document.getElementById('txt-to-epub-result');
        resultContainer.classList.remove('d-none');
        
        // 设置下载链接
        const downloadButton = document.getElementById('txt-to-epub-download');
        downloadButton.href = data.downloadUrl;
        
        // 更新任务状态
        updateTask(taskId, 'completed', '处理完成');
        
        showAlert('TXT合并转EPUB完成！', 'success');
    })
    .catch(error => {
        console.error('处理错误:', error);
        
        // 隐藏进度条
        progressContainer.classList.add('d-none');
        
        // 更新任务状态
        updateTask(taskId, 'error', error.message);
        
        showAlert('处理失败: ' + error.message, 'danger');
    });
}

// 检查API状态
function checkAPIStatus() {
    const apiStatus = document.getElementById('api-status');
    
    if (apiStatus) {
        fetch('/api/status')
        .then(response => {
            if (!response.ok) {
                throw new Error('服务器响应错误');
            }
            return response.json();
        })
        .then(data => {
            let statusHtml = '';
            
            if (data.apis && data.apis.length > 0) {
                statusHtml = '<ul class="list-group">';
                
                data.apis.forEach(api => {
                    const statusClass = api.active ? 'active' : 'inactive';
                    statusHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span class="api-status-indicator ${statusClass}"></span>
                                ${api.name} (${api.model})
                            </div>
                            <span class="badge bg-${api.active ? 'success' : 'danger'} rounded-pill">
                                ${api.active ? '可用' : '不可用'}
                            </span>
                        </li>
                    `;
                });
                
                statusHtml += '</ul>';
            } else {
                statusHtml = '<div class="alert alert-warning">未配置API或API配置不可用</div>';
            }
            
            apiStatus.innerHTML = statusHtml;
        })
        .catch(error => {
            console.error('API状态检查错误:', error);
            apiStatus.innerHTML = `<div class="alert alert-danger">API状态检查失败: ${error.message}</div>`;
        });
    }
}

// 初始化任务列表
function initTaskList() {
    const taskList = document.getElementById('task-list');
    
    if (taskList) {
        // 从本地存储加载任务
        const tasks = JSON.parse(localStorage.getItem('ainovellab_tasks') || '[]');
        
        if (tasks.length > 0) {
            let tasksHtml = '';
            
            tasks.forEach(task => {
                tasksHtml += createTaskItemHtml(task);
            });
            
            taskList.innerHTML = tasksHtml;
        } else {
            taskList.innerHTML = '<p>暂无任务</p>';
        }
    }
}

// 添加任务
function addTask(type, name, status) {
    const taskList = document.getElementById('task-list');
    
    if (!taskList) return null;
    
    // 生成任务ID
    const taskId = 'task_' + Date.now();
    
    // 创建任务对象
    const task = {
        id: taskId,
        type: type,
        name: name,
        status: status,
        message: '处理中...',
        createdAt: new Date().toISOString()
    };
    
    // 添加到本地存储
    const tasks = JSON.parse(localStorage.getItem('ainovellab_tasks') || '[]');
    tasks.unshift(task);
    localStorage.setItem('ainovellab_tasks', JSON.stringify(tasks.slice(0, 10))); // 只保留最近10个任务
    
    // 更新UI
    if (taskList.innerHTML === '<p>暂无任务</p>') {
        taskList.innerHTML = '';
    }
    
    const taskItemHtml = createTaskItemHtml(task);
    taskList.insertAdjacentHTML('afterbegin', taskItemHtml);
    
    return taskId;
}

// 更新任务状态
function updateTask(taskId, status, message) {
    if (!taskId) return;
    
    // 更新本地存储
    const tasks = JSON.parse(localStorage.getItem('ainovellab_tasks') || '[]');
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = status;
        tasks[taskIndex].message = message || tasks[taskIndex].message;
        localStorage.setItem('ainovellab_tasks', JSON.stringify(tasks));
        
        // 更新UI
        const taskItem = document.getElementById(taskId);
        if (taskItem) {
            const statusElement = taskItem.querySelector('.task-status');
            const messageElement = taskItem.querySelector('.task-message');
            
            if (statusElement) {
                statusElement.textContent = getStatusText(status);
                statusElement.className = 'task-status ' + getStatusClass(status);
            }
            
            if (messageElement && message) {
                messageElement.textContent = message;
            }
            
            // 更新任务项类名
            taskItem.className = 'task-item ' + status;
            
            // 如果是完成或错误状态，隐藏进度条
            const progressElement = taskItem.querySelector('.task-progress');
            if (progressElement && (status === 'completed' || status === 'error')) {
                progressElement.style.display = 'none';
            }
        }
    }
}

// 创建任务项HTML
function createTaskItemHtml(task) {
    return `
        <div id="${task.id}" class="task-item ${task.status}">
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${task.type}:</strong> ${task.name}
                </div>
                <span class="task-status ${getStatusClass(task.status)}">${getStatusText(task.status)}</span>
            </div>
            <div class="task-message">${task.message}</div>
            <div class="progress task-progress" ${task.status === 'completed' || task.status === 'error' ? 'style="display:none"' : ''}>
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
            </div>
            <div class="text-muted small mt-1">
                ${new Date(task.createdAt).toLocaleString()}
            </div>
        </div>
    `;
}

// 获取状态文本
function getStatusText(status) {
    switch (status) {
        case 'processing': return '处理中';
        case 'completed': return '已完成';
        case 'error': return '错误';
        default: return status;
    }
}

// 获取状态类名
function getStatusClass(status) {
    switch (status) {
        case 'processing': return 'text-primary';
        case 'completed': return 'text-success';
        case 'error': return 'text-danger';
        default: return '';
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertContainer.style.zIndex = '9999';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // 5秒后自动关闭
    setTimeout(() => {
        alertContainer.classList.remove('show');
        setTimeout(() => {
            alertContainer.remove();
        }, 150);
    }, 5000);
}
