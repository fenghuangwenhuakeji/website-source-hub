#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复遗漏的深色样式
"""

import os
import re

files_to_fix = [
    'assets/js/modules/writer.js',
    'assets/js/modules/world.js',
    'assets/js/modules/fusion_book.js',
    'assets/js/core/app.js',
]

replacements = [
    # 文字颜色
    (r'\btext-white\b', 'text-gray-800'),
    
    # 背景透明度
    (r'\bbg-black/8\b', 'bg-gray-200'),
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ 已修复：{filepath}")
    else:
        print(f"⏭️ 跳过：{filepath}")

print("\n🎉 遗漏样式修复完成!")
