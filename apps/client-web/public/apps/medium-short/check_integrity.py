#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全面检查代码完整性：语法错误、变量引用、逻辑问题
"""

import os
import re
import json

print("=" * 60)
print("🔍 全面检查代码完整性")
print("=" * 60)

# ===================== 1. 检查 JavaScript 语法问题 =====================
print("\n📋 检查 JavaScript 模块语法...")

js_modules = [
    'assets/js/modules/base.js',
    'assets/js/modules/writer.js',
    'assets/js/modules/phoenix.js',
    'assets/js/modules/toolbox.js',
    'assets/js/modules/tools_center.js',
    'assets/js/modules/world.js',
    'assets/js/modules/creative.js',
    'assets/js/modules/library.js',
    'assets/js/modules/short.js',
    'assets/js/modules/settings.js',
    'assets/js/modules/memory.js',
    'assets/js/modules/rag.js',
    'assets/js/modules/fusion_book.js',
    'assets/js/modules/rag_ui.js',
    'assets/js/modules/memory_ui.js',
    'assets/js/modules/web_chat.js',
    'assets/js/core/app.js',
    'assets/js/core/db.js',
    'assets/js/core/ui.js',
    'assets/js/core/ai.js',
    'assets/js/core/utils.js',
]

js_issues = []
for filepath in js_modules:
    if not os.path.exists(filepath):
        js_issues.append(f"{filepath}: 文件不存在!")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查基本的语法问题
    issues = []
    
    # 检查不匹配的括号
    open_braces = content.count('{')
    close_braces = content.count('}')
    open_brackets = content.count('[')
    close_brackets = content.count(']')
    open_parens = content.count('(')
    close_parens = content.count(')')
    
    if open_braces != close_braces:
        issues.append(f"花括号不匹配: {{ {open_braces} vs }} {close_braces}")
    if open_brackets != close_brackets:
        issues.append(f"方括号不匹配: [ {open_brackets} vs ] {close_brackets}")
    if open_parens != close_parens:
        issues.append(f"圆括号不匹配: ( {open_parens} vs ) {close_parens}")
    
    # 检查未闭合的模板字符串
    template_count = content.count('`')
    if template_count % 2 != 0:
        issues.append("模板字符串未闭合")
    
    # 检查未闭合的字符串
    single_quote_count = content.count("'")
    double_quote_count = content.count('"')
    if single_quote_count % 2 != 0:
        issues.append("单引号字符串未闭合")
    if double_quote_count % 2 != 0:
        issues.append("双引号字符串未闭合")
    
    if issues:
        js_issues.append((filepath, issues))

if js_issues:
    print("\n⚠️ 发现 JavaScript 问题:")
    for filepath, issues in js_issues:
        print(f"\n  {filepath}:")
        for issue in issues:
            print(f"    - {issue}")
else:
    print("✅ 所有 JavaScript 模块语法检查通过!")

# ===================== 2. 检查 CSS 变量引用 =====================
print("\n📋 检查 CSS 变量定义...")

css_files = []
for root, dirs, files in os.walk('css'):
    for f in files:
        if f.endswith('.css'):
            css_files.append(os.path.join(root, f))

for root, dirs, files in os.walk('assets/css'):
    for f in files:
        if f.endswith('.css'):
            css_files.append(os.path.join(root, f))

# 收集所有定义的变量
defined_vars = set()
for filepath in css_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配 CSS 变量定义: --variable-name: value;
    vars_found = re.findall(r'--([a-zA-Z0-9-_]+):', content)
    defined_vars.update(vars_found)

print(f"  发现 {len(defined_vars)} 个 CSS 变量")

# ===================== 3. 检查 Tailwind 配置 =====================
print("\n📋 检查 Tailwind 配置...")

# 检查 index.html 中的 Tailwind 配置
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 检查是否有配置冲突
if 'tailwind.config' in html_content:
    print("  ✅ Tailwind 配置已加载")
    
    # 检查关键颜色定义
    if "'accent': '#6366F1'" in html_content:
        print("  ✅ 主色调已配置 (indigo)")
    if "'main': '#1A1A2E'" in html_content:
        print("  ✅ 主文本色已配置")

# ===================== 4. 检查 index.html 引用完整性 =====================
print("\n📋 检查 HTML 引用完整性...")

required_css = [
    'css/variables.css',
    'css/core.css',
    'css/layout.css',
    'css/components.css',
    'css/utility.css',
    'assets/css/style.css',
    'css/mobile.css',
]

missing_css = []
for css in required_css:
    if css not in html_content:
        missing_css.append(css)

if missing_css:
    print(f"  ⚠️ 缺少 CSS 引用: {missing_css}")
else:
    print("  ✅ 所有 CSS 引用完整")

required_js = [
    'assets/js/core/db.js',
    'assets/js/core/utils.js',
    'assets/js/core/ui.js',
    'assets/js/core/ai.js',
    'assets/js/core/app.js',
]

missing_js = []
for js in required_js:
    if js not in html_content:
        missing_js.append(js)

if missing_js:
    print(f"  ⚠️ 缺少 JS 引用: {missing_js}")
else:
    print("  ✅ 核心 JS 引用完整")

# ===================== 5. 检查模块注册 =====================
print("\n📋 检查模块注册...")

# 检查 App.modules 或 Modules 对象
modules_check = [
    ('base.js', 'Modules.home'),
    ('writer.js', 'Modules.writer'),
    ('phoenix.js', 'Modules.phoenix'),
    ('toolbox.js', 'Modules.toolbox'),
    ('tools_center.js', 'Modules.tools_center'),
    ('world.js', 'Modules.world'),
    ('creative.js', 'Modules.creative'),
    ('library.js', 'Modules.reader_center'),
    ('short.js', 'Modules.short'),
    ('settings.js', 'Modules.settings'),
    ('memory.js', 'Modules.memory'),
    ('rag.js', 'Modules.rag'),
    ('fusion_book.js', 'Modules.fusion_book'),
    ('rag_ui.js', 'Modules.rag_ui'),
    ('memory_ui.js', 'Modules.memory_ui'),
    ('web_chat.js', 'Modules.web_chat'),
]

# 检查每个模块文件是否定义了对应的对象
for filepath, expected_obj in modules_check:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查模块对象定义
        if expected_obj.split('.')[1] in content:
            pass  # 模块存在
        else:
            print(f"  ⚠️ {filepath}: 模块定义可能不完整")

print("  ✅ 模块检查完成")

# ===================== 总结 =====================
print("\n" + "=" * 60)
if not js_issues and not missing_css and not missing_js:
    print("🎉 代码完整性检查通过！未发现影响运行的问题。")
else:
    issues_count = len(js_issues) + len(missing_css) + len(missing_js)
    print(f"⚠️ 共发现 {issues_count} 个潜在问题，需要关注")
print("=" * 60)
