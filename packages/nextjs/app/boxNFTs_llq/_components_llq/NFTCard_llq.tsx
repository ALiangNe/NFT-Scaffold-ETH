import { useState, useCallback, useEffect, useRef } from "react";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import confetti from 'canvas-confetti';

// NFT盲盒卡片组件的主要功能：
// 1. 展示盲盒基本信息
// 2. 提供盲盒详情查看
// 3. 实现盲盒购买功能
// 4. 添加开盒动画和特效

interface MysteryBoxProps {
  box: {
    id: number;
    tokenIds: number[];
    price: string;
  };
}

interface NFTDetails {
  tokenURI: string;
  owner: string;
  creator: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
  };
}

// 修改模态框组件
const DetailModal = ({ isOpen, onClose, box, nftDetails, loading, onBuy, isProcessing }: { 
  isOpen: boolean; 
  onClose: () => void; 
  box: MysteryBoxProps['box'];
  nftDetails: { [key: number]: NFTDetails };
  loading: boolean;
  onBuy: () => void;
  isProcessing: boolean;
}) => {
  const [spinningIndex, setSpinningIndex] = useState<number>(-1);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinningRef = useRef<NodeJS.Timeout | null>(null);

  // 处理购买和动画
  const handleBuyWithAnimation = async () => {
    setIsSpinning(true);
    let currentIndex = 0;
    
    // 开始转动动画
    spinningRef.current = setInterval(() => {
      setSpinningIndex(currentIndex % box.tokenIds.length);
      currentIndex++;
    }, 200); // 每200ms切换一次

    // 调用实际的购买函数
    try {
      // 调用购买盲盒按钮
      await onBuy();
      // 购买成功后，继续转动一段时间然后停止
      setTimeout(() => {
        if (spinningRef.current) {
          clearInterval(spinningRef.current);
        }
        setIsSpinning(false);
        setSpinningIndex(-1);
      }, 1000);
    } catch (error) {
      // 如果购买失败，立即停止动画
      if (spinningRef.current) {
        clearInterval(spinningRef.current);
      }
      setIsSpinning(false);
      setSpinningIndex(-1);
    }
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (spinningRef.current) {
        clearInterval(spinningRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 w-[90%] max-w-4xl m-4 transform transition-all shadow-2xl">
        {/* 添加顶部装饰 */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
            <span className="text-white font-bold tracking-wider">独家NFT收藏</span>
          </div>
        </div>

        {/* 标题和介绍文字 */}
        <div className="text-center mt-6 mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">Mystery Box #{box.id}</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            开启数字发现之旅。这个系列中的每个NFT都讲述着一个独特的故事，
            充满激情和创意。
          </p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-white/90">优质保证</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-white/90">安全交易</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
              </svg>
              <span className="text-white/90">稀有物品</span>
            </div>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题和价格信息 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Mystery Box #{box.id}</h2>
            <p className="text-lg text-white mt-2">Price: {box.price} ETH</p>
          </div>
          {/* 购买按钮 */}
          <button
            className={`btn btn-primary btn-lg mt-4 md:mt-0 ${isProcessing ? "loading" : ""} 
              hover:bg-opacity-90 transition-all duration-300`}
            onClick={handleBuyWithAnimation}
            disabled={isProcessing || isSpinning}
          >
            {isProcessing ? "处理中..." : "立即购买"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* --展示盲盒中的nft */}
            {box.tokenIds.map((tokenId, index) => {
              const details = nftDetails[tokenId];
              const isActive = spinningIndex === index;
              
              return (
                <div 
                  key={tokenId}
                  className={`bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 
                    backdrop-blur-sm shadow-xl transition-all duration-300 border border-white/10
                    ${isActive ? 'scale-110 shadow-2xl ring-2 ring-white/50 z-10' : 
                      isSpinning ? 'scale-95 opacity-50' : 'hover:-translate-y-1 hover:shadow-2xl'}`}
                >
                  {/* NFT 图片容器 */}
                  <div className={`relative aspect-square mb-4 rounded-lg overflow-hidden 
                    group transition-all duration-300
                    ${isActive ? 'ring-4 ring-white/30' : ''}`}
                  >
                    {details?.metadata?.image ? (
                      <>
                        <img
                          src={details.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                          alt={details.metadata.name || `NFT #${tokenId}`}
                          className={`w-full h-full object-cover rounded-lg transition-transform duration-500
                            ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                          transition-opacity duration-300
                          ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} 
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 
                        rounded-lg flex items-center justify-center">
                        <span className="text-white/70">暂无图片</span>
                      </div>
                    )}
                    
                    {/* NFT ID 标签 */}
                    <div className={`absolute top-2 right-2 px-3 py-1 backdrop-blur-md rounded-full 
                      text-sm font-medium transition-all duration-300
                      ${isActive ? 'bg-white text-black' : 'bg-black/50 text-white'}`}
                    >
                      #{Number(tokenId)}
                    </div>
                  </div>

                  {/* NFT 信息区域 */}
                  <div className={`space-y-3 transition-opacity duration-300 
                    ${isSpinning && !isActive ? 'opacity-50' : 'opacity-100'}`}
                  >
                    {/* 标题 */}
                    <h3 className="font-bold text-lg text-white truncate">
                      {details?.metadata?.name || `NFT #${tokenId}`}
                    </h3>
                    
                    {/* 描述 */}
                    {/* {details?.metadata?.description && (
                      <p className="text-sm text-white/70 line-clamp-2 h-10">
                        {details.metadata.description}
                      </p>
                    )} */}

                    {/* 创作者信息 */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">创作者</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-white font-medium truncate max-w-[120px]">
                            {details?.creator?.slice(0, 6)}...{details?.creator?.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 属性标签 */}
                    {/* {details?.metadata?.attributes && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {details.metadata.attributes.slice(0, 3).map((attr: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-white/10 rounded-full text-white/80"
                          >
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                    )} */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const NFTCard = ({ box }: MysteryBoxProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nftDetails, setNftDetails] = useState<{ [key: number]: NFTDetails }>({});
  const [loading, setLoading] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 获取NFT元数据
  const fetchMetadata = async (tokenURI: string) => {
    try {
      const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const response = await fetch(url);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  // 获取NFT详细信息
  const fetchNFTDetails = async () => {
    if (!yourCollectibleContract || loading) return;
    setLoading(true);

    try {
      const details = await Promise.all(
        box.tokenIds.map(async (tokenId) => {
          const tokenURI = await yourCollectibleContract.read.tokenURI([BigInt(tokenId)]);
          const creator = await yourCollectibleContract.read.getCreator([BigInt(tokenId)]);
          const owner = await yourCollectibleContract.read.ownerOf([BigInt(tokenId)]);
          const metadata = await fetchMetadata(tokenURI);

          return {
            tokenId,
            details: {
              tokenURI,
              creator,
              owner,
              metadata,
            }
          };
        })
      );

      const detailsMap = details.reduce((acc, { tokenId, details }) => {
        acc[tokenId] = details;
        return acc;
      }, {});

      setNftDetails(detailsMap);
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      notification.error("Failed to fetch NFT details");
    } finally {
      setLoading(false);
    }
  };

  // 打开模态框时获取NFT详情
  const handleShowDetails = async () => {
    setShowModal(true);
    await fetchNFTDetails();
  };

  // 添加烟花效果函数
  const triggerConfetti = useCallback(() => {
    // 创建更多绚丽的烟花效果
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    
    // 随机颜色生成器
    const randomColor = () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // 修改基础配置，增加 zIndex
    const defaults = { 
      startVelocity: 45, 
      spread: 360, 
      ticks: 100,
      zIndex: 9999,
      shapes: ['circle', 'square'],
      colors: [randomColor(), randomColor(), randomColor()]
    };

    // 随机范围数
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    // 创建密集的烟花效果
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      // 增加粒子数量
      const particleCount = 100 * (timeLeft / duration);

      // 从四个角发射烟花
      confetti({
        ...defaults,
        particleCount: particleCount / 2,
        origin: { x: 0.1, y: 0.9 }
      });
      confetti({
        ...defaults,
        particleCount: particleCount / 2,
        origin: { x: 0.9, y: 0.9 }
      });

      // 从顶部随机位置发射
      confetti({
        ...defaults,
        particleCount: particleCount,
        origin: { x: randomInRange(0.3, 0.7), y: 0.1 },
        gravity: 1.2, // 增加重力效果
        scalar: 1.2 // 增大粒子大小
      });

      // 添加螺旋效果
      confetti({
        ...defaults,
        particleCount: 15,
        angle: randomInRange(55, 125),
        spread: 40,
        origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.8) },
        colors: [randomColor()],
        ticks: 150
      });

    }, 200); // 缩短间隔时间，使效果更密集

    // 增强最后的爆炸效果
    setTimeout(() => {
      // 第一波爆炸
      confetti({
        particleCount: 300, // 增加到300个粒子
        spread: 180, // 增加扩散范围
        origin: { x: 0.5, y: 0.5 },
        colors: [randomColor(), randomColor(), randomColor()],
        ticks: 300, // 增加持续时间
        startVelocity: 45, // 增加初始速度
        shapes: ['star'],
        scalar: 1.8 // 增加粒子大小
      });

      // 延迟200ms后的第二波爆炸
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 160,
          origin: { x: 0.3, y: 0.5 },
          colors: [randomColor(), randomColor(), randomColor()],
          ticks: 250,
          startVelocity: 40,
          shapes: ['circle'],
          scalar: 1.6
        });
        confetti({
          particleCount: 200,
          spread: 160,
          origin: { x: 0.7, y: 0.5 },
          colors: [randomColor(), randomColor(), randomColor()],
          ticks: 250,
          startVelocity: 40,
          shapes: ['square'],
          scalar: 1.6
        });
      }, 200);

    }, duration - 1000);

  }, []);

  // --购买盲盒
  const handleBuyBox = async () => {
    setIsProcessing(true);
    const notificationId = notification.loading(`正在购买神秘盒子 #${box.id}...`);

    try {
      await writeContractAsync({
        functionName: "purchaseAndOpenMysteryBox",
        args: [BigInt(box.id)],
        value: BigInt(Number(box.price) * 1e18),
      });

      notification.success(`成功购买神秘盒子 #${box.id}！`);
      // 触发烟花效果
      triggerConfetti();
    } catch (error) {
      notification.error(`购买神秘盒子 #${box.id} 失败`);
      console.error(error);
    } finally {
      setIsProcessing(false);
      notification.remove(notificationId);
    }
  };

  return (
    <>
      <div className="card card-compact bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-lg w-[300px] p-4 rounded-lg transform hover:scale-105 transition-transform duration-300">
        {/* 添加光晕效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"></div>
        
        <div className="relative flex flex-col items-center space-y-4">
          {/* 神秘标题 */}
          <div className="absolute -top-6 left-0 right-0 text-center">
            <span className="inline-block px-4 py-1 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white text-sm rounded-full shadow-lg animate-pulse">
              神秘宝藏等待发现
            </span>
          </div>

          {/* 盲盒图案 */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md hover:animate-pulse relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin-slow opacity-50"></div>
            <div className="bg-gradient-to-r from-blue-500 to-green-500 w-16 h-16 rounded-full relative z-10">
              <div className="w-full h-full rounded-full bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl animate-bounce">?</span>
              </div>
            </div>
          </div>

          {/* 价格和内容信息 */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-yellow-300 animate-spin-slow" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
              </svg>
              <p className="text-xl font-bold text-white mb-2">Mystery Box #{box.id}</p>
              <svg className="w-5 h-5 text-yellow-300 animate-spin-slow" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
              </svg>
            </div>
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
              Price: {box.price} ETH
            </p>
            <p className="text-lg text-white/90">包含: {box.tokenIds.length} 个稀有NFT</p>
            
            {/* 添加描述文字 */}
            <p className="text-sm text-white/70 mt-2 px-4 italic">
              解锁非凡体验！每个盒子都蕴含着等待被发现的独特数字珍宝。
            </p>
          </div>

          {/* 查看详情按钮 */}
          <button
            className="btn glass btn-sm group hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105
              relative overflow-hidden"
            onClick={handleShowDetails}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 animate-pulse"></span>
            <span className="relative z-10 flex items-center space-x-2">
              <span>查看详情</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </button>

          {/* 添加底部装饰 */}
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
            <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80 backdrop-blur-sm">
              限量版 • 独家内容
            </div>
          </div>
        </div>
      </div>

      {/* 更新模态框组件 */}
      <DetailModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        box={box}
        nftDetails={nftDetails}
        loading={loading}
        onBuy={handleBuyBox} // 购买盲盒的按钮
        isProcessing={isProcessing}
      />
    </>
  );
};

