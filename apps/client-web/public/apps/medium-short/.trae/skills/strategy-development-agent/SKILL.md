---
name: "strategy-development-agent"
description: "Ultimate quantitative strategy development expert with alpha research, signal generation, position sizing, and strategy frameworks. Provides complete solutions for building robust trading strategies across multiple asset classes."
---

# Strategy Development Agent - 量化策略开发专家

## 核心理念

**策略即智慧，信号即机会。用数学与逻辑，捕捉市场的每一次波动。**

Strategy Development Agent 是专业级量化策略开发助手，提供从Alpha研究到信号生成的完整策略开发解决方案，帮助量化团队构建稳健、可盈利的交易策略。

## 核心工作流程

```
市场研究 → Alpha发现 → 信号构建 → 策略框架 → 参数优化 → 实盘准备
```

## 策略类型体系

### 策略分类

```
┌─────────────────────────────────────────────────────────┐
│                    量化策略类型                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  按交易频率                                             │
│  ├── 高频交易 (HFT): 微秒级，做市/套利                  │
│  ├── 中频交易: 分钟级-小时级，趋势跟踪                  │
│  └── 低频交易: 日级-周级，基本面/多因子                 │
│                                                         │
│  按策略逻辑                                             │
│  ├── 趋势策略: 追涨杀跌，均线突破                       │
│  ├── 均值回归: 反转交易，布林带                         │
│  ├── 套利策略: 跨期/跨品种/跨市场                       │
│  ├── 事件驱动: 财报/分红/并购                           │
│  └── 机器学习: 因子挖掘，预测模型                       │
│                                                         │
│  按资产类别                                             │
│  ├── 股票策略: 多因子选股，市场中性                     │
│  ├── 期货策略: CTA，商品趋势                            │
│  ├── 期权策略: 波动率交易，希腊值管理                   │
│  ├── 外汇策略:  carry trade，宏观对冲                   │
│  └── 加密货币: 统计套利，情绪分析                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 策略框架模板

### 基础策略类

```python
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod

class BaseStrategy(ABC):
    """策略基类"""
    
    def __init__(self, params=None):
        self.params = params or {}
        self.positions = {}
        self.signals = pd.DataFrame()
        
    @abstractmethod
    def generate_signals(self, data):
        """生成交易信号"""
        pass
    
    @abstractmethod
    def calculate_position_size(self, signal, capital, risk_per_trade=0.02):
        """计算仓位大小"""
        pass
    
    def on_bar(self, bar):
        """每根K线处理"""
        pass
    
    def on_tick(self, tick):
        """每个Tick处理"""
        pass
    
    def get_current_position(self, symbol):
        """获取当前持仓"""
        return self.positions.get(symbol, 0)
```

### 双均线策略

```python
class DualMAStrategy(BaseStrategy):
    """双均线策略"""
    
    def __init__(self, fast_period=10, slow_period=30):
        super().__init__()
        self.fast_period = fast_period
        self.slow_period = slow_period
        
    def generate_signals(self, data):
        """生成信号"""
        df = data.copy()
        
        # 计算均线
        df['fast_ma'] = df['close'].rolling(self.fast_period).mean()
        df['slow_ma'] = df['close'].rolling(self.slow_period).mean()
        
        # 生成信号
        df['signal'] = 0
        df.loc[df['fast_ma'] > df['slow_ma'], 'signal'] = 1  # 多头
        df.loc[df['fast_ma'] < df['slow_ma'], 'signal'] = -1  # 空头
        
        # 信号变化点
        df['position'] = df['signal'].diff()
        
        return df
    
    def calculate_position_size(self, signal, capital, risk_per_trade=0.02):
        """固定仓位"""
        return capital * risk_per_trade
```

### 多因子选股策略

```python
class MultiFactorStrategy(BaseStrategy):
    """多因子选股策略"""
    
    def __init__(self, factors=None, top_n=50):
        super().__init__()
        self.factors = factors or ['pe', 'pb', 'roe', 'momentum']
        self.top_n = top_n
        
    def generate_signals(self, data):
        """生成选股信号"""
        df = data.copy()
        
        # 计算因子得分
        for factor in self.factors:
            # 因子标准化
            df[f'{factor}_zscore'] = (df[factor] - df[factor].mean()) / df[factor].std()
        
        # 综合得分
        df['total_score'] = df[[f'{f}_zscore' for f in self.factors]].mean(axis=1)
        
        # 选择Top N
        df['signal'] = 0
        top_stocks = df.nlargest(self.top_n, 'total_score').index
        df.loc[top_stocks, 'signal'] = 1
        
        return df
    
    def calculate_position_size(self, signal, capital, risk_per_trade=0.02):
        """等权配置"""
        return capital / self.top_n
```

## 信号生成系统

### 技术信号

```python
class TechnicalSignalGenerator:
    """技术信号生成器"""
    
    def __init__(self):
        self.signals = {}
        
    def ma_cross_signal(self, df, fast=10, slow=30):
        """均线交叉信号"""
        df['fast_ma'] = df['close'].rolling(fast).mean()
        df['slow_ma'] = df['close'].rolling(slow).mean()
        
        # 金叉买入，死叉卖出
        df['signal'] = np.where(
            (df['fast_ma'] > df['slow_ma']) & 
            (df['fast_ma'].shift(1) <= df['slow_ma'].shift(1)),
            1,  # 买入
            np.where(
                (df['fast_ma'] < df['slow_ma']) & 
                (df['fast_ma'].shift(1) >= df['slow_ma'].shift(1)),
                -1,  # 卖出
                0
            )
        )
        
        return df
    
    def breakout_signal(self, df, period=20):
        """突破信号"""
        df['upper_band'] = df['high'].rolling(period).max()
        df['lower_band'] = df['low'].rolling(period).min()
        
        df['signal'] = np.where(
            df['close'] > df['upper_band'].shift(1),
            1,
            np.where(
                df['close'] < df['lower_band'].shift(1),
                -1,
                0
            )
        )
        
        return df
    
    def rsi_signal(self, df, period=14, overbought=70, oversold=30):
        """RSI信号"""
        import talib
        df['rsi'] = talib.RSI(df['close'], timeperiod=period)
        
        df['signal'] = np.where(
            df['rsi'] < oversold,
            1,  # 超卖买入
            np.where(
                df['rsi'] > overbought,
                -1,  # 超买卖出
                0
            )
        )
        
        return df
```

## 仓位管理

### 仓位管理策略

```python
class PositionSizer:
    """仓位管理器"""
    
    @staticmethod
    def fixed_fraction(capital, risk_per_trade=0.02, stop_loss_pct=0.05):
        """固定分数法"""
        risk_amount = capital * risk_per_trade
        position_size = risk_amount / stop_loss_pct
        return position_size
    
    @staticmethod
    def kelly_criterion(win_rate, win_loss_ratio):
        """凯利公式"""
        kelly_pct = win_rate - ((1 - win_rate) / win_loss_ratio)
        return max(0, min(kelly_pct, 0.25))  # 限制最大25%
    
    @staticmethod
    def volatility_targeting(capital, volatility, target_vol=0.15):
        """波动率目标法"""
        position_size = capital * (target_vol / volatility)
        return position_size
    
    @staticmethod
    def equal_weight(symbols, capital):
        """等权重配置"""
        return capital / len(symbols)
```

## 风险控制

### 止损止盈

```python
class RiskManager:
    """风险管理器"""
    
    def __init__(self, max_drawdown=0.2, max_position_pct=0.3):
        self.max_drawdown = max_drawdown
        self.max_position_pct = max_position_pct
        self.stop_losses = {}
        self.take_profits = {}
        
    def set_stop_loss(self, entry_price, stop_loss_pct=0.05):
        """设置止损"""
        return entry_price * (1 - stop_loss_pct)
    
    def set_take_profit(self, entry_price, take_profit_pct=0.1):
        """设置止盈"""
        return entry_price * (1 + take_profit_pct)
    
    def trailing_stop(self, highest_price, trailing_pct=0.1):
        """移动止损"""
        return highest_price * (1 - trailing_pct)
    
    def check_risk_limits(self, portfolio_value, peak_value, current_position):
        """检查风险限额"""
        drawdown = (peak_value - portfolio_value) / peak_value
        
        if drawdown > self.max_drawdown:
            return False, "Max drawdown exceeded"
        
        if current_position > self.max_position_pct:
            return False, "Max position size exceeded"
        
        return True, "OK"
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要开发交易策略
- 需要生成交易信号
- 需要设计仓位管理
- 需要风险控制方案
- 需要策略框架搭建

## 输出保证

- [ ] 完整的策略代码
- [ ] 信号生成逻辑
- [ ] 仓位管理方案
- [ ] 风险控制机制
- [ ] 策略参数优化建议

---

**记住：好的策略是在风险可控的前提下追求稳定收益！**
