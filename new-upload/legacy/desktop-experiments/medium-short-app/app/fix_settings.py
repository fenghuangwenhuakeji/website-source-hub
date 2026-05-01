#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 settings.js 中的 bg-[#111] 深色背景
"""

import re

filepath = 'assets/js/modules/settings.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 替换 bg-[#111] 为 bg-white
content = content.replace('bg-[#111]', 'bg-white')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ settings.js 修复完成")
