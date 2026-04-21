---
name: "data-processing-agent"
description: "Ultimate financial data processing expert with data cleaning, feature engineering, normalization, and transformation. Provides complete solutions for preparing raw market data into ML-ready datasets."
---

# Data Processing Agent - 金融数据处理专家

## 核心理念

**处理即提炼，特征即智慧。从原始数据中提取价值，为策略提供燃料。**

Data Processing Agent 是专业级金融数据处理助手，提供从数据清洗到特征工程的完整数据处理解决方案，帮助量化团队将原始数据转化为可用的特征数据。

## 核心工作流程

```
原始数据 → 数据清洗 → 特征计算 → 数据标准化 → 特征选择 → ML数据集
```

## 数据清洗

### 清洗流程

```python
import pandas as pd
import numpy as np

class DataCleaner:
    """金融数据清洗器"""
    
    def __init__(self):
        self.cleaning_log = []
        
    def remove_duplicates(self, df, subset=None):
        """去除重复数据"""
        before_count = len(df)
        df = df.drop_duplicates(subset=subset)
        after_count = len(df)
        
        self.cleaning_log.append({
            'operation': 'remove_duplicates',
            'removed': before_count - after_count
        })
        return df
    
    def handle_missing_values(self, df, method='forward_fill'):
        """处理缺失值"""
        if method == 'forward_fill':
            df = df.fillna(method='ffill')
        elif method == 'backward_fill':
            df = df.fillna(method='bfill')
        elif method == 'interpolate':
            df = df.interpolate(method='linear')
        elif method == 'drop':
            df = df.dropna()
            
        return df
    
    def remove_outliers(self, df, columns, method='iqr', threshold=1.5):
        """去除异常值"""
        if method == 'iqr':
            for col in columns:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                
                df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
                
        elif method == 'zscore':
            from scipy import stats
            z_scores = np.abs(stats.zscore(df[columns]))
            df = df[(z_scores < threshold).all(axis=1)]
            
        return df
    
    def adjust_prices(self, df, adjust_cols=['open', 'high', 'low', 'close']):
        """价格复权处理"""
        # 前复权
        if 'adj_factor' in df.columns:
            for col in adjust_cols:
                df[f'{col}_adj'] = df[col] * df['adj_factor']
                
        return df
    
    def resample_data(self, df, rule='1D', date_col='trade_date'):
        """重采样数据"""
        df[date_col] = pd.to_datetime(df[date_col])
        df.set_index(date_col, inplace=True)
        
        resampled = df.resample(rule).agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last',
            'volume': 'sum'
        })
        
        return resampled.reset_index()
```

## 特征工程

### 技术指标特征

```python
import talib

class TechnicalFeatureEngineer:
    """技术指标特征工程"""
    
    def __init__(self):
        self.features = []
        
    def add_trend_features(self, df):
        """趋势特征"""
        # 移动平均线
        for period in [5, 10, 20, 60]:
            df[f'ma_{period}'] = talib.SMA(df['close'], timeperiod=period)
            df[f'ema_{period}'] = talib.EMA(df['close'], timeperiod=period)
            
        # MACD
        df['macd'], df['macd_signal'], df['macd_hist'] = talib.MACD(
            df['close'], fastperiod=12, slowperiod=26, signalperiod=9
        )
        
        # 趋势强度
        df['adx'] = talib.ADX(df['high'], df['low'], df['close'], timeperiod=14)
        
        return df
    
    def add_momentum_features(self, df):
        """动量特征"""
        # RSI
        df['rsi_6'] = talib.RSI(df['close'], timeperiod=6)
        df['rsi_12'] = talib.RSI(df['close'], timeperiod=12)
        df['rsi_24'] = talib.RSI(df['close'], timeperiod=24)
        
        # KDJ
        df['slowk'], df['slowd'] = talib.STOCH(
            df['high'], df['low'], df['close'],
            fastk_period=9, slowk_period=3, slowd_period=3
        )
        
        # CCI
        df['cci'] = talib.CCI(df['high'], df['low'], df['close'], timeperiod=14)
        
        # Momentum
        df['mom'] = talib.MOM(df['close'], timeperiod=10)
        
        return df
    
    def add_volatility_features(self, df):
        """波动率特征"""
        # ATR
        df['atr'] = talib.ATR(df['high'], df['low'], df['close'], timeperiod=14)
        
        # Bollinger Bands
        df['upper'], df['middle'], df['lower'] = talib.BBANDS(
            df['close'], timeperiod=20, nbdevup=2, nbdevdn=2
        )
        
        # 历史波动率
        df['volatility_20'] = df['close'].pct_change().rolling(20).std() * np.sqrt(252)
        
        return df
    
    def add_volume_features(self, df):
        """成交量特征"""
        # OBV
        df['obv'] = talib.OBV(df['close'], df['volume'])
        
        # 成交量移动平均
        df['volume_ma_5'] = df['volume'].rolling(5).mean()
        df['volume_ma_20'] = df['volume'].rolling(20).mean()
        
        # 成交量比率
        df['volume_ratio'] = df['volume'] / df['volume_ma_20']
        
        return df
    
    def add_price_features(self, df):
        """价格特征"""
        # 收益率
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        
        # 价格位置
        df['price_position'] = (df['close'] - df['low']) / (df['high'] - df['low'])
        
        # 价格变化率
        df['price_change_5'] = df['close'].pct_change(5)
        df['price_change_20'] = df['close'].pct_change(20)
        
        return df
```

### 基本面特征

```python
class FundamentalFeatureEngineer:
    """基本面特征工程"""
    
    def add_valuation_features(self, df):
        """估值特征"""
        # 市盈率
        df['pe'] = df['close'] / df['eps']
        
        # 市净率
        df['pb'] = df['close'] / df['bps']
        
        # 市销率
        df['ps'] = df['market_cap'] / df['revenue']
        
        # 股息率
        df['dividend_yield'] = df['dividend'] / df['close']
        
        return df
    
    def add_profitability_features(self, df):
        """盈利能力特征"""
        # ROE
        df['roe'] = df['net_income'] / df['equity']
        
        # ROA
        df['roa'] = df['net_income'] / df['total_assets']
        
        # 毛利率
        df['gross_margin'] = (df['revenue'] - df['cogs']) / df['revenue']
        
        # 净利率
        df['net_margin'] = df['net_income'] / df['revenue']
        
        return df
    
    def add_growth_features(self, df):
        """成长特征"""
        # 营收增长率
        df['revenue_growth'] = df['revenue'].pct_change(4)  # 季度同比
        
        # 利润增长率
        df['profit_growth'] = df['net_income'].pct_change(4)
        
        return df
```

## 数据标准化

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

class DataNormalizer:
    """数据标准化器"""
    
    def __init__(self, method='standard'):
        self.method = method
        self.scaler = None
        
    def fit_transform(self, df, columns):
        """拟合并转换"""
        if self.method == 'standard':
            self.scaler = StandardScaler()
        elif self.method == 'minmax':
            self.scaler = MinMaxScaler()
        elif self.method == 'robust':
            self.scaler = RobustScaler()
            
        df_scaled = df.copy()
        df_scaled[columns] = self.scaler.fit_transform(df[columns])
        
        return df_scaled
    
    def transform(self, df, columns):
        """转换新数据"""
        df_scaled = df.copy()
        df_scaled[columns] = self.scaler.transform(df[columns])
        return df_scaled
    
    def inverse_transform(self, df, columns):
        """逆转换"""
        df_inv = df.copy()
        df_inv[columns] = self.scaler.inverse_transform(df[columns])
        return df_inv
```

## 特征选择

```python
from sklearn.feature_selection import SelectKBest, f_regression, mutual_info_regression

class FeatureSelector:
    """特征选择器"""
    
    def __init__(self, method='f_regression', k=20):
        self.method = method
        self.k = k
        self.selector = None
        self.selected_features = None
        
    def fit(self, X, y):
        """拟合特征选择"""
        if self.method == 'f_regression':
            self.selector = SelectKBest(score_func=f_regression, k=self.k)
        elif self.method == 'mutual_info':
            self.selector = SelectKBest(score_func=mutual_info_regression, k=self.k)
            
        self.selector.fit(X, y)
        
        # 获取选中的特征名
        mask = self.selector.get_support()
        self.selected_features = X.columns[mask].tolist()
        
        return self
    
    def transform(self, X):
        """转换数据"""
        return self.selector.transform(X)
    
    def get_feature_scores(self, X):
        """获取特征分数"""
        scores = pd.Series(
            self.selector.scores_,
            index=X.columns
        ).sort_values(ascending=False)
        
        return scores
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要清洗金融数据
- 需要构建技术特征
- 需要处理缺失值/异常值
- 需要数据标准化
- 需要特征选择

## 输出保证

- [ ] 完整的数据处理流程
- [ ] 技术/基本面特征代码
- [ ] 数据标准化方案
- [ ] 特征选择结果
- [ ] 处理后的ML数据集

---

**记住：好的特征工程是量化策略成功的关键！**
