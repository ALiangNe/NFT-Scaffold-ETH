'use client'
import type { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const auctionImages = [
  "/images/auction01.jpg",
  "/images/auction02.jpg",
  "/images/auction03.jpg",
  "/images/auction04.jpg",
  "/images/auction05.jpg",
  "/images/auction06.jpg",
  "/images/auction07.jpg",
  "/images/auction08.jpg",
];

const Home: NextPage = () => {
  const router = useRouter();
  const [prices, setPrices] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const generatedPrices = auctionImages.map(() => parseFloat((Math.random() * 10).toFixed(2)));
    setPrices(generatedPrices);

    const interval = setInterval(() => {
      auctionImages.forEach((_, index) => {
        setTimeout(() => {
          setActiveIndex(index);
        }, index * 500);
      });
    }, auctionImages.length * 500);

    return () => clearInterval(interval);
  }, []);

  const handleExplore = () => {
    router.push('/mintNFTs_llq');
  };

  return (
    <div className={`min-h-screen ${
      resolvedTheme === "dark" 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-indigo-50 via-white to-purple-50"
    }`}>
      {/* 炫酷的顶部背景 */}
      <div className="relative overflow-hidden h-[250px] mt-4">
        {/* 轮播图背景 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="flex animate-scroll-right whitespace-nowrap h-[200px] items-center">
            {/* 重复三次图片以确保无缝轮播 */}
            {[...auctionImages, ...auctionImages, ...auctionImages].map((image, index) => (
              <div
                key={index}
                className="relative w-[200px] h-[200px] flex-shrink-0 mx-1"
              >
                <Image
                  src={image}
                  alt={`Carousel Image ${index + 1}`}
                  fill
                  className="object-cover opacity-50"
                  sizes="200px"
                  priority={index < 8}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* 调整渐变遮罩透明度 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 backdrop-blur-sm"></div>
        
        {/* 内容层 */}
        <div className="relative z-20 pt-10 pb-10 px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-gradient">
              数字艺术珍藏馆
            </h1>
            <p className="text-2xl font-bold text-gray-700 mb-4">
              探索无限可能的 NFT 世界
            </p>
            <div className="space-y-3 text-base text-gray-600 max-w-2xl mx-auto">
              <p className="leading-relaxed">
                在这里，每一件 NFT 都是独一无二的数字艺术杰作，承载着创作者的灵感与热情。
              </p>
              <p className="leading-relaxed">
                我们为艺术家和收藏家打造了一个充满活力的生态系统，让数字艺术的价值得到充分展现。
              </p>
              <p className="leading-relaxed">
                无论是稀有的数字藏品、独特的虚拟物品，还是创新的区块链艺术，这里都能找到属于你的珍贵收藏。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 图片网格区域 */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {auctionImages.map((image, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 ease-out transform ${
                activeIndex === index ? 'scale-110' : ''
              } ${
                resolvedTheme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white"
              } rounded-2xl`}
            >
              {/* 图片容器 */}
              <div className="aspect-[4/5] relative">
                <Image
                  src={image}
                  alt={`NFT Artwork ${index + 1}`}
                  fill
                  className="object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                {/* 渐变遮罩 */}
                <div className={`absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  resolvedTheme === "dark"
                    ? "from-gray-900/90 via-transparent to-transparent"
                    : "from-black/60 via-transparent to-transparent"
                }`} />
              </div>

              {/* 卡片内容 */}
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300">
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl mb-2">艺术品 #{index + 1}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-200 text-sm">实时价格</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      resolvedTheme === "dark"
                        ? "bg-gray-700/50 backdrop-blur-sm"
                        : "bg-white/20 backdrop-blur-sm"
                    } text-white`}>
                      {prices[index] ? `${prices[index]} ETH` : '加载中...'}
                    </span>
                  </div>
                  <button 
                    className={`mt-4 w-full py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
                      resolvedTheme === "dark"
                        ? "bg-gray-700/50 hover:bg-gray-600/50 text-white border border-gray-600/50"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                    onClick={handleExplore}
                  >
                    立即探索
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加特色介绍区域 */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-3">真实所有权</h3>
            <p className="text-gray-600">
              基于区块链技术，确保每件数字艺术品的所有权真实可信，永久保存。
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-3">创新交易</h3>
            <p className="text-gray-600">
              支持直售、拍卖、碎片化等多种交易方式，让艺术品流通更加灵活。
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-3">社区共建</h3>
            <p className="text-gray-600">
              打造充满活力的 NFT 社区，连接创作者与收藏家，共同成长。
            </p>
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className={`h-24 ${
        resolvedTheme === "dark"
          ? "bg-gradient-to-t from-gray-900/50 to-transparent"
          : "bg-gradient-to-t from-purple-50/50 to-transparent"
      }`}></div>
    </div>
  );
};

export default Home;
