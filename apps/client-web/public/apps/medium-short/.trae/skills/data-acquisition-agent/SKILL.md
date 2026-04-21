---
name: "data-acquisition-agent"
description: "Ultimate financial data acquisition expert with market data APIs, alternative data sources, real-time streaming, and data quality validation. Provides complete solutions for stock, futures, forex, and cryptocurrency data collection."
---

# Data Acquisition Agent - 金融数据获取专家

## 核心理念

**数据即燃料，质量即生命。用全面的数据源，驱动精准的量化决策。**

Data Acquisition Agent 是专业级金融数据获取助手，提供从行情数据到另类数据的完整数据获取解决方案，帮助量化团队建立高质量的数据基础设施。

## 核心工作流程

```
数据源选择 → API接入 → 实时采集 → 数据清洗 → 质量验证 → 存储入库
```

## 数据源支持

### 市场数据类型

```
┌─────────────────────────────────────────────────────────┐
│                    金融数据类型                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  行情数据                                               │
│  ├── Tick数据: 逐笔成交、逐笔委托                        │
│  ├── 分钟线: 1分钟/5分钟/15分钟/30分钟/60分钟           │
│  ├── 日线: 开盘价、最高价、最低价、收盘价、成交量       │
│  └── 周线/月线: 长期趋势分析                            │
│                                                         │
│  基本面数据                                             │
│  ├── 财务报表: 资产负债表、利润表、现金流量表           │
│  ├── 财务指标: PE、PB、ROE、EPS等                       │
│  ├── 股东信息: 十大流通股东、机构持仓                   │
│  └── 公司公告: 重大事项、业绩预告                       │
│                                                         │
│  宏观数据                                               │
│  ├── 经济指标: GDP、CPI、PPI、PMI                       │
│  ├── 货币政策: 利率、存款准备金率                       │
│  └── 行业数据: 行业指数、行业景气度                     │
│                                                         │
│  另类数据                                               │
│  ├── 舆情数据: 新闻情绪、社交媒体热度                   │
│  ├── 供应链数据: 卫星图像、航运数据                     │
│  └── 行为数据: 搜索指数、App下载量                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 数据源接入

### 国内数据源

```yaml
数据源配置:
  Tushare:
    类型: 股票/期货/基金数据
    频率: 日线/分钟线/Tick
    覆盖: A股全市场
    接入方式: Python API
    代码示例: |
      import tushare as ts
      pro = ts.pro_api('your_token')
      df = pro.daily(ts_code='000001.SZ', start_date='20240101')
      
  AkShare:
    类型: 多品种金融数据
    频率: 实时/历史
    覆盖: 股票/期货/期权/外汇
    接入方式: Python API
    特点: 免费开源
    
  Baostock:
    类型: 股票数据
    频率: 日线/分钟线
    覆盖: A股全市场
    接入方式: Python API
    特点: 免费
    
  Wind/同花顺iFinD:
    类型: 专业金融终端
    频率: 全频度
    覆盖: 全市场全品种
    接入方式: API/终端
    特点: 收费，数据全面
    
  聚宽/米筐:
    类型: 量化平台数据
    频率: 分钟线/Tick
    覆盖: A股/期货
    接入方式: 平台API
    特点: 云端服务
```

### 国际数据源

```yaml
国际数据源:
  Yahoo Finance:
    类型: 全球股票/外汇/加密货币
    频率: 日线/分钟线
    接入方式: yfinance库
    免费: 是
    
  Alpha Vantage:
    类型: 股票/外汇/加密货币
    频率: 日线/分钟线
    接入方式: REST API
    免费额度: 500次/天
    
  Quandl/NASDAQ Data Link:
    类型: 多品种金融数据
    频率: 多种
    接入方式: API
    免费/收费: 均有
    
  Bloomberg API:
    类型: 专业金融数据
    频率: 全频度
    接入方式: 专业API
    收费: 是
```

### 加密货币数据源

```yaml
加密货币数据源:
  Binance API:
    类型: 币安交易所数据
    频率: Tick/1秒/K线
    覆盖: 全币种
    接入方式: REST/WebSocket
    
  CCXT:
    类型: 多交易所统一接口
    覆盖: 100+交易所
    接入方式: Python库
    特点: 统一接口，方便切换
```

## 数据采集代码模板

### 股票数据获取

```python
import tushare as ts
import pandas as pd
from datetime import datetime, timedelta

class StockDataAcquisition:
    def __init__(self, token):
        self.pro = ts.pro_api(token)
        
    def get_daily_data(self, ts_code, start_date, end_date):
        """获取日线数据"""
        df = self.pro.daily(
            ts_code=ts_code,
            start_date=start_date,
            end_date=end_date
        )
        return df
    
    def get_minute_data(self, ts_code, freq='1min', start_date=None, end_date=None):
        """获取分钟线数据"""
        df = ts.pro_bar(
            ts_code=ts_code,
            freq=freq,
            start_date=start_date,
            end_date=end_date
        )
        return df
    
    def get_tick_data(self, ts_code, trade_date):
        """获取Tick数据"""
        df = self.pro.tick(
            ts_code=ts_code,
            trade_date=trade_date
        )
        return df
    
    def get_fundamental_data(self, ts_code, fields=None):
        """获取基本面数据"""
        # 财务指标
        df_indicator = self.pro.fina_indicator(ts_code=ts_code)
        # 资产负债表
        df_balance = self.pro.balancesheet(ts_code=ts_code)
        # 利润表
        df_income = self.pro.income(ts_code=ts_code)
        
        return {
            'indicator': df_indicator,
            'balance': df_balance,
            'income': df_income
        }
    
    def get_realtime_quotes(self, ts_codes):
        """获取实时行情"""
        df = ts.get_realtime_quotes(ts_codes)
        return df

# 使用示例
if __name__ == '__main__':
    acquisition = StockDataAcquisition('your_token')
    
    # 获取日线数据
    daily_data = acquisition.get_daily_data(
        ts_code='000001.SZ',
        start_date='20240101',
        end_date='20240301'
    )
    print(daily_data.head())
```

### 实时数据流

```python
import websocket
import json
import threading

class RealtimeDataStream:
    def __init__(self, on_message_callback):
        self.on_message = on_message_callback
        self.ws = None
        
    def connect(self, url):
        """连接WebSocket"""
        self.ws = websocket.WebSocketApp(
            url,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )
        self.ws.on_open = self._on_open
        
        # 启动线程保持连接
        wst = threading.Thread(target=self.ws.run_forever)
        wst.daemon = True
        wst.start()
        
    def _on_message(self, ws, message):
        data = json.loads(message)
        self.on_message(data)
        
    def _on_error(self, ws, error):
        print(f"WebSocket Error: {error}")
        
    def _on_close(self, ws):
        print("WebSocket Closed")
        
    def _on_open(self, ws):
        print("WebSocket Connected")
        # 订阅频道
        subscribe_msg = {
            "method": "SUBSCRIBE",
            "params": ["btcusdt@trade"],
            "id": 1
        }
        ws.send(json.dumps(subscribe_msg))
        
    def disconnect(self):
        if self.ws:
            self.ws.close()

# 使用示例
def handle_message(data):
    print(f"Received: {data}")

stream = RealtimeDataStream(handle_message)
stream.connect("wss://stream.binance.com:9443/ws")
```

## 数据质量验证

```python
class DataQualityValidator:
    """数据质量验证器"""
    
    @staticmethod
    def check_missing_values(df, threshold=0.05):
        """检查缺失值"""
        missing_ratio = df.isnull().sum() / len(df)
        issues = missing_ratio[missing_ratio > threshold]
        return issues
    
    @staticmethod
    def check_price_anomalies(df, price_col='close', threshold=0.1):
        """检查价格异常"""
        returns = df[price_col].pct_change()
        anomalies = df[abs(returns) > threshold]
        return anomalies
    
    @staticmethod
    def check_volume_anomalies(df, volume_col='vol', threshold=5):
        """检查成交量异常"""
        mean_vol = df[volume_col].mean()
        std_vol = df[volume_col].std()
        anomalies = df[abs(df[volume_col] - mean_vol) > threshold * std_vol]
        return anomalies
    
    @staticmethod
    def check_data_continuity(df, date_col='trade_date'):
        """检查数据连续性"""
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(date_col)
        
        expected_dates = pd.date_range(
            start=df[date_col].min(),
            end=df[date_col].max(),
            freq='B'  # 工作日
        )
        
        missing_dates = expected_dates.difference(df[date_col])
        return missing_dates
    
    def validate(self, df):
        """执行完整验证"""
        report = {
            'missing_values': self.check_missing_values(df),
            'price_anomalies': self.check_price_anomalies(df),
            'volume_anomalies': self.check_volume_anomalies(df),
            'missing_dates': self.check_data_continuity(df)
        }
        return report
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要获取金融数据
- 需要接入数据源API
- 需要实时数据流
- 需要数据质量验证
- 需要另类数据获取

## 输出保证

- [ ] 完整的数据获取代码
- [ ] 多数据源接入方案
- [ ] 实时数据流实现
- [ ] 数据质量验证报告
- [ ] 数据存储优化建议

---

**记住：高质量的数据是量化交易的基石！**
