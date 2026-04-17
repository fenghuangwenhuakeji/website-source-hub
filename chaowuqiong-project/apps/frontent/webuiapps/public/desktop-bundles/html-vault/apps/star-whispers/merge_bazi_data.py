#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
合并八字命理数据 - 将所有TXT文件合并成一个数据库文件
支持多种编码格式
"""
import os
import glob
import shutil
import json

def read_file_with_encoding(file_path):
    """尝试多种编码读取文件"""
    encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5', 'utf-16']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except (UnicodeDecodeError, UnicodeError):
            continue
    
    # 如果所有编码都失败，尝试二进制读取并忽略错误
    try:
        with open(file_path, 'rb') as f:
            return f.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"✗ 无法读取文件: {file_path} - {e}")
        return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_dir = os.path.join(script_dir, '111')
    data_dir = os.path.join(script_dir, 'data', 'bazi')
    
    # 确保数据目录存在
    os.makedirs(data_dir, exist_ok=True)
    
    # 复制原始TXT文件
    txt_files = glob.glob(os.path.join(source_dir, '*.txt'))
    for txt_file in txt_files:
        dest = os.path.join(data_dir, os.path.basename(txt_file))
        if not os.path.exists(dest):
            shutil.copy(txt_file, dest)
            print(f"✓ 复制: {os.path.basename(txt_file)}")
    
    # 合并所有TXT文件为一个数据库
    all_data = []
    all_txt_files = glob.glob(os.path.join(data_dir, '*.txt'))
    
    print(f"\n正在合并 {len(all_txt_files)} 个文件...")
    
    for txt_file in all_txt_files:
        content = read_file_with_encoding(txt_file)
        if content:
            all_data.append({
                'filename': os.path.basename(txt_file),
                'content': content,
                'size': len(content)
            })
            print(f"✓ 读取成功: {os.path.basename(txt_file)}")
        else:
            print(f"✗ 读取失败: {txt_file}")
    
    # 保存为JSON数据库
    db_path = os.path.join(data_dir, 'bazi_database.json')
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 数据库已创建: {db_path}")
    print(f"  共 {len(all_data)} 个文档")
    
    # 创建合并的纯文本文件
    merged_path = os.path.join(data_dir, 'bazi_knowledge_base.txt')
    with open(merged_path, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("八字命理知识库 - 星语心伴\n")
        f.write("=" * 80 + "\n\n")
        
        for item in all_data:
            f.write("\n" + "=" * 80 + "\n")
            f.write(f"【{item['filename']}】\n")
            f.write("=" * 80 + "\n\n")
            f.write(item['content'])
            f.write("\n\n")
    
    print(f"✓ 知识库已创建: {merged_path}")

if __name__ == '__main__':
    main()