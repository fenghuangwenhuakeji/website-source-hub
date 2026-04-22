#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量Agent生成器
根据YAML配置文件逐个生成560个Agent的5文档范式
"""

import yaml
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

class AgentGenerator:
    """Agent生成器类"""
    
    def __init__(self, output_dir: str = "generated_agents"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.generated_count = 0
        self.failed_agents = []
        
    def load_yaml_config(self, filepath: str) -> Dict:
        """加载YAML配置文件"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def generate_skill_md(self, agent: Dict, category: str) -> str:
        """生成SKILL.md文档"""
        name = agent.get('name', '')
        title = agent.get('title', '')
        description = agent.get('description', '')
        core_concept = agent.get('core_concept', '')
        features = agent.get('features', [])
        tags = agent.get('tags', [])
        
        features_text = '\n'.join([f"- {feat}" for feat in features])
        tags_text = ', '.join(tags)
        
        return f"""# {title}

## 核心概念
{core_concept}

## 功能描述
{description}

## 能力范围
{features_text}

## 使用场景
- 专业咨询与指导
- 问题诊断与解决
- 方案设计与优化
- 知识传授与培训

## 标签
{tags_text}

## 版本信息
- 版本: 1.0.0
- 创建日期: {datetime.now().strftime('%Y-%m-%d')}
- 分类: {category}
"""

    def generate_requirement_md(self, agent: Dict, category: str) -> str:
        """生成requirement.md文档"""
        name = agent.get('name', '')
        title = agent.get('title', '')
        description = agent.get('description', '')
        features = agent.get('features', [])
        priority = agent.get('priority', 'medium')
        
        features_req = '\n'.join([f"- [ ] {feat}" for feat in features])
        
        return f"""# {title} - 需求文档

## 1. 项目概述
### 1.1 背景
{description}

### 1.2 目标
创建一个专业的{title}，为用户提供高质量的{category}服务。

## 2. 功能需求
### 2.1 核心功能
{features_req}

### 2.2 扩展功能
- [ ] 多语言支持
- [ ] 个性化推荐
- [ ] 历史记录管理
- [ ] 数据分析报告

## 3. 非功能需求
### 3.1 性能要求
- 响应时间 < 3秒
- 并发用户数 > 100

### 3.2 可用性要求
- 系统可用性 > 99.9%
- 支持7x24小时服务

### 3.3 安全要求
- 数据加密传输
- 用户隐私保护
- 访问权限控制

## 4. 优先级
{priority.upper()}

## 5. 验收标准
- 所有核心功能正常运行
- 通过功能测试和性能测试
- 用户满意度 > 90%
"""

    def generate_design_md(self, agent: Dict, category: str) -> str:
        """生成design.md文档"""
        name = agent.get('name', '')
        title = agent.get('title', '')
        description = agent.get('description', '')
        core_concept = agent.get('core_concept', '')
        
        return f"""# {title} - 设计文档

## 1. 架构设计
### 1.1 系统架构
```
[用户输入] → [意图识别] → [知识检索] → [推理生成] → [输出格式化]
```

### 1.2 模块划分
- **输入处理模块**: 解析用户输入，识别意图
- **知识库模块**: 存储领域专业知识
- **推理引擎**: 基于知识进行推理
- **输出生成器**: 格式化输出结果

## 2. 核心概念设计
{core_concept}

## 3. 知识库设计
### 3.1 知识分类
- 基础理论知识
- 实践操作指南
- 案例分析数据
- 常见问题解答

### 3.2 知识表示
- 结构化数据
- 非结构化文本
- 规则库
- 模板库

## 4. 交互设计
### 4.1 对话流程
1. 问候与需求了解
2. 信息收集与分析
3. 方案生成与建议
4. 反馈收集与优化

### 4.2 输出格式
- 清晰的结构化回答
- 重点内容突出
- 可操作的建议
- 相关资源推荐

## 5. 质量保障
### 5.1 准确性保障
- 多源知识验证
- 专家审核机制
- 持续学习更新

### 5.2 一致性保障
- 回答风格统一
- 逻辑自洽
- 标准术语使用
"""

    def generate_tasks_md(self, agent: Dict, category: str) -> str:
        """生成tasks.md文档"""
        name = agent.get('name', '')
        title = agent.get('title', '')
        features = agent.get('features', [])
        priority = agent.get('priority', 'medium')
        
        # 根据优先级确定时间线
        timeline = {
            'high': '2周',
            'medium': '3周',
            'low': '4周'
        }.get(priority, '3周')
        
        tasks = []
        for i, feat in enumerate(features, 1):
            tasks.append(f"- [ ] 任务{i}: 实现{feat}")
        
        tasks_text = '\n'.join(tasks)
        
        return f"""# {title} - 任务清单

## 项目信息
- **Agent名称**: {name}
- **预计工期**: {timeline}
- **优先级**: {priority.upper()}
- **创建日期**: {datetime.now().strftime('%Y-%m-%d')}

## 开发阶段

### 阶段1: 需求分析 (第1-2天)
- [ ] 1.1 收集并分析用户需求
- [ ] 1.2 定义功能边界
- [ ] 1.3 编写需求文档

### 阶段2: 知识库构建 (第3-5天)
- [ ] 2.1 收集领域知识
- [ ] 2.2 整理知识分类
- [ ] 2.3 构建知识图谱
- [ ] 2.4 验证知识准确性

### 阶段3: 核心功能开发 (第6-10天)
{tasks_text}

### 阶段4: 测试优化 (第11-12天)
- [ ] 4.1 功能测试
- [ ] 4.2 性能测试
- [ ] 4.3 用户体验测试
- [ ] 4.4 问题修复

### 阶段5: 文档完善 (第13-14天)
- [ ] 5.1 更新SKILL.md
- [ ] 5.2 编写使用指南
- [ ] 5.3 整理示例库
- [ ] 5.4 最终审核

## 里程碑
- [ ] M1: 需求冻结
- [ ] M2: 知识库完成
- [ ] M3: 功能开发完成
- [ ] M4: 测试通过
- [ ] M5: 正式发布

## 风险管控
| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 知识不准确 | 中 | 高 | 专家审核 |
| 功能延期 | 低 | 中 | 预留缓冲时间 |
| 性能问题 | 低 | 高 | 提前性能测试 |
"""

    def generate_checklist_md(self, agent: Dict, category: str) -> str:
        """生成checklist.md文档"""
        name = agent.get('name', '')
        title = agent.get('title', '')
        
        return f"""# {title} - 检查清单

## 发布前检查

### 文档完整性
- [ ] SKILL.md 已编写完成
- [ ] requirement.md 已编写完成
- [ ] design.md 已编写完成
- [ ] tasks.md 已编写完成
- [ ] checklist.md 已编写完成

### 功能完整性
- [ ] 所有核心功能已实现
- [ ] 功能测试通过
- [ ] 边界情况处理完善
- [ ] 错误处理机制健全

### 知识库质量
- [ ] 知识内容准确无误
- [ ] 知识覆盖全面
- [ ] 知识更新及时
- [ ] 引用来源可靠

### 性能与稳定性
- [ ] 响应时间符合要求
- [ ] 并发处理正常
- [ ] 内存使用合理
- [ ] 无内存泄漏

### 用户体验
- [ ] 交互流程顺畅
- [ ] 输出格式清晰
- [ ] 帮助信息完善
- [ ] 示例丰富实用

### 安全性
- [ ] 输入验证完善
- [ ] 敏感信息保护
- [ ] 访问控制正确
- [ ] 日志记录规范

## 发布后检查

### 监控
- [ ] 运行状态监控正常
- [ ] 性能指标监控正常
- [ ] 错误日志监控正常
- [ ] 用户反馈收集正常

### 维护
- [ ] 定期更新计划制定
- [ ] 知识库维护流程建立
- [ ] 问题反馈渠道畅通
- [ ] 版本管理规范

## 签字确认
- [ ] 开发人员确认
- [ ] 测试人员确认
- [ ] 产品经理确认
- [ ] 发布审批通过

---
**检查日期**: ___________
**检查人员**: ___________
**备注**: ___________
"""

    def generate_agent(self, agent: Dict, category: str, batch_name: str) -> bool:
        """生成单个Agent的5文档"""
        try:
            name = agent.get('name', '')
            if not name:
                print(f"  ⚠️ 跳过无名Agent")
                return False
            
            # 创建Agent目录
            agent_dir = self.output_dir / batch_name / name
            agent_dir.mkdir(parents=True, exist_ok=True)
            
            # 生成5个文档
            files = {
                'SKILL.md': self.generate_skill_md(agent, category),
                'requirement.md': self.generate_requirement_md(agent, category),
                'design.md': self.generate_design_md(agent, category),
                'tasks.md': self.generate_tasks_md(agent, category),
                'checklist.md': self.generate_checklist_md(agent, category)
            }
            
            for filename, content in files.items():
                filepath = agent_dir / filename
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
            
            self.generated_count += 1
            print(f"  ✅ 已生成: {name}")
            return True
            
        except Exception as e:
            print(f"  ❌ 生成失败: {agent.get('name', 'unknown')} - {e}")
            self.failed_agents.append({
                'name': agent.get('name', 'unknown'),
                'error': str(e)
            })
            return False
    
    def process_config_file(self, filepath: str, batch_name: str) -> int:
        """处理单个配置文件"""
        print(f"\n📂 处理配置文件: {filepath}")
        
        config = self.load_yaml_config(filepath)
        count = 0
        
        # 处理不同结构的配置文件
        for key, value in config.items():
            if isinstance(value, dict) and 'agents' in value:
                category = value.get('category_name', key)
                agents = value.get('agents', [])
                
                print(f"\n  📁 分类: {category} ({len(agents)}个Agent)")
                
                for agent in agents:
                    if self.generate_agent(agent, category, batch_name):
                        count += 1
            elif isinstance(value, list) and key.endswith('_agents'):
                # 处理列表形式的agents
                category = key.replace('_agents', '').replace('_', ' ').title()
                print(f"\n  📁 分类: {category} ({len(value)}个Agent)")
                
                for agent in value:
                    if self.generate_agent(agent, category, batch_name):
                        count += 1
        
        return count
    
    def generate_all(self):
        """生成所有Agent"""
        config_files = [
            ('agents-batch-config.yaml', 'batch-01-creative'),
            ('web-dev-agents-config.yaml', 'batch-02-webdev'),
            ('business-agents-config.yaml', 'batch-03-business'),
            ('specialized-agents-batch-1.yaml', 'batch-04-specialized-1'),
            ('specialized-agents-batch-2.yaml', 'batch-04-specialized-2'),
            ('industrial-agents-batch-1.yaml', 'batch-05-industrial-1'),
            ('industrial-agents-batch-2.yaml', 'batch-05-industrial-2'),
        ]
        
        print("=" * 60)
        print("🚀 开始批量生成560个Agent")
        print("=" * 60)
        
        total_count = 0
        for config_file, batch_name in config_files:
            filepath = Path(config_file)
            if filepath.exists():
                count = self.process_config_file(str(filepath), batch_name)
                total_count += count
            else:
                print(f"  ⚠️ 配置文件不存在: {config_file}")
        
        # 生成统计报告
        self.generate_report(total_count)
        
        return total_count
    
    def generate_report(self, total_count: int):
        """生成统计报告"""
        report = f"""
{'=' * 60}
📊 Agent生成报告
{'=' * 60}
生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
成功生成: {self.generated_count} 个Agent
生成失败: {len(self.failed_agents)} 个Agent
输出目录: {self.output_dir.absolute()}
{'=' * 60}
"""
        
        if self.failed_agents:
            report += "\n❌ 失败的Agent:\n"
            for failed in self.failed_agents:
                report += f"  - {failed['name']}: {failed['error']}\n"
        
        print(report)
        
        # 保存报告
        report_file = self.output_dir / 'generation_report.txt'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 报告已保存: {report_file}")


def main():
    """主函数"""
    generator = AgentGenerator(output_dir='generated_agents')
    total = generator.generate_all()
    
    print(f"\n🎉 批量生成完成！共生成 {total} 个Agent")


if __name__ == '__main__':
    main()
