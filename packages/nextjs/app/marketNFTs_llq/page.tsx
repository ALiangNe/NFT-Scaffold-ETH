"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./_components_llq/NFTCard_llq";
import type { NextPage } from "next";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { notification } from "~~/utils/scaffold-eth";
import { Collectible } from "./_components_llq/MyHoldings_llq";

const MarketNFTs: NextPage = () => {
  const [listedNFTs, setListedNFTs] = useState<Collectible[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(false);
  const [contractLoaded, setContractLoaded] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [category, setCategory] = useState(""); // 添加类别状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 获取所有上架的NFT
  useEffect(() => {
    const fetchListedNFTs = async () => {
      if (!yourCollectibleContract || contractLoaded) return;
      setLoading(true);

      try {
        const listedTokenIds = await yourCollectibleContract.read.getListedNFTs();

        const nfts = await Promise.all(
          listedTokenIds.map(async (tokenId: bigint) => {
            const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
            const owner = await yourCollectibleContract.read.ownerOf([tokenId]);
            const price = await yourCollectibleContract.read.getListingPrice([tokenId]);

            const metadata = await getMetadataFromIPFS(tokenURI as string);

            return {
              id: Number(tokenId),
              uri: tokenURI,
              owner,
              price: Number(price) / 1e18,
              ...metadata,
            };
          })
        );

        setListedNFTs(nfts);
        setFilteredNFTs(nfts);
        setContractLoaded(true);
      } catch (error) {
        notification.error("Failed to load listed NFTs");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchListedNFTs();
  }, [yourCollectibleContract, contractLoaded]);

  // 更新过滤后的NFT
  const handleFilter = () => {
    const minPrice = parseFloat(priceRange.min || "0");
    const maxPrice = parseFloat(priceRange.max || "Infinity");

    const filtered = listedNFTs.filter((nft) => {
      const inPriceRange = nft.price >= minPrice && nft.price <= maxPrice;
      const inCategory = category === "" || nft.attributes?.some((attr) => attr.value === category);
      return inPriceRange && inCategory;
    });

    setFilteredNFTs(filtered);
    setCurrentPage(1); // 重置到第一页
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNFTs = filteredNFTs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
      <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-1">
        <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
                <span className="animate-pulse">🌟 高级 NFT 交易市场现已上线！</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-10">
        {/* 标题区域 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">
            NFT 交易市场
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            发现、收藏和交易非凡的 NFT。这里是您进入数字艺术和收藏品世界的门户。
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span>精选收藏</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <span>安全交易</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <span>活跃社区</span>
            </div>
          </div>
        </div>

        {/* 过滤器区域 */}
        <div className="bg-base-200 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">发现您的完美 NFT</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <input
              type="text"
              placeholder="最低价格 (ETH)"
              className="input input-bordered w-36"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            />
            <input
              type="text"
              placeholder="最高价格 (ETH)"
              className="input input-bordered w-36"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            />
            <input
              type="text"
              placeholder="搜索类别"
              className="input input-bordered w-40"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <button 
              className="btn btn-primary hover:scale-105 transition-transform duration-300"
              onClick={handleFilter}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-1.414.707l-4-2A1 1 0 018 18.586V13.707L1.293 7.293A1 1 0 011 6.586V4z"/>
              </svg>
              筛选
            </button>
          </div>
        </div>

        {/* NFT 展示区域 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="loading loading-spinner loading-lg text-indigo-500"></div>
            <p className="text-base-content/70">正在发现精彩 NFT...</p>
          </div>
        ) : filteredNFTs.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎨</div>
            <div className="text-2xl font-semibold text-base-content">未找到 NFT</div>
            <p className="text-base-content/70">请尝试调整搜索条件</p>
          </div>
        ) : (
          <>
            {/* 市场统计 */}
            <div className="text-center mb-8">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">已上架 NFT</div>
                  <div className="stat-value text-indigo-500">{filteredNFTs.length}</div>
                  <div className="stat-desc">可供购买</div>
                </div>
              </div>
            </div>

            {/* NFT 网格 */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {currentNFTs.map((nft) => (
                  <NFTCard nft={nft} key={nft.id} />
                ))}
              </div>

              {/* 分页控制器 */}
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn btn-sm ${pageNum === currentPage ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部信息 */}
      <div className="w-full mt-20 bg-base-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-8">为什么选择我们的市场？</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">💎</div>
                <h4 className="text-xl font-bold mb-2">精选收藏</h4>
                <p>只有最优质的数字资产才能进入我们的市场</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="text-xl font-bold mb-2">安全交易</h4>
                <p>智能合约保证所有交易的安全性</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">🌟</div>
                <h4 className="text-xl font-bold mb-2">独特功能</h4>
                <p>高级筛选和收藏夹系统</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketNFTs;
