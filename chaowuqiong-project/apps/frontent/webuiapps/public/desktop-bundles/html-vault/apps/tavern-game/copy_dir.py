# -*- coding: utf-8 -*-
import shutil
import os
import sys
import glob

# 设置编码
if sys.platform == 'win32':
    import ctypes
    ctypes.windll.kernel32.SetConsoleOutputCP(65001)

# 定义源目录和目标目录
base_dir = os.path.dirname(os.path.abspath(__file__))
source_dir = os.path.join(base_dir, 'AI_Tavern_Refactored')
target_dir = os.path.join(base_dir, 'RPG_TAVERN_GAME')

try:
    # 如果目标目录存在，先删除
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)

    # 复制整个目录
    shutil.copytree(source_dir, target_dir)
    print(f"✅ 成功将 {source_dir} 复制到 {target_dir}")
    print(f"✅ 目录合并完成！")

except Exception as e:
    print(f"❌ 错误: {e}")
    sys.exit(1)
