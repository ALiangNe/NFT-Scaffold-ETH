"use client";

import { useEffect, useState, useRef } from "react";
import { NFTCard } from "./NFTCard_llq";
import { useAccount } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myFavorites, setMyFavorites] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);  // 用于标记请求是否已经发起

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // --获取用户收藏的 NFT 列表
  const fetchFavorites = async () => {
    if (!connectedAddress || !yourCollectibleContract || hasFetchedRef.current) return;

    setLoading(true);
    hasFetchedRef.current = true;  // 防止重复发起请求

    try {
      // 调用合约方法获取收藏的 tokenId 列表
      const favorites = await yourCollectibleContract.read.getFavoritesForAddress([connectedAddress]);

      const favoritesWithMetadata: Collectible[] = await Promise.all(
        favorites.map(async (favorite: any) => {
          const tokenId = parseInt(favorite.tokenId.toString());
          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          const metadata = await getMetadataFromIPFS(tokenURI as string);

          return {
            id: tokenId,
            uri: tokenURI,
            owner: connectedAddress,
            ...metadata,
          };
        })
      );

      // 更新收藏数据
      setMyFavorites(favoritesWithMetadata);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      notification.error("Failed to load your favorite NFTs");
    } finally {
      setLoading(false);
    }
  };

  // 确保 useEffect 只在 connectedAddress 或 yourCollectibleContract 变化时触发
  useEffect(() => {
    if (connectedAddress && yourCollectibleContract && !hasFetchedRef.current) {
      fetchFavorites();
    }
  }, [connectedAddress, yourCollectibleContract]); // 只依赖这两个

  if (loading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      {myFavorites.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No Favorite NFTs found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {myFavorites.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </>
  );
};
