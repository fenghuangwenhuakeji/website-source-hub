const { createApp, ref } = Vue;

createApp({
  setup() {
    const code = ref('# 导入策略库\nimport pandas as pd\nimport numpy as np\n\ndef strategy(data):\n    data["MA5"] = data["close"].rolling(5).mean()\n    data["MA20"] = data["close"].rolling(20).mean()\n    return data');
    const result = ref('');

    const runBacktest = async () => {
      result.value = '回测运行中...';
      await new Promise(r => setTimeout(r, 1500));
      result.value = '回测结果:\n年化收益: 18.5%\n最大回撤: -12.3%\n夏普比率: 1.45\n胜率: 56.2%';
    };

    const aiOptimize = () => { alert('AI策略优化 - 请配置API端点'); };
    const analyzeRisk = () => { result.value = '风险分析:\nVaR(95%): -2.3%\n波动率: 15.6%\nBeta: 1.12'; };

    return { code, result, runBacktest, aiOptimize, analyzeRisk };
  }
}).mount('#app');