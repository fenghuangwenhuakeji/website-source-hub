/**
 * 终端工具 - 真实系统终端调用
 * 支持 PowerShell、CMD、Bash 等
 */

export interface TerminalCommand {
  command: string;
  cwd?: string;
}

export interface TerminalResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

let commandHistory: string[] = [];

/**
 * 执行终端命令
 */
export async function executeCommand(cmd: TerminalCommand): Promise<TerminalResult> {
  const fullCommand = cmd.command.trim();
  if (!fullCommand) {
    return { stdout: '', stderr: '', exitCode: 0, success: true };
  }

  commandHistory.push(fullCommand);
  if (commandHistory.length > 100) {
    commandHistory = commandHistory.slice(-100);
  }

  // 检查是否在 Electron 环境
  const electronAPI = (window as any).electronAPI;
  console.log('[Terminal] electronAPI available:', !!electronAPI, 'executeCommand:', !!electronAPI?.executeCommand);
  
  if (electronAPI?.executeCommand) {
    try {
      console.log('[Terminal] Calling Electron executeCommand:', fullCommand);
      const result = await electronAPI.executeCommand({
        command: fullCommand,
        cwd: cmd.cwd || 'E:\\'
      });
      console.log('[Terminal] Electron result:', result);
      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode || 0,
        success: result.exitCode === 0
      };
    } catch (error: any) {
      console.error('[Terminal] Error:', error);
      return {
        stdout: '',
        stderr: `执行失败: ${error?.message || error}`,
        exitCode: 1,
        success: false
      };
    }
  }

  console.log('[Terminal] Using simulated command:', fullCommand);
  // 浏览器环境 - 模拟执行
  return simulateCommand(cmd);
}

/**
 * 模拟执行命令（浏览器环境）
 */
function simulateCommand(cmd: TerminalCommand): TerminalResult {
  const command = cmd.command.trim();
  const args = command.split(' ').filter(arg => arg.length > 0);
  const mainCmd = args[0]?.toLowerCase() || '';

  switch (mainCmd) {
    case 'help':
    case '?':
      return {
        stdout: `╔══════════════════════════════════════════════════════════════╗
║                     终端帮助信息                              ║
╠══════════════════════════════════════════════════════════════╣
║  文件操作:                                                    ║
║    ls, dir              - 列出目录内容                        ║
║    cd <路径>            - 切换目录                            ║
║    pwd                  - 显示当前路径                        ║
║    cat <文件>           - 查看文件内容                        ║
║    type <文件>          - 查看文件内容 (Windows)              ║
║                                                               ║
║  系统命令:                                                    ║
║    echo <文本>          - 输出文本                            ║
║    clear, cls           - 清屏                                ║
║    whoami               - 显示当前用户                        ║
║    date                 - 显示当前日期时间                    ║
║                                                               ║
║  网络命令:                                                    ║
║    ping <主机>          - 测试网络连接                        ║
║    ipconfig, ifconfig   - 显示网络配置                        ║
║                                                               ║
║  其他:                                                        ║
║    help                 - 显示此帮助信息                      ║
╚══════════════════════════════════════════════════════════════╝`,
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'clear':
    case 'cls':
      return {
        stdout: '__CLEAR__',
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'echo':
      return {
        stdout: args.slice(1).join(' '),
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'pwd':
      return {
        stdout: cmd.cwd || 'E:\\',
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'whoami':
      return {
        stdout: 'user@openroom',
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'date':
      return {
        stdout: new Date().toLocaleString('zh-CN'),
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'cd':
      const newPath = args[1] || cmd.cwd || 'E:\\';
      return {
        stdout: `__CD__:${newPath}`,
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'ls':
    case 'dir':
      return {
        stdout: ` 驱动器 E 中的卷是 数据盘
 卷的序列号是 1234-5678

 ${cmd.cwd || 'E:\\'} 的目录

2024/03/22  10:30    <DIR>          .
2024/03/22  10:30    <DIR>          ..
2024/03/22  09:15    <DIR>          Documents
2024/03/22  09:15    <DIR>          Downloads
2024/03/22  09:15    <DIR>          Projects
2024/03/22  09:15    <DIR>          Videos
2024/03/22  09:15    <DIR>          Pictures
2024/03/22  09:15    <DIR>          Music
2024/03/22  10:00             1,024 README.md
2024/03/22  10:00             2,048 config.json
2024/03/22  10:00             4,096 notes.txt
               3 个文件          7,168 字节
               7 个目录  100,000,000,000 可用字节`,
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'cat':
    case 'type':
      if (args.length < 2) {
        return {
          stdout: '',
          stderr: '用法: cat <文件名>',
          exitCode: 1,
          success: false
        };
      }
      return {
        stdout: `文件: ${args[1]}\n\n这是模拟的文件内容。\n在浏览器环境中，显示的是模拟内容。`,
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'ping':
      if (args.length < 2) {
        return {
          stdout: '',
          stderr: '用法: ping <主机名或IP>',
          exitCode: 1,
          success: false
        };
      }
      return {
        stdout: `正在 Ping ${args[1]} [192.168.1.1] 具有 32 字节的数据:
来自 192.168.1.1 的回复: 字节=32 时间=1ms TTL=64
来自 192.168.1.1 的回复: 字节=32 时间=1ms TTL=64
来自 192.168.1.1 的回复: 字节=32 时间=1ms TTL=64
来自 192.168.1.1 的回复: 字节=32 时间=1ms TTL=64

${args[1]} 的 Ping 统计信息:
    数据包: 已发送 = 4，已接收 = 4，丢失 = 0 (0% 丢失)，
往返行程的估计时间(以毫秒为单位):
    最短 = 1ms，最长 = 1ms，平均 = 1ms`,
        stderr: '',
        exitCode: 0,
        success: true
      };

    case 'ipconfig':
    case 'ifconfig':
      return {
        stdout: `Windows IP 配置

以太网适配器 以太网:

   连接特定的 DNS 后缀 . . . . . . . :
   IPv4 地址 . . . . . . . . . . . . : 192.168.1.100
   子网掩码  . . . . . . . . . . . . : 255.255.255.0
   默认网关. . . . . . . . . . . . . : 192.168.1.1`,
        stderr: '',
        exitCode: 0,
        success: true
      };

    default:
      return {
        stdout: '',
        stderr: `'${mainCmd}' 不是内部或外部命令，也不是可运行的程序或批处理文件。

输入 'help' 查看可用命令列表。`,
        exitCode: 1,
        success: false
      };
  }
}

/**
 * 获取命令历史
 */
export function getCommandHistory(): string[] {
  return [...commandHistory];
}

/**
 * 清空命令历史
 */
export function clearCommandHistory(): void {
  commandHistory = [];
}
