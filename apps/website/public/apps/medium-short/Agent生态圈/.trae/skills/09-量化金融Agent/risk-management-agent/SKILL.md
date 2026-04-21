---
name: "risk-management-agent"
description: "Ultimate risk management expert with VaR, CVaR, stress testing, and portfolio risk analytics. Provides complete solutions for quantitative risk control and capital preservation."
---

# Risk Management Agent - 风险管理专家

## 核心理念

**风险即成本，控制即收益。在不确定性中，守护资本的安全。**

Risk Management Agent 是专业级风险管理助手，提供从风险度量到压力测试的完整风险管理解决方案，帮助量化团队控制回撤、保护资本。

## 核心工作流程

```
风险识别 → 风险度量 → 风险限额 → 监控预警 → 压力测试 → 应急预案
```

## 风险度量模型

### VaR模型

```python
import numpy as np
import pandas as pd
from scipy import stats

class RiskMetrics:
    """风险度量计算器"""
    
    @staticmethod
    def var_historical(returns, confidence=0.95):
        """历史模拟法VaR"""
        return np.percentile(returns, (1 - confidence) * 100)
    
    @staticmethod
    def var_parametric(returns, confidence=0.95):
        """参数法VaR（正态分布假设）"""
        mean = returns.mean()
        std = returns.std()
        z_score = stats.norm.ppf(1 - confidence)
        return mean + z_score * std
    
    @staticmethod
    def var_monte_carlo(returns, confidence=0.95, simulations=10000):
        """蒙特卡洛模拟VaR"""
        mean = returns.mean()
        std = returns.std()
        simulated = np.random.normal(mean, std, simulations)
        return np.percentile(simulated, (1 - confidence) * 100)
    
    @staticmethod
    def cvar(returns, confidence=0.95):
        """条件VaR（CVaR/Expected Shortfall）"""
        var = RiskMetrics.var_historical(returns, confidence)
        return returns[returns <= var].mean()
```

### 风险限额系统

```python
class RiskLimits:
    """风险限额管理"""
    
    def __init__(self):
        self.limits = {
            'max_drawdown': 0.20,      # 最大回撤20%
            'daily_var_limit': 0.02,    # 日VaR限额2%
            'position_limit': 0.30,     # 单仓位限额30%
            'sector_limit': 0.50,       # 行业集中度50%
            'leverage_limit': 2.0       # 杠杆上限2倍
        }
        self.current_risk = {}
    
    def check_limits(self, portfolio):
        """检查风险限额"""
        violations = []
        
        # 检查回撤
        if portfolio['drawdown'] > self.limits['max_drawdown']:
            violations.append(f"回撤超限: {portfolio['drawdown']:.2%}")
        
        # 检查仓位
        for symbol, weight in portfolio['positions'].items():
            if weight > self.limits['position_limit']:
                violations.append(f"{symbol}仓位超限: {weight:.2%}")
        
        return len(violations) == 0, violations
    
    def calculate_position_limit(self, capital, volatility, target_risk=0.02):
        """基于波动率的仓位限制"""
        return capital * target_risk / volatility
```

## 压力测试

```python
class StressTest:
    """压力测试框架"""
    
    def __init__(self, portfolio):
        self.portfolio = portfolio
        self.scenarios = {
            '2008_crisis': {'equity': -0.40, 'bond': 0.10},
            '2020_covid': {'equity': -0.35, 'bond': 0.05},
            'rate_hike': {'equity': -0.15, 'bond': -0.10},
            'inflation': {'equity': -0.20, 'commodity': 0.30}
        }
    
    def run_stress_test(self):
        """执行压力测试"""
        results = {}
        
        for scenario_name, shocks in self.scenarios.items():
            pnl = 0
            for asset, weight in self.portfolio.items():
                shock = shocks.get(asset, 0)
                pnl += weight * shock
            
            results[scenario_name] = {
                'pnl': pnl,
                'new_value': self.portfolio['total'] * (1 + pnl)
            }
        
        return results
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要计算VaR/CVaR
- 需要设置风险限额
- 需要压力测试
- 需要风险监控

## 输出保证

- [ ] 风险度量报告
- [ ] 风险限额配置
- [ ] 压力测试结果
- [ ] 风险监控方案

---

**记住：活下来，才能活得更好！**
