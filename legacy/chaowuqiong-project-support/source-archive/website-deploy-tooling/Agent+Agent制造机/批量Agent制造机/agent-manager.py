#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Agent管理系统
用于管理、检索、筛选和批量操作560个Agent
"""

import yaml
import json
import os
import sys
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import argparse
from datetime import datetime


@dataclass
class Agent:
    """Agent数据类"""
    id: str
    name: str
    category: str
    batch: str
    priority: str
    description: str = ""
    tags: List[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []


class AgentManager:
    """Agent管理器"""
    
    def __init__(self, index_file: str = "AGENT-INDEX.yaml"):
        self.index_file = index_file
        self.agents: List[Agent] = []
        self.index_data: Dict = {}
        self.load_index()
    
    def load_index(self):
        """加载索引文件"""
        try:
            with open(self.index_file, 'r', encoding='utf-8') as f:
                self.index_data = yaml.safe_load(f)
            self._parse_agents()
            print(f"✅ 成功加载 {len(self.agents)} 个Agent")
        except Exception as e:
            print(f"❌ 加载索引文件失败: {e}")
            sys.exit(1)
    
    def _parse_agents(self):
        """解析Agent数据"""
        categories = self.index_data.get('categories', [])
        for category in categories:
            cat_name = category.get('name', '')
            batch = str(category.get('batch', ''))
            agents = category.get('agents', [])
            
            for agent_data in agents:
                agent = Agent(
                    id=agent_data.get('id', ''),
                    name=agent_data.get('name', ''),
                    category=cat_name,
                    batch=batch,
                    priority=agent_data.get('priority', 'medium'),
                    description=agent_data.get('description', ''),
                    tags=agent_data.get('tags', [])
                )
                self.agents.append(agent)
    
    def search(self, keyword: str) -> List[Agent]:
        """搜索Agent"""
        keyword = keyword.lower()
        results = []
        for agent in self.agents:
            if (keyword in agent.id.lower() or 
                keyword in agent.name.lower() or
                keyword in agent.category.lower() or
                any(keyword in tag.lower() for tag in agent.tags)):
                results.append(agent)
        return results
    
    def filter_by_category(self, category: str) -> List[Agent]:
        """按分类筛选"""
        return [a for a in self.agents if category.lower() in a.category.lower()]
    
    def filter_by_priority(self, priority: str) -> List[Agent]:
        """按优先级筛选"""
        return [a for a in self.agents if a.priority.lower() == priority.lower()]
    
    def filter_by_batch(self, batch: str) -> List[Agent]:
        """按批次筛选"""
        return [a for a in self.agents if batch in a.batch]
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        stats = {
            'total': len(self.agents),
            'by_priority': {},
            'by_category': {},
            'by_batch': {}
        }
        
        for agent in self.agents:
            # 优先级统计
            stats['by_priority'][agent.priority] = stats['by_priority'].get(agent.priority, 0) + 1
            # 分类统计
            stats['by_category'][agent.category] = stats['by_category'].get(agent.category, 0) + 1
            # 批次统计
            stats['by_batch'][agent.batch] = stats['by_batch'].get(agent.batch, 0) + 1
        
        return stats
    
    def list_categories(self) -> List[str]:
        """列出所有分类"""
        return sorted(list(set(a.category for a in self.agents)))
    
    def list_batches(self) -> List[str]:
        """列出所有批次"""
        return sorted(list(set(a.batch for a in self.agents)))
    
    def get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """通过ID获取Agent"""
        for agent in self.agents:
            if agent.id == agent_id:
                return agent
        return None
    
    def export_to_json(self, output_file: str):
        """导出为JSON"""
        data = [asdict(agent) for agent in self.agents]
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已导出到 {output_file}")
    
    def generate_report(self) -> str:
        """生成报告"""
        stats = self.get_statistics()
        report = []
        report.append("=" * 60)
        report.append("Agent生态系统报告")
        report.append("=" * 60)
        report.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"总Agent数: {stats['total']}")
        report.append("")
        
        report.append("📊 按优先级分布:")
        for priority, count in sorted(stats['by_priority'].items()):
            report.append(f"  {priority}: {count}个")
        report.append("")
        
        report.append("📁 按分类分布:")
        for category, count in sorted(stats['by_category'].items(), key=lambda x: -x[1]):
            report.append(f"  {category}: {count}个")
        report.append("")
        
        report.append("📦 按批次分布:")
        for batch, count in sorted(stats['by_batch'].items()):
            report.append(f"  批次{batch}: {count}个")
        
        return '\n'.join(report)


class AgentCLI:
    """命令行界面"""
    
    def __init__(self):
        self.manager = AgentManager()
    
    def run(self):
        """运行CLI"""
        parser = argparse.ArgumentParser(
            description='Agent管理系统 - 管理560个AI Agent',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
示例:
  python agent-manager.py search 代码审查
  python agent-manager.py category 软件开发
  python agent-manager.py priority high
  python agent-manager.py stats
  python agent-manager.py report
            """
        )
        
        subparsers = parser.add_subparsers(dest='command', help='可用命令')
        
        # 搜索命令
        search_parser = subparsers.add_parser('search', help='搜索Agent')
        search_parser.add_argument('keyword', help='搜索关键词')
        
        # 分类命令
        category_parser = subparsers.add_parser('category', help='按分类筛选')
        category_parser.add_argument('name', help='分类名称')
        
        # 优先级命令
        priority_parser = subparsers.add_parser('priority', help='按优先级筛选')
        priority_parser.add_argument('level', choices=['high', 'medium', 'low'], help='优先级')
        
        # 批次命令
        batch_parser = subparsers.add_parser('batch', help='按批次筛选')
        batch_parser.add_argument('id', help='批次ID')
        
        # 统计命令
        subparsers.add_parser('stats', help='显示统计信息')
        
        # 报告命令
        subparsers.add_parser('report', help='生成详细报告')
        
        # 列表命令
        list_parser = subparsers.add_parser('list', help='列出所有Agent')
        list_parser.add_argument('--category', help='按分类过滤')
        list_parser.add_argument('--priority', help='按优先级过滤')
        
        # 导出命令
        export_parser = subparsers.add_parser('export', help='导出数据')
        export_parser.add_argument('format', choices=['json', 'csv'], help='导出格式')
        export_parser.add_argument('--output', default='agents_export', help='输出文件名')
        
        # 分类列表命令
        subparsers.add_parser('categories', help='列出所有分类')
        
        # 批次列表命令
        subparsers.add_parser('batches', help='列出所有批次')
        
        args = parser.parse_args()
        
        if not args.command:
            parser.print_help()
            return
        
        self._execute_command(args)
    
    def _execute_command(self, args):
        """执行命令"""
        if args.command == 'search':
            self._cmd_search(args.keyword)
        elif args.command == 'category':
            self._cmd_category(args.name)
        elif args.command == 'priority':
            self._cmd_priority(args.level)
        elif args.command == 'batch':
            self._cmd_batch(args.id)
        elif args.command == 'stats':
            self._cmd_stats()
        elif args.command == 'report':
            self._cmd_report()
        elif args.command == 'list':
            self._cmd_list(args.category, args.priority)
        elif args.command == 'export':
            self._cmd_export(args.format, args.output)
        elif args.command == 'categories':
            self._cmd_categories()
        elif args.command == 'batches':
            self._cmd_batches()
    
    def _print_agents(self, agents: List[Agent], title: str = ""):
        """打印Agent列表"""
        if title:
            print(f"\n{'='*60}")
            print(f"{title} (共{len(agents)}个)")
            print('='*60)
        
        if not agents:
            print("❌ 未找到匹配的Agent")
            return
        
        for i, agent in enumerate(agents, 1):
            priority_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(agent.priority, "⚪")
            print(f"{i:3d}. {priority_icon} [{agent.id}]")
            print(f"     名称: {agent.name}")
            print(f"     分类: {agent.category}")
            print(f"     批次: {agent.batch}")
            if agent.tags:
                print(f"     标签: {', '.join(agent.tags)}")
            print()
    
    def _cmd_search(self, keyword: str):
        """搜索命令"""
        results = self.manager.search(keyword)
        self._print_agents(results, f"搜索 '{keyword}' 的结果")
    
    def _cmd_category(self, name: str):
        """分类命令"""
        results = self.manager.filter_by_category(name)
        self._print_agents(results, f"分类 '{name}' 的Agent")
    
    def _cmd_priority(self, level: str):
        """优先级命令"""
        results = self.manager.filter_by_priority(level)
        priority_name = {"high": "高", "medium": "中", "low": "低"}.get(level, level)
        self._print_agents(results, f"{priority_name}优先级Agent")
    
    def _cmd_batch(self, batch_id: str):
        """批次命令"""
        results = self.manager.filter_by_batch(batch_id)
        self._print_agents(results, f"批次 '{batch_id}' 的Agent")
    
    def _cmd_stats(self):
        """统计命令"""
        stats = self.manager.get_statistics()
        print("\n" + "="*60)
        print("📊 Agent统计信息")
        print("="*60)
        print(f"总Agent数: {stats['total']}")
        print(f"分类数量: {len(stats['by_category'])}")
        print(f"批次数量: {len(stats['by_batch'])}")
        print("\n按优先级:")
        for p, c in sorted(stats['by_priority'].items()):
            icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(p, "⚪")
            print(f"  {icon} {p}: {c}个")
    
    def _cmd_report(self):
        """报告命令"""
        report = self.manager.generate_report()
        print(report)
        
        # 保存报告
        filename = f"agent_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\n✅ 报告已保存到: {filename}")
    
    def _cmd_list(self, category: Optional[str], priority: Optional[str]):
        """列表命令"""
        agents = self.manager.agents
        if category:
            agents = [a for a in agents if category.lower() in a.category.lower()]
        if priority:
            agents = [a for a in agents if a.priority.lower() == priority.lower()]
        self._print_agents(agents, "Agent列表")
    
    def _cmd_export(self, format: str, output: str):
        """导出命令"""
        if format == 'json':
            filename = f"{output}.json"
            self.manager.export_to_json(filename)
        elif format == 'csv':
            filename = f"{output}.csv"
            self._export_csv(filename)
    
    def _export_csv(self, filename: str):
        """导出为CSV"""
        import csv
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['ID', '名称', '分类', '批次', '优先级', '标签'])
            for agent in self.manager.agents:
                writer.writerow([
                    agent.id,
                    agent.name,
                    agent.category,
                    agent.batch,
                    agent.priority,
                    ','.join(agent.tags)
                ])
        print(f"✅ 已导出到 {filename}")
    
    def _cmd_categories(self):
        """分类列表命令"""
        categories = self.manager.list_categories()
        print("\n📁 所有分类:")
        for i, cat in enumerate(categories, 1):
            count = len(self.manager.filter_by_category(cat))
            print(f"  {i:2d}. {cat} ({count}个)")
    
    def _cmd_batches(self):
        """批次列表命令"""
        batches = self.manager.list_batches()
        print("\n📦 所有批次:")
        for i, batch in enumerate(batches, 1):
            count = len(self.manager.filter_by_batch(batch))
            print(f"  {i:2d}. 批次 {batch} ({count}个)")


def interactive_mode():
    """交互模式"""
    print("""
╔══════════════════════════════════════════════════════════╗
║           🚀 Agent管理系统 - 交互模式                    ║
║           管理560个AI Agent的专业工具                    ║
╚══════════════════════════════════════════════════════════╝

可用命令:
  search <关键词>    - 搜索Agent
  category <分类>    - 按分类查看
  priority <high|medium|low> - 按优先级查看
  batch <批次>       - 按批次查看
  stats              - 查看统计
  report             - 生成报告
  categories         - 列出所有分类
  batches            - 列出所有批次
  help               - 显示帮助
  quit               - 退出
""")
    
    manager = AgentManager()
    
    while True:
        try:
            cmd = input("\n📝 请输入命令: ").strip().split()
            if not cmd:
                continue
            
            if cmd[0] == 'quit':
                print("👋 再见!")
                break
            elif cmd[0] == 'help':
                print("可用命令: search, category, priority, batch, stats, report, categories, batches, help, quit")
            elif cmd[0] == 'search' and len(cmd) > 1:
                results = manager.search(' '.join(cmd[1:]))
                print(f"\n找到 {len(results)} 个结果:")
                for agent in results[:10]:  # 只显示前10个
                    print(f"  - {agent.name} [{agent.category}]")
                if len(results) > 10:
                    print(f"  ... 还有 {len(results)-10} 个结果")
            elif cmd[0] == 'stats':
                stats = manager.get_statistics()
                print(f"\n总Agent数: {stats['total']}")
                print(f"高优先级: {stats['by_priority'].get('high', 0)}个")
                print(f"中优先级: {stats['by_priority'].get('medium', 0)}个")
                print(f"低优先级: {stats['by_priority'].get('low', 0)}个")
            elif cmd[0] == 'categories':
                cats = manager.list_categories()
                print(f"\n共 {len(cats)} 个分类:")
                for cat in cats:
                    print(f"  - {cat}")
            else:
                print("❌ 未知命令，输入 help 查看帮助")
        
        except KeyboardInterrupt:
            print("\n👋 再见!")
            break
        except Exception as e:
            print(f"❌ 错误: {e}")


if __name__ == '__main__':
    if len(sys.argv) > 1:
        cli = AgentCLI()
        cli.run()
    else:
        interactive_mode()
