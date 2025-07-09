# NFT数字藏品平台

## 项目简介
NFT数字藏品平台 是一个综合性的 NFT 创作、交易与展示平台，致力于为用户提供完整的 NFT 生态体验。本项目结合了区块链技术与现代前端开发，实现了 NFT 的创建、铸造、交易、拍卖、碎片化、盲盒等多样化功能，同时支持 3D 模型的展示与交互，为用户提供沉浸式的 NFT 体验。系统采用去中心化架构，确保资产所有权的透明与安全，让创作者与收藏者能够便捷地参与 NFT 市场。

## 核心特性
- 🎨 多样化 NFT 创建与铸造功能，支持多种媒体格式
- 🔄 完整的 NFT 交易市场，支持直售、拍卖等多种交易方式
- 📦 NFT 盲盒系统，增加收藏乐趣与稀有性
- 🧩 NFT 碎片化功能，降低参与门槛，提高流动性
- 🌐 IPFS 分布式存储，确保数据永久保存
- 🔍 区块浏览器集成，方便交易查询与验证
- 🎮 3D 模型支持，提供沉浸式 NFT 展示体验
- 🚀 空投系统，方便项目方进行社区激励
- 🔐 安全的钱包连接与资产管理
- 🌈 响应式设计，支持多种设备访问

## 核心功能
### NFT 创建与管理
- NFT 创建与铸造
- 批量铸造功能
- NFT 元数据管理
- 作品版权保护

### NFT 交易系统
- NFT 直售市场
- NFT 拍卖系统
- NFT 收藏夹
- 交易历史记录
- 交易手续费系统

### 特色功能
- NFT 盲盒系统：随机开启稀有 NFT
- NFT 碎片化：将高价值 NFT 分割为多个碎片交易
- NFT 空投：项目方可以向指定地址批量发送 NFT
- 3D 模型展示：支持 3D NFT 的在线展示与互动

### 系统功能
- 区块浏览器：查询交易、区块、账户信息
- IPFS 上传下载：便捷的分布式文件存储接口
- 钱包连接：支持多种以太坊钱包

## 技术架构
### 前端技术栈
- **Next.js 14**：React 框架，提供服务端渲染与静态生成
- **TailwindCSS**：实用优先的 CSS 框架
- **ethers.js**：以太坊 JavaScript 客户端库
- **wagmi**：React Hooks 库用于以太坊交互
- **IPFS HTTP Client**：与 IPFS 网络交互
- **three.js**：3D 模型渲染
- **TypeScript**：静态类型检查

### 区块链技术栈
- **Hardhat**：以太坊开发环境
- **Solidity**：智能合约编程语言
- **OpenZeppelin Contracts**：安全的智能合约库
- **Ethers.js**：以太坊 JavaScript API
- **TypeChain**：TypeScript 类型生成工具

## 安装使用说明
### 环境要求
- Node.js 18.x 或更高版本
- Yarn 包管理器
- MetaMask 或其他以太坊钱包

### 安装与运行

#### 安装依赖
```bash
# 安装工作区依赖
yarn install

# 安装前端依赖
cd packages/nextjs
yarn install

# 安装区块链依赖
cd ../hardhat
yarn install
```

#### 启动本地区块链网络
```bash
cd packages/hardhat
npx hardhat node
```

#### 部署智能合约
```bash
cd packages/hardhat
npx hardhat run scripts/deploy.js --network localhost
```

#### 启动前端应用
```bash
cd packages/nextjs
yarn dev
```

应用将运行在 http://localhost:3000

### 区块链网络配置
项目默认连接到本地 Hardhat 网络，你也可以修改 `packages/hardhat/hardhat.config.ts` 文件配置其他网络，如测试网或主网。

## 许可证
本项目采用 [MIT 许可证](LICENSE) 进行许可。

## 项目结构
```
MeiHua-07-Name/
└── packages/
    ├── nextjs/                     # 前端项目
    │   ├── app/                    # Next.js 应用程序目录
    │   │   ├── api/                # API路由
    │   │   ├── blockexplorer/      # 区块浏览器页面
    │   │   ├── debug/              # 调试页面
    │   │   ├── history/            # 历史记录页面
    │   │   ├── ipfsDownload/       # IPFS下载页面
    │   │   ├── ipfsUpload/         # IPFS上传页面
    │   │   ├── model3D_llq/        # 3D模型相关页面
    │   │   ├── myNFTs/             # 我的NFT页面
    │   │   ├── transfers/          # 转账页面
    │   │   ├── wasee3D_llq/        # 3D查看页面
    │   │   ├── airdropNFTs_llq/    # NFT空投页面
    │   │   ├── auctionNFTs_llq/    # NFT拍卖页面
    │   │   ├── boxNFTs_llq/        # NFT盲盒页面
    │   │   ├── createNFTs_llq/     # NFT创建页面
    │   │   ├── fragmentNFTs_llq/   # NFT碎片化页面
    │   │   ├── listNFTs_llq/       # NFT列表页面
    │   │   ├── marketNFTs_llq/     # NFT市场页面
    │   │   ├── mintNFTs_llq/       # NFT铸造页面
    │   │   ├── myFavorite_llq/     # 我的收藏页面
    │   │   ├── layout.tsx          # 应用布局组件
    │   │   └── page.tsx            # 主页面
    │   │
    │   ├── components/             # 共享组件
    │   │   ├── assets/             # 资产组件
    │   │   ├── model/              # 模型相关组件
    │   │   ├── scaffold-eth/       # scaffold-eth组件
    │   │   ├── Footer.tsx          # 页脚组件
    │   │   ├── Header.tsx          # 页头组件
    │   │   ├── ScaffoldEthAppWithProviders.tsx # 应用提供者组件
    │   │   ├── SwitchTheme.tsx     # 主题切换组件
    │   │   └── ThemeProvider.tsx   # 主题提供者组件
    │   │
    │   ├── contracts/              # 合约相关文件
    │   │   ├── deployedContracts.ts # 已部署合约信息
    │   │   └── externalContracts.ts # 外部合约信息
    │   │
    │   ├── hooks/                  # React钩子函数
    │   │   └── scaffold-eth/       # 脚手架钩子函数
    │   │
    │   ├── public/                 # 静态资源
    │   │   ├── images/             # 图片资源
    │   │   ├── model/              # 模型资源
    │   │   ├── emo01.gif           # 表情GIF
    │   │   ├── favicon.png         # 网站图标
    │   │   ├── gif01.gif           # GIF资源
    │   │   ├── hero.png            # 英雄图片
    │   │   ├── hou01.gif           # GIF资源
    │   │   ├── logo.svg            # 徽标SVG
    │   │   ├── manifest.json       # 应用清单
    │   │   ├── thumbnail.png       # 缩略图
    │   │   ├── wechat.png          # 微信图标
    │   │   └── zoulu01.gif         # GIF资源
    │   │
    │   ├── services/               # 服务
    │   │   ├── store/              # 状态管理
    │   │   └── web3/               # Web3服务
    │   │
    │   ├── styles/                 # 样式文件
    │   │   └── globals.css         # 全局样式
    │   │
    │   ├── types/                  # 类型定义
    │   │   ├── abitype/            # ABI类型
    │   │   └── utils.ts            # 工具类型
    │   │
    │   ├── utils/                  # 工具函数
    │   │   ├── generateMerkle_llq/ # Merkle树生成工具
    │   │   ├── scaffold-eth/       # 脚手架工具
    │   │   ├── simpleNFT/          # 简单NFT工具
    │   │   └── db.ts               # 数据库工具
    │   │
    │   ├── .eslintignore           # ESLint忽略文件
    │   ├── .eslintrc.json          # ESLint配置
    │   ├── .gitignore              # Git忽略文件
    │   ├── .next/                  # Next.js构建文件
    │   ├── .npmrc                  # NPM配置
    │   ├── .prettierrc.json        # Prettier配置
    │   ├── next-env.d.ts           # Next.js环境定义
    │   ├── next.config.js          # Next.js配置
    │   ├── node_modules/           # 依赖包
    │   ├── package.json            # 项目依赖
    │   ├── postcss.config.js       # PostCSS配置
    │   ├── scaffold.config.ts      # 脚手架配置
    │   ├── tailwind.config.js      # TailwindCSS配置
    │   ├── tsconfig.json           # TypeScript配置
    │   └── vercel.json             # Vercel配置
    │
    └── hardhat/                    # 区块链后端项目
        ├── artifacts/              # 编译后的合约工件
        ├── cache/                  # Hardhat缓存文件
        ├── contracts/              # 智能合约代码
        │   └── YourCollectible.sol # NFT合约文件
        ├── deploy/                 # 部署脚本
        │   ├── 00_deploy_your_contract.ts # 主合约部署脚本
        │   └── 99_generateTsAbis.ts      # TypeScript ABI生成脚本
        ├── deployments/            # 部署记录
        ├── node_modules/           # 依赖包
        ├── scripts/                # 辅助脚本
        │   ├── generateAccount.ts  # 账户生成脚本
        │   └── listAccount.ts      # 账户列表脚本
        ├── test/                   # 测试文件
        │   └── Challenge0.ts       # 测试用例
        ├── typechain-types/        # TypeScript类型定义
        ├── .eslintignore           # ESLint忽略文件
        ├── .eslintrc.json          # ESLint配置
        ├── .gitignore              # Git忽略文件
        ├── .prettierrc.json        # Prettier配置
        ├── hardhat.config.ts       # Hardhat配置文件
        ├── package.json            # 项目依赖
        └── tsconfig.json           # TypeScript配置
