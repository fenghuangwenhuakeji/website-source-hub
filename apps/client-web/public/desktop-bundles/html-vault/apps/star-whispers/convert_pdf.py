#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
PDF转TXT脚本 - 将八字命理PDF文件转换为文本
使用PyPDF2库
"""
import os
import glob

try:
    from PyPDF2 import PdfReader
except ImportError:
    print("请先安装PyPDF2: pip install PyPDF2")
    exit(1)

def pdf_to_txt(pdf_path, txt_path):
    """将PDF转换为TXT文件"""
    try:
        reader = PdfReader(pdf_path)
        text_content = []
        
        # 添加文件标题
        filename = os.path.basename(pdf_path)
        text_content.append("=" * 60)
        text_content.append(f"文件: {filename}")
        text_content.append("=" * 60)
        text_content.append("")
        
        for page_num, page in enumerate(reader.pages, 1):
            # 提取页面文本
            text = page.extract_text()
            if text and text.strip():
                text_content.append(f"--- 第 {page_num} 页 ---")
                text_content.append(text)
                text_content.append("")
        
        # 写入TXT文件
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(text_content))
        
        print(f"✓ 转换成功: {filename} -> {os.path.basename(txt_path)}")
        return True
        
    except Exception as e:
        print(f"✗ 转换失败: {pdf_path}")
        print(f"  错误: {str(e)}")
        return False

def main():
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_dir = os.path.join(script_dir, '111')
    output_dir = os.path.join(script_dir, 'data', 'bazi')
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 查找所有PDF文件
    pdf_files = glob.glob(os.path.join(source_dir, '*.pdf'))
    
    if not pdf_files:
        print(f"在 {source_dir} 中未找到PDF文件")
        return
    
    print(f"找到 {len(pdf_files)} 个PDF文件")
    print("-" * 40)
    
    success_count = 0
    for pdf_path in pdf_files:
        # 生成输出文件名
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        txt_path = os.path.join(output_dir, f"{base_name}.txt")
        
        if pdf_to_txt(pdf_path, txt_path):
            success_count += 1
    
    print("-" * 40)
    print(f"转换完成: {success_count}/{len(pdf_files)} 个文件成功")
    print(f"输出目录: {output_dir}")

if __name__ == '__main__':
    main()