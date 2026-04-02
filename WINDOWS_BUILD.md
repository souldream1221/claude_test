# Windows 构建指南

## 环境要求

### 1. 安装 Node.js
- 从 [https://nodejs.org/](https://nodejs.org/) 下载 LTS 版本
- 确保安装时勾选 "Add to PATH"

### 2. 安装 Rust
```powershell
# 使用 rustup 安装
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe
```

### 3. 安装 Windows 依赖
```powershell
# 安装 WebView2 运行时（Windows 10/11 通常已预装）
# 如需安装：https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# 安装 Visual Studio Build Tools（需要 C++ 工具链）
# 或安装完整的 Visual Studio 2022 Community
```

### 4. 安装 Tauri CLI
```bash
npm install -g @tauri-apps/cli
```

## 快速开始

### 开发模式
```bash
# 方式1：使用 npm 脚本
npm run tauri-dev

# 方式2：使用 Windows 批处理脚本
scripts\dev-windows.bat
```

### 构建发布版本
```bash
# 方式1：使用 npm 脚本
npm run tauri-build

# 方式2：使用 Windows 批处理脚本
scripts\build-windows.bat
```

构建完成后，安装程序位于：
- MSI 安装包：`src-tauri\target\release\bundle\msi\`
- NSIS 安装包：`src-tauri\target\release\bundle\nsis\`

## Windows 特定功能

### 设备检测
应用在 Windows 上会尝试通过以下方式检测 UFS 设备：
1. WMI (Windows Management Instrumentation) - `wmic diskdrive`
2. PowerShell - `Get-PhysicalDisk`
3. 如果无法检测，将显示模拟数据

### Windows 路径格式
- 设备路径使用 Windows 格式：`\\.\PhysicalDrive0`
- 导出的结果文件保存到用户文档目录

## 故障排除

### 构建失败：缺少工具链
```powershell
# 安装 Visual Studio C++ 工具
rustup default stable-x86_64-pc-windows-msvc
```

### 运行时缺少 DLL
确保安装：
- [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### 权限问题
运行应用可能需要管理员权限才能访问底层存储设备。

## 跨平台说明

| 功能 | Linux | Windows |
|------|-------|---------|
| 设备检测 | sg_scan, lsscsi | WMI, PowerShell |
| 设备路径 | /dev/sg0 | \\.\PhysicalDrive0 |
| 原始设备访问 | sgutils | 需要特殊驱动 |
| 安装包 | .deb, .AppImage | .msi, .exe |
