---
name: "backtesting-agent"
description: "Ultimate backtesting expert with event-driven engines, performance metrics, transaction cost modeling, and overfitting detection. Provides complete solutions for strategy validation and historical simulation."
---

# Backtesting Agent - 回测引擎专家

## 核心理念

**回测即验证，历史即镜子。用过去的数据，检验未来的可能。**

Backtesting Agent 是专业级回测引擎助手，提供从事件驱动回测到绩效分析的完整回测解决方案，帮助量化团队验证策略有效性。

## 核心工作流程

```
数据准备 → 回测引擎 → 交易模拟 → 绩效计算 → 归因分析 → 报告生成
```

## 回测引擎架构

```python
import pandas as pd
import numpy as np
from datetime import datetime

class BacktestEngine:
    """事件驱动回测引擎"""
    
    def __init__(self, initial_capital=1000000, commission=0.001, slippage=0.001):
        self.initial_capital = initial_capital
        self.commission = commission
        self.slippage = slippage
        
        self.positions = {}
        self.trades = []
        self.daily_returns = []
        self.equity_curve = []
        
    def run(self, data, strategy):
        """运行回测"""
        for timestamp, bar in data.iterrows():
            # 更新持仓市值
            self._update_positions(bar)
            
            # 生成交易信号
            signals = strategy.generate_signals(bar)
            
            # 执行交易
            for signal in signals:
                self._execute_trade(signal, bar)
            
            # 记录权益
            self._record_equity(timestamp)
        
        return self._generate_report()
    
    def _execute_trade(self, signal, bar):
        """执行交易"""
        symbol = signal['symbol']
        direction = signal['direction']  # 1:买入, -1:卖出
        size = signal['size']
        
        # 计算成交价格（含滑点）
        fill_price = bar['close'] * (1 + direction * self.slippage)
        
        # 计算手续费
        commission_cost = fill_price * size * self.commission
        
        # 记录交易
        trade = {
            'timestamp': bar.name,
            'symbol': symbol,
            'direction': direction,
            'size': size,
            'price': fill_price,
            'commission': commission_cost
        }
        self.trades.append(trade)
        
        # 更新持仓
        if symbol not in self.positions:
            self.positions[symbol] = 0
        self.positions[symbol] += direction * size
    
    def _generate_report(self):
        """生成回测报告"""
        returns = pd.Series(self.daily_returns)
        
        report = {
            'total_return': (self.equity_curve[-1] / self.initial_capital - 1),
            'annual_return': self._calculate_annual_return(),
            'sharpe_ratio': self._calculate_sharpe(returns),
            'max_drawdown': self._calculate_max_drawdown(),
            'win_rate': self._calculate_win_rate(),
            'profit_factor': self._calculate_profit_factor(),
            'total_trades': len(self.trades)
        }
        
        return report
    
    def _calculate_sharpe(self, returns, risk_free_rate=0.03):
        """计算夏普比率"""
        excess_returns = returns - risk_free_rate / 252
        return np.sqrt(252) * excess_returns.mean() / returns.std()
    
    def _calculate_max_drawdown(self):
        """计算最大回撤"""
        equity = pd.Series(self.equity_curve)
        rolling_max = equity.expanding().max()
        drawdown = (equity - rolling_max) / rolling_max
        return drawdown.min()
```

## 绩效指标

```python
class PerformanceMetrics:
    """绩效指标计算器"""
    
    @staticmethod
    def calculate_all(returns, trades=None):
        """计算所有指标"""
        metrics = {}
        
        # 收益指标
        metrics['total_return'] = (returns + 1).prod() - 1
        metrics['annual_return'] = (1 + metrics['total_return']) ** (252 / len(returns)) - 1
        metrics['volatility'] = returns.std() * np.sqrt(252)
        
        # 风险调整收益
        metrics['sharpe_ratio'] = PerformanceMetrics.sharpe_ratio(returns)
        metrics['sortino_ratio'] = PerformanceMetrics.sortino_ratio(returns)
        metrics['calmar_ratio'] = PerformanceMetrics.calmar_ratio(returns)
        
        # 风险指标
        metrics['max_drawdown'] = PerformanceMetrics.max_drawdown(returns)
        metrics['var_95'] = PerformanceMetrics.value_at_risk(returns)
        
        # 交易指标
        if trades:
            metrics['win_rate'] = PerformanceMetrics.win_rate(trades)
            metrics['profit_factor'] = PerformanceMetrics.profit_factor(trades)
        
        return metrics
    
    @staticmethod
    def sharpe_ratio(returns, risk_free=0.03):
        """夏普比率"""
        excess = returns.mean() * 252 - risk_free
        return excess / (returns.std() * np.sqrt(252))
    
    @staticmethod
    def max_drawdown(returns):
        """最大回撤"""
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        return drawdown.min()
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要回测策略
- 需要绩效分析
- 需要过拟合检测
- 需要参数优化

## 输出保证

- [ ] 完整回测代码
- [ ] 绩效指标报告
- [ ] 风险分析
- [ ] 优化建议

---

**记住：严谨的回测是策略实盘前的必经之路！**
