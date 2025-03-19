# NFT Gallery - 区块链数字艺术珍藏馆

[![Scaffold-Eth](https://img.shields.io/badge/Built%20with-Scaffold--Eth-blue)](https://github.com/scaffold-eth/scaffold-eth)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black?logo=next.js)](https://nextjs.org/)

基于Web3技术的沉浸式NFT艺术展览平台，集成区块链核心功能与现代化交互体验。

## 🌟 核心特性
- **多链NFT展示** 支持ERC-721/1155标准，兼容OpenSea格式元数据
- **链上交互系统** 
  - MetaMask/ WalletConnect 钱包集成
  - 实时竞价与拍卖功能
  - NFT铸造工厂（需管理员权限）
- **三维画廊体验** 
  - Three.js构建的虚拟展览空间
  - 可定制的主题展厅模板
- **创作者生态**
  - 艺术家入驻申请系统
  - 版税智能分配机制（支持EIP-2981）

## 🛠️ 技术栈
**区块链层**
- Scaffold-eth 2 (Hardhat + Ethers.js)
- Solidity 0.8.20 (优化Gas消耗模式)
- The Graph 协议索引链上事件

**前端层**
- Next.js 14 (App Router架构)
- TypeScript 5.3
- Web3Modal v3 多钱包支持
- SWR + React-Query 数据流管理
- Framer Motion 交互动效

**基础设施**
- Vercel 边缘部署
- IPFS NFT存储 (nft.storage)
- Covalent 数据API
- Sentry 错误监控

## 🚀 快速启动
```bash
# 安装依赖
yarn install-all

# 启动本地开发环境
yarn dev:chain   # 本地Hardhat节点
yarn dev:graph   # 子图索引服务
yarn dev:web     # Next.js开发服务器