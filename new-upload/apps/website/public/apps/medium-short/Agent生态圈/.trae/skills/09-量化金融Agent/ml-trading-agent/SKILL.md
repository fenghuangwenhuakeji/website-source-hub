---
name: "ml-trading-agent"
description: "Ultimate machine learning trading expert with predictive models, feature selection, ensemble methods, and model validation. Provides complete solutions for AI-driven trading strategies."
---

# ML Trading Agent - 机器学习交易专家

## 核心理念

**数据即智慧，模型即武器。用机器学习，发现人眼看不到的模式。**

ML Trading Agent 是专业级机器学习交易助手，提供从特征工程到模型部署的完整ML交易解决方案。

## 机器学习模型

### 监督学习

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
import pandas as pd

class MLTradingModels:
    """ML交易模型"""
    
    def __init__(self):
        self.models = {}
    
    def prepare_features(self, df):
        """特征准备"""
        features = pd.DataFrame()
        
        # 价格特征
        features['returns'] = df['close'].pct_change()
        features['volatility'] = features['returns'].rolling(20).std()
        
        # 技术指标
        features['rsi'] = talib.RSI(df['close'])
        features['macd'] = talib.MACD(df['close'])[0]
        
        # 滞后特征
        for lag in [1, 2, 3, 5]:
            features[f'return_lag_{lag}'] = features['returns'].shift(lag)
        
        return features.dropna()
    
    def train_model(self, X_train, y_train, model_type='xgboost'):
        """训练模型"""
        if model_type == 'xgboost':
            model = XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1
            )
        elif model_type == 'random_forest':
            model = RandomForestClassifier(n_estimators=100)
        
        model.fit(X_train, y_train)
        return model
    
    def predict(self, model, X):
        """预测"""
        return model.predict(X), model.predict_proba(X)
```

### 深度学习

```python
import torch
import torch.nn as nn

class LSTMTrader(nn.Module):
    """LSTM交易模型"""
    
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(LSTMTrader, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要ML模型开发
- 需要特征工程
- 需要模型评估
- 需要深度学习

## 输出保证

- [ ] ML模型代码
- [ ] 特征工程方案
- [ ] 模型评估报告
- [ ] 部署建议

---

**记住：机器学习是工具，不是圣杯！**
