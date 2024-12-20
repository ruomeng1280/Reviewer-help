# 期末复习助手 (Final Exam Review Helper)

一个基于 Electron 的桌面应用，帮助学生更好地规划和激励自己的复习进程。通过游戏化的方式，让复习变得更有趣和高效。

配套期末速成手册购买链接：https://mbd.pub/o/bread/ZZicl5lp


## 功能特点

### 1. 任务管理

- 创建和管理复习任务
- 任务进度实时追踪
- 可添加任务描述
- 支持删除已完成/未完成的任务

### 2. 激励系统

- 完成任务后获得掷骰子机会
- 支持单次掷骰、5连抽、10连抽
- 动态骰子动画效果
- 点数累积系统

### 3. 奖励机制

- 自定义奖励内容
- 设置所需点数门槛
- 自动解锁达标奖励
- 奖励进度实时显示

### 4. 数据统计

- 任务完成数据追踪
- 累计获得点数统计
- 已解锁奖励统计
- 直观的数据展示

### 5. 其他特性

- 本地数据持久化存储
- 支持一键重置所有数据
- 友好的用户界面
- 丰富的动画效果
- 操作音效反馈

## 技术栈

- Electron
- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5
- Font Awesome
- LocalStorage

## 安装说明

1. 克隆仓库 

## 开发说明

### 环境配置

项目使用了国内镜像源来加速依赖下载：

1. 项目根目录已配置 `.npmrc` 文件，包含：
   - npm 镜像：https://registry.npmmirror.com
   - Electron 镜像：https://npmmirror.com/mirrors/electron/
   - Electron Builder 镜像：https://npmmirror.com/mirrors/electron-builder-binaries/

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发环境
npm start

# 打包 Windows 应用
npm run dist-win
```
