"use client";

import { MyHoldings } from "./_components_llq/index_llq";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

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
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-base-300 to-base-100">
      {/* 顶部横幅 */}
      <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-1">
        <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
          <span className="animate-pulse">✨ NFT 碎片化交易正在进行！</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-10">
        {/* 标题区域 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500">
            NFT 碎片化市场
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            探索 NFT 碎片化的无限可能！通过购买份额，以更低门槛参与优质 NFT 投资。
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              <span>低门槛投资</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
              <span>共同持有</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              <span>灵活交易</span>
            </div>
          </div>
        </div>

        {/* NFT 列表 */}
        <MyHoldings />

        {/* 底部信息 */}
        <div className="w-full mt-20 bg-base-200 py-8">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-8">碎片化交易指南</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-4">1️⃣</div>
                  <h4 className="text-xl font-bold mb-2">选择 NFT</h4>
                  <p>浏览并选择感兴趣的 NFT 资产</p>
                </div>
              </div>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-4">2️⃣</div>
                  <h4 className="text-xl font-bold mb-2">购买份额</h4>
                  <p>选择想要购买的份额数量</p>
                </div>
              </div>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-4">3️⃣</div>
                  <h4 className="text-xl font-bold mb-2">交易管理</h4>
                  <p>随时交易您的份额或赎回 NFT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyNFTs;
