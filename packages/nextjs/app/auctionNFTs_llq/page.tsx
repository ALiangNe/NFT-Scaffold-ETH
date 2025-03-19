"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./_components_llq/NFTCard_llq";
import type { NextPage } from "next";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Collectible } from "./_components_llq/MyHoldings_llq";

const AuctionNFTs: NextPage = () => {
  const [auctionedNFTs, setAuctionedNFTs] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); // 避免重复加载

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 插入数据到数据库
  useEffect(() => {
    const fetchAuctionedNFTs = async () => {
      if (!yourCollectibleContract || loaded) return;
      setLoading(true);
  
      try {
        const auctionedTokenIds = await yourCollectibleContract.read.getAuctionedNFTs();
  
        const nfts = await Promise.all(
          auctionedTokenIds.map(async (tokenId: bigint) => {
            try {
              const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
  
              // Fetch metadata from tokenURI
              const response = await fetch(tokenURI);
              const metadata = await response.json();
  
              // Process IPFS image URLs
              let imageUrl = metadata.image;
              if (imageUrl.startsWith("ipfs://")) {
                imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
              }
  
              const [
                seller,
                startPrice,
                minIncrement,
                endTime,
                highestBidder,
                highestBid,
                ended,
              ] = await yourCollectibleContract.read.getAuctionDetails([tokenId]);
  
              // 返回字段
              return {
                id: Number(tokenId),
                uri: tokenURI,
                image: imageUrl, // Processed image URL
                name: metadata.name || `NFT #${Number(tokenId)}`, // Name fallback
                description: metadata.description || "No description provided.",
                attributes: metadata.attributes || [], // Fallback to an empty array
                highestBid: highestBid.toString(),
                highestBidder,
                endTime: Number(endTime),
                startPrice: startPrice.toString(),
                minIncrement: minIncrement.toString(),
              };
            } catch (err) {
              console.error(`Error fetching details for token ID ${tokenId}`, err);
              return null;
            }
          })
        );
  
        setAuctionedNFTs(nfts.filter(nft => nft !== null));
        setLoaded(true);
      } catch (error) {
        notification.error("Failed to load auctioned NFTs");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAuctionedNFTs();
  }, [yourCollectibleContract, loaded]);
  

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
      <div className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-1">
        <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
          <span className="animate-pulse">🔥 NFT 拍卖正在进行！</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-10">
        {/* 标题区域 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            NFT 拍卖行
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            发现独特的数字珍品并参与竞拍专属 NFT。每件作品都讲述一个故事，每场拍卖都创造历史。
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span>实时竞拍</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>安全交易</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>认证艺术家</span>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-base-content/70">正在发现精彩 NFT...</p>
          </div>
        ) : auctionedNFTs.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">🎨</div>
            <div className="text-2xl font-semibold text-base-content">暂无进行中的拍卖</div>
            <p className="text-base-content/70">请稍后再来查看新的拍品！</p>
          </div>
        ) : (
          <>
            {/* 拍卖计数器 */}
            <div className="text-center mb-8">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">进行中的拍卖</div>
                  <div className="stat-value text-primary">{auctionedNFTs.length}</div>
                  <div className="stat-desc">正在进行</div>
                </div>
              </div>
            </div>

            {/* NFT 网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {auctionedNFTs.map(nft => (
                <NFTCard nft={nft} key={nft.id} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 底部装饰 */}
      <div className="w-full mt-20 bg-base-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">为什么选择我们的拍卖平台？</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
                  </svg>
                  透明
                </h4>
                <p>所有竞价和交易都记录在区块链上</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  安全
                </h4>
                <p>智能合约保证拍卖的安全性和公平性</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                  社区
                </h4>
                <p>加入蓬勃发展的 NFT 爱好者社区</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionNFTs;
