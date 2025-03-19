"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard_llq";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

interface FragmentInfo {
  tokenId: number;
  sellers: string[];
  prices: bigint[];
  shares: bigint[];
}

// 添加一个工具函数来转换 wei 到 ETH
const weiToEth = (wei: bigint): string => {
  return (Number(wei) / 1e18).toString();
};

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [fragmentedCollectibles, setFragmentedCollectibles] = useState<Collectible[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [fragmentInfo, setFragmentInfo] = useState<FragmentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 获取已碎片化的NFT列表
  useEffect(() => {
    const fetchFragmentedNFTs = async (): Promise<void> => {
      if (hasFetched || !yourCollectibleContract || !connectedAddress) return;

      setLoading(true);
      try {
        const fragmentedNFTIds = await yourCollectibleContract.read.getFragmentedNFTs([]);
        const collectibles = await Promise.all(
          fragmentedNFTIds.map(async tokenId => {
            try {
              const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
              const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);
              return {
                id: parseInt(tokenId.toString()),
                uri: tokenURI,
                owner: connectedAddress,
                ...nftMetadata,
              };
            } catch (e) {
              console.error(`Error fetching metadata for token ID ${tokenId}`, e);
              return null;
            }
          }),
        );

        const validCollectibles = collectibles.filter(Boolean) as Collectible[];
        validCollectibles.sort((a, b) => a.id - b.id);

        setFragmentedCollectibles(validCollectibles);
        setHasFetched(true);
      } catch (e) {
        notification.error("获取碎片化 NFT 失败");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchFragmentedNFTs();
  }, [yourCollectibleContract, connectedAddress, hasFetched]);

  // 获取上架碎片信息
  const handleViewListedShares = async (tokenId: number) => {
    if (!yourCollectibleContract) return;

    try {
      setSelectedNFT(tokenId);
      const listedNFTs = await yourCollectibleContract.read.getListedFragmentNFTs([]);
      
      if (listedNFTs.map(id => Number(id)).includes(tokenId)) {
        // 获取Fragment信息
        const fragment = await yourCollectibleContract.read.fragmentedNFTs([tokenId]);
        
        // 获取价格信息
        const price = await yourCollectibleContract.read.getSharePrice([tokenId]);
        
        // 获取合约持有的份额
        const contractShares = await yourCollectibleContract.read.getSharesOwned([tokenId, yourCollectibleContract.address]);
        
        // 检查是否还有可用份额
        if (contractShares <= 0n) {
          notification.info("该 NFT 暂无碎片出售");
          return;
        }

        setFragmentInfo({
          tokenId,
          sellers: [connectedAddress],
          prices: [price],
          shares: [contractShares]
        });
        setIsModalOpen(true);
      } else {
        setFragmentInfo(null);
        notification.info("该 NFT 暂无上架碎片");
      }
    } catch (e) {
      console.error("Error fetching listed shares:", e);
      notification.error("获取上架碎片信息失败");
    }
  };

  // 模态框组件
  const FragmentModal = () => {
    if (!fragmentInfo) return null;

    const selectedNFTData = fragmentedCollectibles.find(nft => nft.id === fragmentInfo.tokenId);
    if (!selectedNFTData) return null;

    // 检查是否有可用份额
    const hasAvailableShares = fragmentInfo.shares.some(shares => shares > 0n);

    if (!hasAvailableShares) {
      return (
        <div className={`modal ${isModalOpen ? "modal-open" : ""}`}>
          <div className="modal-box relative">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <div className="flex justify-center items-center h-32">
              <p className="text-lg">该 NFT 暂无碎片出售</p>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      );
    }

    // 添加购买份数的状态
    const [purchaseShares, setPurchaseShares] = useState<{ [key: string]: number }>({});

    // 添加购买处理函数
    const handleBuyShares = async (tokenId: number, seller: string, maxShares: bigint, pricePerShare: bigint) => {
      const sharesToBuy = purchaseShares[seller] || 0;
      if (sharesToBuy <= 0) {
        notification.error("请输入有效的购买份数");
        return;
      }
      if (sharesToBuy > Number(maxShares)) {
        notification.error("购买份数不能超过可用份数");
        return;
      }

      const notificationId = notification.loading("正在处理购买...");

      try {
        await writeContractAsync({
          functionName: "buyListedShares",
          args: [BigInt(tokenId), seller, BigInt(sharesToBuy)],
          value: BigInt(sharesToBuy) * pricePerShare,
        });

        notification.success("购买成功！");
        setIsModalOpen(false);
        setHasFetched(false);
      } catch (error) {
        notification.error("购买失败");
        console.error(error);
      } finally {
        notification.remove(notificationId);
      }
    };

    // 处理份数输入变化
    const handleSharesChange = (seller: string, value: string) => {
      const shares = parseInt(value) || 0;
      setPurchaseShares(prev => ({
        ...prev,
        [seller]: shares
      }));
    };

    return (
      <div className={`modal ${isModalOpen ? "modal-open" : ""}`}>
        <div className="modal-box relative">
          <button
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>
          <h3 className="text-lg font-bold mb-4">碎片详情</h3>
          
          {/* NFT 信息 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24">
              <img src={selectedNFTData.image} alt={selectedNFTData.name} className="rounded-lg" />
            </div>
            <div>
              <p className="font-bold">{selectedNFTData.name}</p>
              <p className="text-sm opacity-70">Token ID: {fragmentInfo.tokenId}</p>
            </div>
          </div>

          {/* 碎片信息 */}
          <div className="bg-base-200 p-4 rounded-lg">
            <h4 className="font-bold mb-2">上架碎片</h4>
            {fragmentInfo.sellers.map((seller, index) => (
              <div key={seller} className="mb-2 p-2 bg-base-300 rounded-lg">
                <p className="text-sm">
                  卖家：{seller.slice(0, 6)}...{seller.slice(-4)}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm">可用份数：{fragmentInfo.shares[index].toString()}</span>
                  <span className="text-sm font-bold">
                    {weiToEth(fragmentInfo.prices[index])} ETH/份
                  </span>
                </div>
                
                {/* 添加份数输入框 */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    placeholder="输入购买份数"
                    min="1"
                    max={fragmentInfo.shares[index].toString()}
                    value={purchaseShares[seller] || ''}
                    onChange={(e) => handleSharesChange(seller, e.target.value)}
                  />
                  <span className="text-sm whitespace-nowrap">
                    总价：{((purchaseShares[seller] || 0) * Number(weiToEth(fragmentInfo.prices[index]))).toFixed(6)} ETH
                  </span>
                </div>

                <button 
                  className="btn btn-primary btn-sm w-full mt-2"
                  onClick={() => handleBuyShares(
                    fragmentInfo.tokenId,
                    seller,
                    fragmentInfo.shares[index],
                    fragmentInfo.prices[index]
                  )}
                  disabled={!purchaseShares[seller] || purchaseShares[seller] <= 0}
                >
                  购买碎片
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      {fragmentedCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">未找到碎片化 NFT</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {fragmentedCollectibles.map(item => (
            <div 
              key={item.id} 
              className="relative cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleViewListedShares(item.id)}
            >
              <NFTCard nft={item} />
            </div>
          ))}
        </div>
      )}
      <FragmentModal />
    </>
  );
};
