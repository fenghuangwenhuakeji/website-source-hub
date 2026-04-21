/**
 * UI 组件库 - 基于 Tailwind CSS 实现年龄自适应
 */

export const UI = {
    // 按钮组件
    Button: (text, onClick, variant = 'primary') => {
        const theme = document.documentElement.getAttribute('data-theme') || 'adult';
        
        // 基础类
        let classes = 'transition-all duration-300 flex items-center justify-center cursor-pointer ';
        
        // 主题特定类
        if (theme === 'child') {
            classes += 'rounded-[24px] font-comic shadow-[0_4px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] px-6 py-3 text-lg font-bold ';
            classes += variant === 'primary' ? 'bg-primary text-white hover:brightness-110' : 'bg-white text-primary border-4 border-primary';
        } else if (theme === 'teen') {
            classes += 'rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 px-5 py-2.5 ';
            classes += variant === 'primary' ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-white text-primary border border-primary';
        } else {
            // Adult
            classes += 'rounded text-sm tracking-wide px-4 py-2 hover:bg-opacity-90 ';
            classes += variant === 'primary' ? 'bg-primary text-white shadow-sm' : 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50';
        }

        return `<button class="${classes}" onclick="${onClick}">${text}</button>`;
    },

    // 卡片组件
    Card: (title, content, icon = '') => {
        const theme = document.documentElement.getAttribute('data-theme') || 'adult';
        
        let containerClass = 'w-full mb-4 overflow-hidden transition-all duration-300 ';
        let headerClass = 'flex items-center ';
        let bodyClass = '';

        if (theme === 'child') {
            containerClass += 'bg-white rounded-[32px] border-4 border-secondary shadow-xl p-6';
            headerClass += 'text-2xl font-bold text-primary mb-4 justify-center';
            bodyClass += 'text-lg text-gray-700 leading-relaxed text-center font-comic';
        } else if (theme === 'teen') {
            containerClass += 'bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-5';
            headerClass += 'text-lg font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2';
            bodyClass += 'text-gray-600';
        } else {
            containerClass += 'bg-white rounded border border-gray-200 shadow-sm p-6 hover:shadow-md';
            headerClass += 'text-base font-medium text-gray-900 mb-4';
            bodyClass += 'text-sm text-gray-500 leading-relaxed';
        }

        return `
            <div class="${containerClass}">
                <div class="${headerClass}">
                    ${icon ? `<span class="mr-2 text-2xl">${icon}</span>` : ''}
                    ${title}
                </div>
                <div class="${bodyClass}">
                    ${content}
                </div>
            </div>
        `;
    },

    // 消息气泡组件
    MessageBubble: (text, isUser = false) => {
        const theme = document.documentElement.getAttribute('data-theme') || 'adult';
        
        let wrapperClass = `flex w-full mt-4 ${isUser ? 'justify-end' : 'justify-start'}`;
        let bubbleClass = 'max-w-[80%] relative ';

        if (theme === 'child') {
            bubbleClass += 'p-4 text-lg font-comic rounded-[20px] ';
            if (isUser) {
                bubbleClass += 'bg-primary text-white rounded-tr-none shadow-md';
            } else {
                bubbleClass += 'bg-white border-4 border-secondary text-gray-800 rounded-tl-none shadow-md';
            }
        } else if (theme === 'teen') {
            bubbleClass += 'px-4 py-2 rounded-2xl text-sm shadow-sm ';
            if (isUser) {
                bubbleClass += 'bg-gradient-to-br from-primary to-blue-500 text-white rounded-br-none';
            } else {
                bubbleClass += 'bg-gray-100 text-gray-800 rounded-bl-none';
            }
        } else {
            bubbleClass += 'px-4 py-3 rounded text-sm leading-relaxed ';
            if (isUser) {
                bubbleClass += 'bg-primary text-white';
            } else {
                bubbleClass += 'bg-gray-100 text-gray-900';
            }
        }

        return `
            <div class="${wrapperClass}">
                <div class="${bubbleClass}">
                    ${text}
                </div>
            </div>
        `;
    }
};
