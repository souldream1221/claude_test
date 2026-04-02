# UFS Test Application

一款跨平台的UFS（Universal Flash Storage）测试应用，支持Windows和Linux系统。

## 功能特性

- **测试用例管理**：顺序读写、随机IOPS、耐久性、协议一致性、温度监控、健康检查
- **设备自动检测**：自动识别连接的UFS设备
- **实时测试监控**：实时日志和进度显示
- **结果分析**：性能图表、通过/失败统计、数据导出

## 系统要求

### Windows
- Windows 10/11
- [Node.js](https://nodejs.org/) (LTS版本)
- [Rust](https://rustup.rs/)
- [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)

### Linux
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js (LTS版本)
- Rust
- sgutils / lsscsi (可选，用于真实设备检测)

## 快速开始

### 1. 安装依赖

```bash
# 克隆项目后，安装Node依赖
npm install

# 安装Rust依赖
cd src-tauri
cargo fetch
cd ..
```

### 2. 开发模式

```bash
# 通用命令
npm run tauri-dev

# Windows批处理
scripts\dev-windows.bat
```

### 3. 构建发布版本

```bash
# 通用命令
npm run tauri-build

# Windows批处理
scripts\build-windows.bat
```

构建完成后，安装程序位于：
- **Windows**: `src-tauri\target\release\bundle\msi\` 或 `nsis\`
- **Linux**: `src-tauri/target/release/bundle/deb/` 或 `appimage/`

## 跨平台差异

| 功能 | Windows | Linux |
|------|---------|-------|
| 设备检测 | WMI, PowerShell | sg_scan, lsscsi |
| 设备路径 | `\\.\PhysicalDrive0` | `/dev/sg0` |
| 原始访问 | 需特殊驱动 | sgutils |

## 项目结构

```
ufs-test-app/
├── src/                    # 前端React代码
│   ├── App.tsx
│   ├── components/
│   └── ...
├── src-tauri/              # 后端Rust代码
│   ├── src/
│   │   ├── main.rs
│   │   ├── ufs.rs         # 跨平台UFS接口
│   │   ├── test_runner.rs
│   │   └── models.rs
│   └── ...
├── scripts/                # 构建脚本
└── docs/                   # 文档
```

## 测试用例类型

1. **顺序读性能测试** - 测试顺序读取速度
2. **顺序写性能测试** - 测试顺序写入速度
3. **随机读IOPS测试** - 测试随机读取IOPS
4. **随机写IOPS测试** - 测试随机写入IOPS
5. **耐久性测试** - 长时间压力测试
6. **协议一致性测试** - UFS命令合规性验证
7. **温度监控测试** - 设备温度监测
8. **健康状态检查** - 设备健康度评估

## 许可证

MIT
