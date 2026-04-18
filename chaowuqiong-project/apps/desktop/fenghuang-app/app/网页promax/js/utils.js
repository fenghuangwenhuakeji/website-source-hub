// 文件路径: 网页promax/js/utils.js
// 描述: 提供通用的辅助函数，如文件处理等。

/**
 * 初始化附件按钮，用于文件和图片上传。
 */
function initializeAttachmentButton() {
    const attachmentBtn = document.getElementById('attachment-btn');
    if(attachmentBtn) {
        attachmentBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = "image/*,text/plain,.md,.txt"; // 接受图片和文本文件
            fileInput.style.display = 'none';
            fileInput.addEventListener('change', handleFileUpload);
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });
    }
}

/**
 * 处理文件上传事件。
 * @param {Event} event - 文件输入框的change事件。
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileName = file.name;
        const fileContent = e.target.result;
        
        if (file.type.startsWith('image/')) {
            // 对于图片，显示预览并添加到输入框
            addMessageToHistory('user', `[用户上传了图片: ${fileName}]<br><img src="${fileContent}" alt="Uploaded Image" style="max-width: 200px; border-radius: 8px;">`, null, true);
            document.getElementById('message-input').value += `\n[已上传图片: ${fileName}] `;
            showNotification(`图片 "${fileName}" 已上传。`, 'success');
        } else {
            // 对于文本文件，将内容作为可折叠消息添加到聊天记录
            const escapedContent = fileContent.replace(/</g, "<").replace(/>/g, ">");
            const fileDetailsHtml = `
                <details class="uploaded-file-details">
                    <summary>已上传文件: ${fileName}</summary>
                    <pre><code>${escapedContent}</code></pre>
                </details>
            `;
            addMessageToHistory('user', fileDetailsHtml, null, true);
            document.getElementById('message-input').value = `请根据我上传的文件“${fileName}”执行以下操作：`;
            showNotification(`文件 "${fileName}" 内容已作为消息发送。`, 'success');
        }
        
        document.getElementById('message-input').dispatchEvent(new Event('input')); // 调整文本域高度
    };

    reader.onerror = function() {
        showNotification(`读取文件 "${file.name}" 时出错。`, 'error');
    };

    if (file.type.startsWith('image/') || file.type.startsWith('text/') || file.name.endsWith('.md')) {
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    } else {
        showNotification(`不支持的文件类型: ${file.type}`, 'warning');
    }
}