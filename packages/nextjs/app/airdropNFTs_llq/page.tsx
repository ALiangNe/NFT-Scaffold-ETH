"use client";

import { useEffect, useState, useRef } from "react";
import { generateMerkleTree, generateMerkleProof } from "~~/utils/generateMerkle_llq/generateMerkle_llq";
import { airdropAddresses } from "~~/utils/generateMerkle_llq/airdropAddresses_llq";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import confetti from 'canvas-confetti';

// 教程，设置默克尔树，生成proof，领取空投
const AirdropNFTs = () => {
  const [merkleRoot, setMerkleRoot] = useState<string>(""); // Merkle Root 状态
  const [userAddress, setUserAddress] = useState<string>(""); // 用户输入的地址
  const [userProof, setUserProof] = useState<string[] | null>(null); // 生成的 Proof
  const [transferredNFTs, setTransferredNFTs] = useState<any[]>([]); // 已转移的 NFT 列表
  const [loading, setLoading] = useState(false); // 加载状态
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制模态框的开关
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const toggleAddressModal = () => {
    setIsAddressModalOpen(!isAddressModalOpen);
  };

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const isLoaded = useRef(false); // 避免重复加载

  useEffect(() => {
    if (!yourCollectibleContract || isLoaded.current) return; // 防止重复加载
    isLoaded.current = true;

    const fetchTransferredNFTs = async () => {
      setLoading(true);
      try {
        const transferredTokenIds = await yourCollectibleContract.read.getTemporarilyTransferredNFTs();

        const nfts = await Promise.all(
          transferredTokenIds.map(async (tokenId: bigint) => {
            const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
            const owner = await yourCollectibleContract.read.ownerOf([tokenId]);
            const [originalOwner, returnTime] = await yourCollectibleContract.read.temporaryTransfers([tokenId]);
            const metadata = await getMetadataFromIPFS(tokenURI as string);

            const countdown = returnTime > Math.floor(Date.now() / 1000)
              ? Number(returnTime) - Math.floor(Date.now() / 1000)
              : 0;

            console.log(`Token ID: ${Number(tokenId)}, Return Time: ${Number(returnTime)}, Countdown: ${countdown}`);

            return {
              id: Number(tokenId),
              uri: tokenURI,
              owner,
              returnTime: Number(returnTime), // 转换为数字
              countdown,
              ...metadata,
            };
          })
        );

        setTransferredNFTs(nfts);
      } catch (error) {
        console.error("Failed to load temporarily transferred NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransferredNFTs();
  }, [yourCollectibleContract]);

  // 初始化倒计时
  useEffect(() => {
    const interval = setInterval(() => {
      setTransferredNFTs(prev =>
        prev.map(nft => ({
          ...nft,
          countdown: nft.returnTime > Math.floor(Date.now() / 1000)
            ? nft.returnTime - Math.floor(Date.now() / 1000)
            : 0,
        }))
      );
    }, 1000);

    return () => clearInterval(interval); // 清除计时器
  }, [transferredNFTs]);

  // 生成 Merkle Root
  const handleGenerateMerkle = () => {
    const { tree, merkleRoot } = generateMerkleTree(airdropAddresses);
    setMerkleRoot(merkleRoot); // 设置 Merkle Root 到状态
    console.log("Merkle Root:", merkleRoot);
  };

  // 生成 Merkle Proof
  const handleGenerateProof = () => {
    const { tree } = generateMerkleTree(airdropAddresses);

    if (!airdropAddresses.includes(userAddress)) {
      console.error("Address not in airdrop list");
      setUserProof(null);
      return;
    }

    const proof = generateMerkleProof(tree, userAddress);
    setUserProof(proof);
    console.log(`Merkle Proof for ${userAddress}:`, proof);
  };

  // 链上设置 Merkle Root
  const handleSetMerkleRoot = async () => {
    try {
      const { merkleRoot } = generateMerkleTree(airdropAddresses);
      console.log("Setting Merkle Root:", merkleRoot);

      await writeContractAsync({
        functionName: "setMerkleRoot",
        args: [merkleRoot],
      });

      console.log("Merkle Root set successfully on chain!");
    } catch (err) {
      console.error("Error setting Merkle Root:", err);
    }
  };

  // 停止空投（调用 retrieveExpiredNFTs）
  const handleStopAirdrop = async () => {
    try {
      // 获取所有 NFT Token Ids
      const tokenIds = transferredNFTs.map(nft => nft.id);

      // 调用合约的 retrieveExpiredNFTs 函数
      await writeContractAsync({
        functionName: "retrieveExpiredNFTs",
        args: [tokenIds],
      });

      notification.success("空投已成功停止");
    } catch (err) {
      console.error("Error stopping airdrop:", err);
      notification.error("停止空投失败");
    }
  };

  // 添加烟花效果函数
  const triggerConfetti = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    
    // 随机颜色生成器
    const randomColor = () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const defaults = { 
      startVelocity: 45, 
      spread: 360, 
      ticks: 100,
      zIndex: 9999,
      shapes: ['circle', 'square'],
      colors: [randomColor(), randomColor(), randomColor()]
    };

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);

      // 从四个角发射烟花
     

    }, 200);

    // 增强最后的爆炸效果
    setTimeout(() => {
      // 第一波爆炸
      confetti({
        particleCount: 300,
        spread: 180,
        origin: { x: 0.5, y: 0.5 },
        colors: [randomColor(), randomColor(), randomColor()],
        ticks: 300,
        startVelocity: 45,
        shapes: ['star'],
        scalar: 1.8
      });

      // 延迟200ms后的第二波爆炸
      

    }, duration - 1000);
  };

  // 修改领取空投函数，添加烟花效果
  const handleClaimAirdrop = async (tokenId: number) => {
    if (!userProof) {
      notification.error("请先生成 Merkle proof");
      return;
    }

    try {
      await writeContractAsync({
        functionName: "claimAirdrop",
        args: [userProof, BigInt(tokenId)],
      });

      notification.success("空投领取成功");
      // 触发烟花效果
      triggerConfetti();
    } catch (err) {
      console.error("Error claiming airdrop:", err);
      notification.error("空投领取失败");
    }
  };

  // 控制模态框显示/隐藏
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-emerald-100/20 to-teal-100/20 pointer-events-none" />

      {/* 顶部横幅 */}
      <div className="w-full bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 p-1">
        <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
          <span className="animate-pulse">🎁 NFT 空投奖励已开放！</span>
        </div>
      </div>


      {/* 介绍标题区域 */}
      <div className="flex items-center flex-col pt-10">
        <div className="px-5 text-center max-w-3xl">
          <h1 className="text-center mb-4">
            <span className="block text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500">
              NFT 空投
            </span>
          </h1>
          <p className="text-xl text-base-content/70 mb-6">
            参与我们的专属 NFT 空投！领取您的奖励，成为我们蓬勃发展的数字社区的一部分。
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="badge badge-lg bg-green-100 text-green-800 border-green-200 gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              免费奖励
            </div>
            <div className="badge badge-lg bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              安全领取
            </div>
            <div className="badge badge-lg bg-teal-100 text-teal-800 border-teal-200 gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              社区奖励
            </div>
          </div>
        </div>
      </div>






      <div className="flex flex-col items-center pt-10">

        {/* Button group */}
        <div className="flex gap-4 mb-6">
          <button className="btn btn-info" onClick={toggleModal}>
            领取空投教程
          </button>
          <button className="btn btn-success" onClick={toggleAddressModal}>
            查看空投地址
          </button>
        </div>

        {/* 模态框 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="modal modal-open">
              <div className="modal-box max-w-4xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden">
                {/* 模态框标题 */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
                  <h2 className="text-3xl font-bold text-white">领取空投教程</h2>
                </div>

                {/* 模态框内容 - 使用 flex 布局并排显示两个卡片 */}
                <div className="p-8">
                  <div className="flex gap-6">
                    {/* 左侧卡片 - Merkle Root 相关 */}
                    <div className="flex-1">
                      <div className="card bg-base-100 shadow-lg rounded-2xl h-full">
                        <div className="card-body space-y-6">
                          <h3 className="text-xl font-bold text-center text-gray-800">第一步：生成并设置 Merkle Root</h3>

                          {/* Generate Merkle Root 部分 */}
                          <div className="flex flex-col items-center">
                            <button
                              className="btn btn-primary w-full font-bold text-lg rounded-xl
                                     hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                              onClick={handleGenerateMerkle}
                            >
                              生成 Merkle Root
                            </button>

                            {merkleRoot && (
                              <div className="mt-4 w-full bg-gray-50 rounded-xl p-6">
                                <p className="text-lg font-bold text-center text-gray-800 mb-3">Merkle Root:</p>
                                <p className="break-all text-gray-600 font-mono text-sm text-center">{merkleRoot}</p>
                              </div>
                            )}
                          </div>

                          {/* Set Merkle Root 部分 */}
                          <div className="flex justify-center mt-4">
                            <button
                              className="btn btn-secondary w-full font-bold text-lg rounded-xl
                                     hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                              onClick={handleSetMerkleRoot}
                            >
                              设置 Merkle Root
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右侧卡片 - Proof 相关 */}
                    <div className="flex-1">
                      <div className="card bg-base-100 shadow-lg rounded-2xl h-full">
                        <div className="card-body space-y-6">
                          <h3 className="text-xl font-bold text-center text-gray-800">第二步：生成您的 Proof</h3>

                          {/* 地址输入区域 */}
                          <div className="flex flex-col items-center space-y-4">
                            <input
                              type="text"
                              value={userAddress}
                              onChange={e => setUserAddress(e.target.value)}
                              placeholder="输入您的地址"
                              className="input input-bordered w-full text-lg rounded-xl focus:input-primary text-center"
                            />
                            <button
                              className="btn btn-accent w-full font-bold text-lg rounded-xl
                                     hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                              onClick={handleGenerateProof}
                            >
                              生成 Proof
                            </button>
                          </div>

                          {/* Proof 显示区域 */}
                          {userProof && (
                            <div className="bg-gray-50 rounded-xl p-6 w-full">
                              <p className="text-lg font-bold text-center text-gray-800 mb-3">Merkle Proof:</p>
                              <pre className="break-all text-gray-600 font-mono text-sm whitespace-pre-wrap text-center">
                                {JSON.stringify(userProof, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 模态框底部 */}
                <div className="modal-action bg-gray-50 p-6 flex justify-center">
                  <button
                    className="btn btn-lg bg-gradient-to-r from-primary to-secondary text-white border-none
                             hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200
                             font-bold text-lg px-12 rounded-xl"
                    onClick={toggleModal}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address Modal */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="modal modal-open">
              <div className="modal-box max-w-2xl bg-white rounded-2xl shadow-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-success to-success/70 p-6 text-center">
                  <h2 className="text-3xl font-bold text-white">空投地址列表</h2>
                </div>

                <div className="p-8 space-y-4">
                  {airdropAddresses.map((address, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl">
                      <p className="font-mono break-all text-center">{address}</p>
                    </div>
                  ))}
                </div>

                <div className="modal-action bg-gray-50 p-6 flex justify-center">
                  <button
                    className="btn btn-lg bg-gradient-to-r from-success to-success/70 text-white border-none
                       hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200
                       font-bold text-lg px-12 rounded-xl"
                    onClick={toggleAddressModal}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NFT展示区域 */}
        <div className="mt-8 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">已转移的 NFT</h2>
          
          {transferredNFTs.length === 0 ? (
            <p className="text-lg text-gray-600 text-center">暂无已转移的 NFT。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
              {transferredNFTs.map(nft => (
                <div key={nft.id} className="card bg-base-100 shadow-lg w-[350px] shadow-secondary hover:shadow-2xl transition-shadow duration-300">
                  <figure className="relative">
                    <img src={nft.image} alt="NFT Image" className="h-[280px] min-w-full object-cover" />
                    <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
                      <span className="text-white"># {nft.id}</span>
                    </figcaption>
                  </figure>
                  <div className="card-body space-y-3 p-6">
                    <div className="flex items-center justify-center">
                      <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
                      <div className="flex flex-wrap space-x-2 mt-1">
                        {nft.attributes?.map((attr, index) => (
                          <span key={index} className="badge badge-primary py-3">{attr.value}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center mt-1">
                      <p className="my-0 text-lg">{nft.description}</p>
                    </div>
                    <div className="flex space-x-3 mt-1 items-center">
                      <span className="text-lg font-semibold">拥有者：</span>
                      <Address address={nft.owner} />
                    </div>
                    <p className="text-red-500 text-lg mt-2">
                      {nft.countdown > 0
                        ? `转移结束倒计时：${Math.floor(nft.countdown / 3600)}时 ${Math.floor((nft.countdown % 3600) / 60)}分 ${nft.countdown % 60}秒`
                        : "转移已结束"}
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        className="btn btn-danger w-full" 
                        onClick={handleStopAirdrop}
                      >
                        停止空投
                      </button>
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => handleClaimAirdrop(nft.id)}
                      >
                        领取空投
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirdropNFTs;
