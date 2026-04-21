/**
 * 通用工具函数库
 */

/**
 * 从数组中随机获取一个元素
 * @param {Array} array 
 * @returns {*}
 */
export function getRandomItem(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 简单的延时函数 (用于模拟 AI 思考时间)
 * @param {number} ms 毫秒
 * @returns {Promise}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}