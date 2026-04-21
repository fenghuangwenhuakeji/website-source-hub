#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
酒馆游戏项目整理脚本
自动执行文件重组和清理工作
"""

import os
import shutil
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(r"D:/AIcreateEngine/标准软件开发范式/酒馆/TAVERN_GAME")

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.END} {msg}")

def print_success(msg):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.END} {msg}")

def print_warning(msg):
    print(f"{Colors.YELLOW}[WARNING]{Colors.END} {msg}")

def print_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.END} {msg}")

def create_backup():
    """创建备份"""
    backup_path = PROJECT_ROOT.parent / "TAVERN_GAME_BACKUP"

    if backup_path.exists():
        print_warning(f"备份已存在: {backup_path}")
        return False

    print_info("正在创建备份...")
    shutil.copytree(PROJECT_ROOT, backup_path)
    print_success(f"备份创建成功: {backup_path}")
    return True

def create_directories():
    """创建必要的目录结构"""
    directories = [
        "js/core",
        "js/systems",
        "js/data",
        "docs/archive",
        "server",
        "assets/images",
        "assets/audio"
    ]

    print_info("正在创建目录结构...")
    for dir_path in directories:
        full_path = PROJECT_ROOT / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        print_success(f"创建目录: {dir_path}")

def delete_obsolete_files():
    """删除过时的文件"""
    obsolete_files = [
        # 过时的README文件
        "README_merged1.md",
        "README_merged2.md",
        # 过时的快速开始文件
        "QUICKSTART_merged1.md",
        "QUICKSTART_merged2.md",
        # 过时的合并报告
        "MERGE_SUMMARY.md",
        "INTEGRATION_GUIDE.md",
        # 过时的状态文件
        "PROJECT_SUMMARY.md",
        # 过时的启动脚本
        "start-server.bat",
        "start-server-fixed.bat",
        "启动服务器.bat",
        "copy_dir.py",
        "start_server.py",  # 与start.py重复
    ]

    print_info("正在删除过时文件...")
    for filename in obsolete_files:
        file_path = PROJECT_ROOT / filename
        if file_path.exists():
            file_path.unlink()
            print_success(f"删除: {filename}")
        else:
            print_warning(f"文件不存在，跳过: {filename}")

def archive_old_documents():
    """归档旧文档"""
    archive_files = [
        "FINAL_MERGE_REPORT_ALL.md",
        "FIXES_AND_MERGE.md",
        "COMPLETION_STATUS.md"
    ]

    print_info("正在归档旧文档...")
    for filename in archive_files:
        src = PROJECT_ROOT / filename
        dst = PROJECT_ROOT / "docs" / "archive" / filename
        if src.exists():
            shutil.move(str(src), str(dst))
            print_success(f"归档: {filename} → docs/archive/")
        else:
            print_warning(f"文件不存在，跳过: {filename}")

def rename_files():
    """重命名文件为小写"""
    rename_map = {
        "README.MD": "README.md",
        "REQUIREMENT.MD": "REQUIREMENT.md",
        "DESIGN.MD": "DESIGN.md",
        "TASK.MD": "TASK.md",
        "PROJECT_STATUS.MD": "PROJECT_STATUS.md"
    }

    print_info("正在重命名文件...")
    for old_name, new_name in rename_map.items():
        old_path = PROJECT_ROOT / old_name
        new_path = PROJECT_ROOT / new_name
        if old_path.exists():
            old_path.rename(new_path)
            print_success(f"重命名: {old_name} → {new_name}")
        else:
            print_warning(f"文件不存在，跳过: {old_name}")

def organize_js_files():
    """重组JS文件结构"""
    js_files = [
        # core
        ("game-engine.js", "js/core/GameEngine.js"),
        # systems
        ("audio-system.js", "js/systems/AudioSystem.js"),
        ("battle-system.js", "js/systems/BattleSystem.js"),
        ("card-system.js", "js/systems/CardSystem.js"),
        ("character-system.js", "js/systems/CharacterSystem.js"),
        ("class-system.js", "js/systems/ClassSystem.js"),
        ("map-system.js", "js/systems/MapSystem.js"),
        ("quest-system.js", "js/systems/QuestSystem.js"),
        ("save-system.js", "js/systems/SaveSystem.js"),
        ("story-system.js", "js/systems/StorySystem.js"),
        ("tavern-system.js", "js/systems/TavernSystem.js"),
        ("upgrade-system.js", "js/systems/UpgradeSystem.js"),
        # data
        ("game-data.js", "js/data/GameData.js"),
        # main
        ("main.js", "js/main.js")
    ]

    print_info("正在重组JS文件...")
    for old_file, new_file in js_files:
        src = PROJECT_ROOT / old_file
        dst = PROJECT_ROOT / new_file
        if src.exists():
            shutil.move(str(src), str(dst))
            print_success(f"移动: {old_file} → {new_file}")
        else:
            print_warning(f"文件不存在，跳过: {old_file}")

def organize_server_scripts():
    """整理服务器启动脚本"""
    server_files = [
        "start.js",
        "start.py",
        "start-server.sh"
    ]

    print_info("正在整理服务器脚本...")
    for filename in server_files:
        src = PROJECT_ROOT / filename
        dst = PROJECT_ROOT / "server" / filename
        if src.exists():
            shutil.move(str(src), str(dst))
            print_success(f"移动: {filename} → server/{filename}")
        else:
            print_warning(f"文件不存在，跳过: {filename}")

def create_core_system_files():
    """创建核心系统文件（从GameEngine提取）"""
    print_info("正在创建核心系统文件...")

    # 创建 StateManager.js
    state_manager = """/**
 * 状态管理器
 * 负责游戏状态的全局管理
 */

class StateManager {
    constructor() {
        this.state = {
            player: null,
            map: null,
            quest: null,
            tavern: null,
            battle: null
        };
        this.history = [];
        this.listeners = new Map();
    }

    // 获取状态
    get(path) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;
        for (const key of keys) {
            if (value[key] === undefined) return null;
            value = value[key];
        }
        return value;
    }

    // 设置状态
    set(path, value) {
        const oldValue = this.get(path);
        const keys = path.split('.');

        let obj = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (obj[keys[i]] === undefined) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = value;

        // 触发事件
        this.emit(path, value, oldValue);

        return true;
    }

    // 订阅状态变更
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(callback);
    }

    // 取消订阅
    unsubscribe(path, callback) {
        if (!this.listeners.has(path)) return false;

        const callbacks = this.listeners.get(path);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    // 触发事件
    emit(path, newValue, oldValue) {
        if (!this.listeners.has(path)) return;

        const callbacks = this.listeners.get(path);
        for (const callback of callbacks) {
            callback(newValue, oldValue, path);
        }
    }

    // 保存快照
    saveSnapshot() {
        const snapshot = JSON.parse(JSON.stringify(this.state));
        this.history.push(snapshot);
        if (this.history.length > 100) {
            this.history.shift();
        }
        return snapshot;
    }

    // 恢复快照
    restoreSnapshot(snapshot) {
        this.state = JSON.parse(JSON.stringify(snapshot));
    }

    // 导出状态
    export() {
        return JSON.parse(JSON.stringify(this.state));
    }

    // 导入状态
    import(data) {
        this.state = JSON.parse(JSON.stringify(data));
    }
}
"""

    # 创建 EventSystem.js
    event_system = """/**
 * 事件系统
 * 负责游戏内的事件发布和订阅
 */

class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.history = [];
    }

    // 订阅事件
    on(event, callback, priority = 0) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push({ callback, priority });

        // 按优先级排序
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);
    }

    // 一次性订阅
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        this.onceListeners.get(event).push(callback);
    }

    // 发布事件
    emit(event, data = null) {
        // 记录事件历史
        this.history.push({ event, data, timestamp: Date.now() });

        // 执行普通监听器
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            for (const { callback } of callbacks) {
                try {
                    callback(data, event);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            }
        }

        // 执行一次性监听器
        if (this.onceListeners.has(event)) {
            const callbacks = this.onceListeners.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data, event);
                } catch (error) {
                    console.error(`Error in once listener for ${event}:`, error);
                }
            }
            this.onceListeners.delete(event);
        }
    }

    // 取消订阅
    off(event, callback) {
        if (!this.listeners.has(event)) return false;

        const callbacks = this.listeners.get(event);
        const index = callbacks.findIndex(cb => cb.callback === callback);
        if (index > -1) {
            callbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    // 清除所有监听
    clear() {
        this.listeners.clear();
        this.onceListeners.clear();
    }

    // 清除指定事件的所有监听
    clearEvent(event) {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }

    // 获取事件历史
    getHistory(event = null, limit = 10) {
        if (event) {
            return this.history
                .filter(h => h.event === event)
                .slice(-limit);
        }
        return this.history.slice(-limit);
    }
}
"""

    # 写入文件
    state_manager_path = PROJECT_ROOT / "js" / "core" / "StateManager.js"
    event_system_path = PROJECT_ROOT / "js" / "core" / "EventSystem.js"

    state_manager_path.write_text(state_manager, encoding='utf-8')
    event_system_path.write_text(event_system, encoding='utf-8')

    print_success("创建: js/core/StateManager.js")
    print_success("创建: js/core/EventSystem.js")

def update_html_references():
    """更新HTML中的文件引用"""
    html_file = PROJECT_ROOT / "index.html"

    if not html_file.exists():
        print_error("index.html 不存在，跳过更新")
        return

    print_info("正在更新 index.html 中的引用...")

    # 读取HTML文件
    content = html_file.read_text(encoding='utf-8')

    # 更新CSS引用
    content = content.replace('css/styles.css', 'css/styles.css')

    # 更新JS引用
    replacements = {
        'game-engine.js': 'js/core/GameEngine.js',
        'audio-system.js': 'js/systems/AudioSystem.js',
        'battle-system.js': 'js/systems/BattleSystem.js',
        'card-system.js': 'js/systems/CardSystem.js',
        'character-system.js': 'js/systems/CharacterSystem.js',
        'class-system.js': 'js/systems/ClassSystem.js',
        'map-system.js': 'js/systems/MapSystem.js',
        'quest-system.js': 'js/systems/QuestSystem.js',
        'save-system.js': 'js/systems/SaveSystem.js',
        'story-system.js': 'js/systems/StorySystem.js',
        'tavern-system.js': 'js/systems/TavernSystem.js',
        'upgrade-system.js': 'js/systems/UpgradeSystem.js',
        'game-data.js': 'js/data/GameData.js',
        'main.js': 'js/main.js',
    }

    for old, new in replacements.items():
        # 使用正则表达式匹配src属性
        import re
        pattern = rf'src=["\']{re.escape(old)}["\']'
        replacement = f'src="{new}"'
        content = re.sub(pattern, replacement, content)

    # 写回文件
    html_file.write_text(content, encoding='utf-8')
    print_success("更新完成: index.html")

def generate_summary_report():
    """生成整理报告"""
    report_path = PROJECT_ROOT / "ORGANIZATION_REPORT.md"

    # 统计文件
    doc_files = list(PROJECT_ROOT.glob("*.md"))
    js_files = list(PROJECT_ROOT.glob("**/*.js"))

    report = f"""# 📊 项目整理报告

## 整理时间
{__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 整理结果

### 目录结构
```
TAVERN_GAME/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── core/          (3个文件)
│   ├── systems/       (11个文件)
│   ├── data/          (1个文件)
│   └── main.js
├── docs/              ({len(doc_files)}个文档)
│   └── archive/       (归档文档)
├── server/            (3个启动脚本)
└── assets/            (资源目录)
```

### 文件统计
- **文档文件**: {len(doc_files)} 个
- **JS文件**: {len(js_files)} 个
- **根目录文件**: 减少到约 5 个

## 下一步建议

1. **测试游戏**
   - 在浏览器中打开 index.html
   - 测试所有游戏功能

2. **完善文档**
   - 合并重复的文档内容
   - 更新README中的路径引用

3. **优化代码**
   - 为JS文件添加更多注释
   - 检查并修复可能的错误

4. **添加新功能**
   - 根据需求添加新功能
   - 扩展游戏内容

---

整理完成！🎉
"""

    report_path.write_text(report, encoding='utf-8')
    print_success(f"生成整理报告: {report_path}")

def main():
    """主函数"""
    print("=" * 60)
    print("🎮 酒馆游戏项目整理工具".center(60))
    print("=" * 60)
    print()

    # 确认执行
    print_warning("此操作将重组项目文件结构！")
    print_info("执行前会自动创建备份")
    print()
    response = input("是否继续？(yes/no): ")

    if response.lower() not in ['yes', 'y']:
        print_info("操作已取消")
        return

    # 执行整理
    try:
        print()
        print("=" * 60)
        print("阶段 1: 创建备份".center(60))
        print("=" * 60)
        create_backup()

        print()
        print("=" * 60)
        print("阶段 2: 创建目录结构".center(60))
        print("=" * 60)
        create_directories()

        print()
        print("=" * 60)
        print("阶段 3: 删除过时文件".center(60))
        print("=" * 60)
        delete_obsolete_files()

        print()
        print("=" * 60)
        print("阶段 4: 归档旧文档".center(60))
        print("=" * 60)
        archive_old_documents()

        print()
        print("=" * 60)
        print("阶段 5: 重命名文件".center(60))
        print("=" * 60)
        rename_files()

        print()
        print("=" * 60)
        print("阶段 6: 重组JS文件".center(60))
        print("=" * 60)
        organize_js_files()

        print()
        print("=" * 60)
        print("阶段 7: 整理服务器脚本".center(60))
        print("=" * 60)
        organize_server_scripts()

        print()
        print("=" * 60)
        print("阶段 8: 创建核心系统文件".center(60))
        print("=" * 60)
        create_core_system_files()

        print()
        print("=" * 60)
        print("阶段 9: 更新HTML引用".center(60))
        print("=" * 60)
        update_html_references()

        print()
        print("=" * 60)
        print("阶段 10: 生成整理报告".center(60))
        print("=" * 60)
        generate_summary_report()

        print()
        print("=" * 60)
        print("✅ 整理完成！".center(60))
        print("=" * 60)
        print()
        print_success("项目整理成功完成！")
        print_info("请查看 ORGANIZATION_REPORT.md 了解详情")
        print_info("备份位置: TAVERN_GAME_BACKUP/")
        print()
        print_info("下一步：")
        print("  1. 在浏览器中打开 index.html 测试游戏")
        print("  2. 检查 ORGANIZATION_REPORT.md")
        print("  3. 根据需要进一步优化")

    except Exception as e:
        print_error(f"整理过程中发生错误: {e}")
        print_info("请检查备份并手动恢复")

if __name__ == "__main__":
    main()
