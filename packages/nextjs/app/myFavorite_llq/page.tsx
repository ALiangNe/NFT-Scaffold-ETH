"use client";

import { MyHoldings } from "./_components_llq/index_llq";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import nftsMetadata from "~~/utils/simpleNFT/nftsMetadata";
import { usePublicClient } from "wagmi";
import { saveNFTToDB } from "~~/utils/db";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  const publicClient = usePublicClient(); // 获取公共客户端

  const handleMintItem = async () => {
    // circle back to the zero item if we've reached the end of the array
    if (tokenIdCounter === undefined) return;

    const tokenIdCounterNumber = Number(tokenIdCounter);
    const currentTokenMetaData = nftsMetadata[tokenIdCounterNumber % nftsMetadata.length];
    const notificationId = notification.loading("Uploading to IPFS");
    try {
      const uploadedItem = await addToIPFS(currentTokenMetaData);
      console.log(uploadedItem.IpfsHash);

      // First remove previous loading notification and then show success notification
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      await writeContractAsync({
        functionName: "mintItem",
        // args: [connectedAddress, uploadedItem.path],
        args: [connectedAddress, uploadedItem.IpfsHash],
      });

      // 返回交易数据
      const mintTx = await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, uploadedItem.IpfsHash,BigInt(500)],
      })

      console.log("mintTx-------",mintTx);
      const receipt = await publicClient?.getTransactionReceipt({hash:mintTx as `0x${string}`});
      console.log("receipt-------",receipt);
      const nft_id = receipt?.logs[0].topics[3];
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      console.log("numericId-------",numericId);
      const mint_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if(nft_id){
        const data = {
          nft_id: numericId,
          token_uri: uploadedItem.IpfsHash,
          mint_time: mint_time,
          owner: connectedAddress,
          creator: connectedAddress,
          state:0,
          royaltyFeeNumerator:500
        };
        await saveNFTToDB(data);
      }

    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 via-purple-100/20 to-indigo-100/20 pointer-events-none" />
        
        {/* 顶部横幅 */}
        <div className="w-full bg-gradient-to-r from-pink-600 via-purple-500 to-indigo-600 p-1">
          <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
            <span className="animate-pulse">✨ 您的精选 NFT 收藏</span>
          </div>
        </div>

        {/* 介绍标题区域 */}
        <div className="flex items-center flex-col pt-10">
          <div className="px-5 text-center max-w-3xl">
            <h1 className="text-center mb-4">
              <span className="block text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                我的收藏夹
              </span>
            </h1>
            <p className="text-xl text-base-content/70 mb-6">
              您珍藏的数字资产个人画廊。在这里发现、收藏和管理您喜爱的 NFT。
            </p>
            
            {/* 特性标签 */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="badge badge-lg bg-pink-100 text-pink-800 border-pink-200 gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
                收藏夹
              </div>
              <div className="badge badge-lg bg-purple-100 text-purple-800 border-purple-200 gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                </svg>
                收藏集
              </div>
              <div className="badge badge-lg bg-indigo-100 text-indigo-800 border-indigo-200 gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/>
                </svg>
                管理
              </div>
            </div>

            
          </div>
        </div>
      </div>

      {/* 保持原有的组件不变 */}
      {/* <div className="flex justify-center">
        {!isConnected || isConnecting ? (
          <RainbowKitCustomConnectButton />
        ) : (
          <button className="btn btn-secondary" onClick={handleMintItem}>
            Mint NFT
          </button>
        )}
      </div> */}
      <MyHoldings />
    </>
  );
};

export default MyNFTs;
