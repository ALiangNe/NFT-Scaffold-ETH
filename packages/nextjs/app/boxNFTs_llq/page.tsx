"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./_components_llq/NFTCard_llq";
import type { NextPage } from "next";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface MysteryBox {
  id: number;
  tokenIds: number[];
  price: string;
}

const MarketNFTs: NextPage = () => {
  const [boxNFTs, setBoxNFTs] = useState<MysteryBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [contractLoaded, setContractLoaded] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });
  
// 获取盲盒数据
  useEffect(() => {
    const fetchBoxNFTs = async () => {
      if (!yourCollectibleContract || contractLoaded) return;
      setLoading(true);

      try {
        // 获取所有盲盒id
        const boxIds = await yourCollectibleContract.read.getAllBoxIds();

        const boxes = await Promise.all(
          boxIds.map(async (boxId: bigint) => {
            const details = await yourCollectibleContract.read.getBoxDetails([boxId]);
            const tokenIds = details[1].map((id: bigint) => Number(id));
            const price = (Number(details[3]) / 1e18).toFixed(2); // 转换为 ETH
            const opened = details[4]; // 获取盲盒是否已购买（打开）

            // 只保留未被购买的盲盒
            if (!opened) {
              return {
                id: Number(boxId),
                tokenIds,
                price,
              };
            }
            return null; // 过滤掉已购买的盲盒
          })
        );

        // 过滤掉 null 值的项
        setBoxNFTs(boxes.filter((box) => box !== null));
        setContractLoaded(true);
      } catch (error) {
        notification.error("Failed to load mystery boxes");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoxNFTs();
  }, [yourCollectibleContract, contractLoaded]);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-base-300 to-base-100">
      {/* 顶部横幅 */}
      <div className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 p-1">
        <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
          <span className="animate-pulse">✨ 神秘盲盒正在发售！</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-10">
        {/* 标题区域 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-500 to-pink-500">
            NFT 神秘盲盒
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            解锁未知的惊喜！每个盲盒都包含独特的数字珍藏，等待您的发现。体验揭晓专属 NFT 的刺激！
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
              </svg>
              <span>稀有 NFT</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <span>安全购买</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
              </svg>
              <span>专属内容</span>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="loading loading-spinner loading-lg text-fuchsia-500"></div>
            <p className="text-base-content/70">正在加载神秘盲盒...</p>
          </div>
        ) : boxNFTs.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎁</div>
            <div className="text-2xl font-semibold text-base-content">暂无可用盲盒</div>
            <p className="text-base-content/70">敬请期待新的盲盒上架！</p>
          </div>
        ) : (
          <>
            {/* 盲盒统计 */}
            <div className="text-center mb-8">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">可用盲盒</div>
                  <div className="stat-value text-fuchsia-500">{boxNFTs.length}</div>
                  <div className="stat-desc">等待开启</div>
                </div>
              </div>
            </div>

            {/* 盲盒网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {boxNFTs.map((box) => (
                <NFTCard box={box} key={box.id} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 底部信息 */}
      <div className="w-full mt-20 bg-base-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-8">盲盒购买指南</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">1️⃣</div>
                <h4 className="text-xl font-bold mb-2">选择盲盒</h4>
                <p>从我们精心策划的盲盒系列中选择</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">2️⃣</div>
                <h4 className="text-xl font-bold mb-2">购买</h4>
                <p>使用 ETH 完成购买</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">3️⃣</div>
                <h4 className="text-xl font-bold mb-2">揭晓 NFT</h4>
                <p>发现您的独特数字收藏品</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketNFTs;


