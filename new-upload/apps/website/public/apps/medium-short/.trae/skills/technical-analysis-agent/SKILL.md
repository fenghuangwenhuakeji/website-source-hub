---
name: "technical-analysis-agent"
description: "Ultimate technical analysis expert with chart patterns, indicators, volume analysis, and price action. Provides complete solutions for market timing and trend identification."
---

# Technical Analysis Agent - 技术分析专家

## 核心理念

**图表即语言，价格即故事。在K线图中，读懂市场的情绪。**

Technical Analysis Agent 是专业级技术分析助手，提供从技术指标到形态识别的完整技术分析解决方案。

## 技术指标库

### 趋势指标

```python
import talib
import pandas as pd

class TechnicalIndicators:
    """技术指标库"""
    
    @staticmethod
    def moving_averages(df, periods=[5, 10, 20, 60]):
        """移动平均线"""
        for period in periods:
            df[f'SMA_{period}'] = talib.SMA(df['close'], timeperiod=period)
            df[f'EMA_{period}'] = talib.EMA(df['close'], timeperiod=period)
        return df
    
    @staticmethod
    def macd(df, fast=12, slow=26, signal=9):
        """MACD指标"""
        df['MACD'], df['MACD_Signal'], df['MACD_Hist'] = talib.MACD(
            df['close'], fastperiod=fast, slowperiod=slow, signalperiod=signal
        )
        return df
    
    @staticmethod
    def bollinger_bands(df, period=20, std=2):
        """布林带"""
        df['BB_Upper'], df['BB_Middle'], df['BB_Lower'] = talib.BBANDS(
            df['close'], timeperiod=period, nbdevup=std, nbdevdn=std
        )
        return df
    
    @staticmethod
    def rsi(df, period=14):
        """RSI指标"""
        df['RSI'] = talib.RSI(df['close'], timeperiod=period)
        return df
    
    @staticmethod
    def kdj(df, fastk=9, slowk=3, slowd=3):
        """KDJ指标"""
        df['K'], df['D'] = talib.STOCH(
            df['high'], df['low'], df['close'],
            fastk_period=fastk, slowk_period=slowk, slowd_period=slowd
        )
        df['J'] = 3 * df['K'] - 2 * df['D']
        return df
```

### 形态识别

```python
class PatternRecognition:
    """形态识别"""
    
    @staticmethod
    def candlestick_patterns(df):
        """K线形态识别"""
        patterns = {
            'Doji': talib.CDLDOJI(df['open'], df['high'], df['low'], df['close']),
            'Hammer': talib.CDLHAMMER(df['open'], df['high'], df['low'], df['close']),
            'Engulfing': talib.CDLENGULFING(df['open'], df['high'], df['low'], df['close']),
            'Morning_Star': talib.CDLMORNINGSTAR(df['open'], df['high'], df['low'], df['close']),
            'Evening_Star': talib.CDLEVENINGSTAR(df['open'], df['high'], df['low'], df['close'])
        }
        
        for name, pattern in patterns.items():
            df[f'Pattern_{name}'] = pattern
        
        return df
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要技术分析指标
- 需要形态识别
- 需要趋势判断
- 需要支撑阻力位

## 输出保证

- [ ] 技术指标计算
- [ ] 形态识别结果
- [ ] 交易信号建议
- [ ] 图表分析

---

**记住：技术分析是概率的艺术，不是确定的科学！**
