# Skills 文件夹移植指南

## 问题说明

当你将 `skills` 文件夹复制到其他位置时，Junction 链接会失效，因为它们指向原始路径。

## 解决方案

我们提供了两种方案：

---

## 方案一：使用便携式注册脚本（推荐）

**优点**: 不创建重复文件，节省空间
**缺点**: 每次移动后需要重新运行脚本

### 使用步骤：

1. 将整个 `skills` 文件夹复制到新位置
2. 在新位置运行 `portable-register.ps1`：
   ```powershell
   powershell -ExecutionPolicy Bypass -File ".\portable-register.ps1"
   ```
3. 重启 Trae IDE

---

## 方案二：创建完全便携版本

**优点**: 完全便携，移动后无需任何操作
**缺点**: 创建重复文件，占用更多磁盘空间

### 使用步骤：

1. 将整个 `skills` 文件夹复制到新位置
2. 在新位置运行 `make-portable.ps1`：
   ```powershell
   powershell -ExecutionPolicy Bypass -File ".\make-portable.ps1"
   ```
3. 这会将所有技能复制到根目录，创建一个完全独立的版本
4. 重启 Trae IDE

---

## 方案对比

| 特性 | 方案一 (portable-register.ps1) | 方案二 (make-portable.ps1) |
|------|-------------------------------|----------------------------|
| 磁盘空间 | 节省（使用链接） | 占用更多（复制文件） |
| 移动后操作 | 需要重新运行脚本 | 无需操作 |
| 适合场景 | 频繁移动 | 一次性部署 |

---

## 快速参考

### 在新位置使用方案一：
```powershell
cd "新路径\.trae\skills"
powershell -ExecutionPolicy Bypass -File ".\portable-register.ps1"
```

### 在新位置使用方案二：
```powershell
cd "新路径\.trae\skills"
powershell -ExecutionPolicy Bypass -File ".\make-portable.ps1"
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `portable-register.ps1` | 创建 Junction 链接，节省空间 |
| `make-portable.ps1` | 复制文件到根目录，完全便携 |
| `register-skills.ps1` | 原始脚本（使用绝对路径） |
