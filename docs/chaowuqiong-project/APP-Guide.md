# 超无穹AI APP开发指南

## 1. 移动APP开发方案

### 1.1 方案对比

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| **React Native** | 原生性能、代码复用、热更新 | 需要原生开发知识 | ⭐⭐⭐⭐⭐ |
| **Flutter** | 高性能、跨平台一致性好 | 需要学习Dart、包体积大 | ⭐⭐⭐⭐ |
| **PWA** | 无需安装、开发简单 | 功能受限、iOS支持差 | ⭐⭐⭐ |
| **Capacitor** | Web技术栈、插件丰富 | 性能不如原生 | ⭐⭐⭐⭐ |
| **Uni-app** | 国内生态好、多端发布 | 性能一般、框架限制 | ⭐⭐⭐ |

### 1.2 推荐方案: React Native

基于现有React技术栈，推荐使用 **React Native + Expo** 进行移动APP开发。

## 2. React Native项目初始化

### 2.1 创建项目

```bash
# 安装Expo CLI
npm install -g expo-cli

# 创建项目
cd apps
npx create-expo-app mobile --template expo-template-blank-typescript

# 进入项目
cd mobile
```

### 2.2 项目结构

```
apps/mobile/
├── app.json              # Expo配置
├── App.tsx               # 入口组件
├── src/
│   ├── screens/          # 页面
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── RechargeScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/       # 组件
│   ├── navigation/       # 导航
│   │   └── AppNavigator.tsx
│   ├── services/         # API服务
│   │   └── api.ts
│   ├── stores/           # 状态管理
│   │   └── useAuthStore.ts
│   ├── hooks/            # Hooks
│   └── utils/            # 工具
├── assets/               # 资源文件
└── package.json
```

### 2.3 安装依赖

```bash
# 导航
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# 状态管理
npm install zustand

# HTTP请求
npm install axios

# 存储和认证
npm install @react-native-async-storage/async-storage
npm install expo-secure-store

# UI组件
npm install react-native-paper
npm install react-native-vector-icons

# 支付
npm install react-native-alipay
npm install @react-native-wechat/wechat

# 其他
npm install expo-updates
npm install expo-notifications
```

## 3. 核心代码示例

### 3.1 API服务

```typescript
// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://chaowuqiong.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (data: RegisterData) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: ProfileData) =>
    api.put('/user/profile', data),
};

export const paymentApi = {
  getPackages: () => api.get('/packages'),
  createOrder: (packageId: string, method: string) =>
    api.post('/payment/create', { packageId, paymentMethod: method }),
};

export default api;
```

### 3.2 状态管理

```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  points: number;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (username, password) => {
    const response = await authApi.login(username, password);
    await SecureStore.setItemAsync('token', response.data.token);
    set({ user: response.data.user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const response = await authApi.me();
      set({ user: response.data, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));
```

### 3.3 导航配置

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/useAuthStore';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RechargeScreen from '../screens/RechargeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Recharge" component={RechargeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 4. 打包发布

### 4.1 配置app.json

```json
{
  "expo": {
    "name": "超无穹AI",
    "slug": "chaowuqiong",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a1a"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.chaowuqiong.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0a1a"
      },
      "package": "com.chaowuqiong.app",
      "versionCode": 1
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 4.2 EAS Build配置

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 4.3 构建命令

```bash
# 安装EAS CLI
npm install -g eas-cli

# 登录Expo账号
eas login

# 配置项目
eas build:configure

# 构建Android APK (预览版)
eas build --platform android --profile preview

# 构建生产版本
eas build --platform android --profile production
eas build --platform ios --profile production

# 提交到应用商店
eas submit --platform android
eas submit --platform ios
```

## 5. 外部项目导入

### 5.1 从Web项目迁移

如果需要将现有的Web项目转换为移动APP：

```bash
# 使用Capacitor包装现有Web应用
npm install @capacitor/core @capacitor/cli
npx cap init "超无穹AI" "com.chaowuqiong.app"

# 添加平台
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# 构建Web应用并同步
npm run build
npx cap sync

# 打开原生项目
npx cap open android
npx cap open ios
```

### 5.2 使用Taro跨端开发

```bash
# 安装Taro CLI
npm install -g @tarojs/cli

# 创建项目
taro init chaowuqiong-taro

# 选择React + TypeScript模板

# 运行到不同平台
npm run dev:h5      # Web
npm run dev:rn      # React Native
npm run dev:weapp   # 微信小程序
```

## 6. 性能优化建议

### 6.1 图片优化
- 使用WebP格式
- 实现图片懒加载
- 使用合适的图片尺寸

### 6.2 列表优化
- 使用FlatList代替ScrollView
- 实现虚拟列表
- 使用getItemLayout优化

### 6.3 网络优化
- 实现请求缓存
- 使用离线存储
- 优化请求频率

### 6.4 内存优化
- 及时清理不用的资源
- 避免内存泄漏
- 使用InteractionManager

## 7. 测试与调试

### 7.1 开发调试

```bash
# 启动开发服务器
npx expo start

# 在模拟器中运行
npx expo start --android
npx expo start --ios

# 在真机上运行 (需要Expo Go APP)
# 扫描终端显示的二维码
```

### 7.2 性能监控

```typescript
// 使用React DevTools Profiler
import { Profiler } from 'react';

<Profiler id="App" onRender={(id, phase, actualTime) => {
  console.log(`${id} ${phase} took ${actualTime}ms`);
}}>
  <App />
</Profiler>
```

## 8. 发布清单

- [ ] 更新版本号
- [ ] 更新应用图标和启动图
- [ ] 配置应用签名
- [ ] 测试所有功能
- [ ] 性能测试
- [ ] 安全检查
- [ ] 准备应用截图
- [ ] 准备应用描述
- [ ] 提交审核
