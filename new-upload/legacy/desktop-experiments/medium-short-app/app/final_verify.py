#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最终全面检查
"""

import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # 检查深色背景
    dark_patterns = [
        (r'bg-\[#0[0-9a-fA-F]{5}\]', '深色背景'),
        (r'bg-\[#1[0-9a-fA-F]{5}\]', '深色背景'),
        (r'background:\s*#0[0-9a-fA-F]{5}', '深色背景'),
        (r'background:\s*#1[0-9a-fA-F]{5}', '深色背景'),
        (r'background:#0[0-9a-fA-F]{5}', '深色背景'),
        (r'background:#1[0-9a-fA-F]{5}', '深色背景'),
        (r'bg-\[#111\]', '深色背景'),
    ]
    
    for pattern, desc in dark_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            issues.append(f"  ⚠️ {desc}: {matches[:2]}")
    
    return issues

# 检查 JS 模块
print("📋 检查 JS 模块文件...")
js_issues = []
modules_dir = 'assets/js/modules'
for f in os.listdir(modules_dir):
    if f.endswith('.js'):
        filepath = os.path.join(modules_dir, f)
        issues = check_file(filepath)
        if issues:
            js_issues.append((filepath, issues))

if js_issues:
    print("\n发现 JS 模块中的深色背景:")
    for filepath, issues in js_issues:
        print(f"\n{filepath}:")
        for issue in issues:
            print(issue)
else:
    print("✅ 所有 JS 模块都已使用浅色背景！")

# 检查 CSS 文件
print("\n📋 检查 CSS 文件...")
css_issues = []
for root, dirs, files in os.walk('css'):
    for f in files:
        if f.endswith('.css') and 'modules' in root:
            filepath = os.path.join(root, f)
            issues = check_file(filepath)
            if issues:
                css_issues.append((filepath, issues))

for root, dirs, files in os.walk('assets/css'):
    for f in files:
        if f.endswith('.css'):
            filepath = os.path.join(root, f)
            issues = check_file(filepath)
            if issues:
                css_issues.append((filepath, issues))

if css_issues:
    print("\n发现 CSS 文件中的深色背景:")
    for filepath, issues in css_issues:
        print(f"\n{filepath}:")
        for issue in issues:
            print(issue)
else:
    print("✅ 所有 CSS 文件都已使用浅色背景！")

print("\n" + "="*60)
total = len(js_issues) + len(css_issues)
if total == 0:
    print("🎉 所有文件背景色都已修复为浅色主题！")
else:
    print(f"⚠️ 共发现 {total} 个文件仍有深色背景问题")
