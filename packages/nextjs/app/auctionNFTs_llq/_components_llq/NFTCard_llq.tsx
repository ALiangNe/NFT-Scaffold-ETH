import { useState, useEffect } from "react";
import { Collectible } from "./MyHoldings_llq";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

//  竞价，结束竞拍，查看详情，获取交易记录
export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [isBidding, setIsBidding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [canEndAuction, setCanEndAuction] = useState(false);
  const [bidAmount, setBidAmount] = useState(""); // 输入框值

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 使用 Scaffolding 钩子获取拍卖交易记录
  const { data: bidHistory } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "BidPlaced",
    fromBlock: 0n, // 从合约部署开始
  });

  // 计算倒计时
  const calculateTimeLeft = (endTime: number) => {
    const now = new Date().getTime();
    const difference = endTime * 1000 - now;

    if (difference > 0) {
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return "Auction Ended";
  };

  // 动态更新剩余时间
  useEffect(() => {
    const interval = setInterval(() => {
      const timeLeftStr = calculateTimeLeft(nft.endTime);
      setTimeLeft(timeLeftStr);
      setCanEndAuction(timeLeftStr === "Auction Ended");
    }, 1000);

    return () => clearInterval(interval);
  }, [nft.endTime]);

  // 格式化拍卖记录
  const formattedBids = bidHistory
    ? bidHistory
        .filter((event: any) => BigInt(event.args.tokenId) === BigInt(nft.id)) // 筛选当前 NFT 的竞价记录
        .map((event: any) => ({
          bidder: event.args.bidder,
          amount: `${Number(event.args.bidAmount) / 1e18} ETH`,
          timestamp: new Date(Number(event.args.timestamp) * 1000).toLocaleString(),
        }))
    : [];

  const handleBid = async () => {
    if (!bidAmount || isNaN(Number(bidAmount))) {
      notification.error("无效的竞拍金额！");
      return;
    }

    setIsBidding(true);
    const notificationId = notification.loading("正在提交出价...");

    try {
      await writeContractAsync({
        functionName: "bid",
        args: [BigInt(nft.id)],
        value: BigInt(Number(bidAmount) * 1e18),
      });

      notification.success("出价成功！");
    } catch (error) {
      notification.error("出价失败");
      console.error(error);
    } finally {
      setIsBidding(false);
      notification.remove(notificationId);
    }
  };

  const handleEndAuction = async () => {
    if (!canEndAuction) return;

    const notificationId = notification.loading("正在结束拍卖...");

    try {
      await writeContractAsync({
        functionName: "endAuction",
        args: [BigInt(nft.id)],
      });

      notification.success("拍卖已成功结束！");
    } catch (error) {
      notification.error("结束拍卖失败");
      console.error(error);
    } finally {
      notification.remove(notificationId);
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <>
      {/* NFT 卡片 */}
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 
        transform hover:-translate-y-1 backdrop-blur-lg border border-base-300">
        {/* 图片容器 */}
        <figure className="relative group">
          <img 
            src={nft.image} 
            alt="NFT Image" 
            className="h-60 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <figcaption className="glass absolute bottom-4 left-4 p-2 px-4 rounded-xl 
            backdrop-blur-md bg-white/10">
            <span className="text-white font-semibold">#{nft.id}</span>
          </figcaption>
        </figure>

        {/* 卡片内容 */}
        <div className="card-body p-6 space-y-4">
          {/* 标题和属性 */}
          <div>
            <h2 className="card-title text-xl mb-2">{nft.name}</h2>
            <div className="flex flex-wrap gap-2">
              {nft.attributes?.map((attr, index) => (
                <span key={index} className="badge badge-primary badge-outline">
                  {attr.value}
                </span>
              ))}
            </div>
          </div>

          {/* 描述 */}
          <p className="text-base-content/70 text-sm line-clamp-2">{nft.description}</p>

          {/* 竞价信息 */}
          <div className="space-y-2 pt-2 border-t border-base-300">
            <div className="flex justify-between items-center">
              <span className="text-base-content/80">起拍价</span>
              <span className="font-mono text-lg">
                {Number(nft.startPrice) / 1e18} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/80">最低加价</span>
              <span className="font-mono">
                {Number(nft.minIncrement) / 1e18} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/80">当前最高出价</span>
              <span className="font-mono text-lg text-success">
                {Number(nft.highestBid) / 1e18} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/80">剩余时间</span>
              <span className={`font-mono ${timeLeft === "拍卖已结束" ? "text-error" : "text-success"}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="card-actions justify-end pt-2">
            <button
              className={`btn btn-sm ${canEndAuction ? "btn-error" : "btn-disabled"} 
                hover:scale-105 transition-transform`}
              onClick={handleEndAuction}
              disabled={!canEndAuction}
            >
              结束拍卖
            </button>
            <button 
              className="btn btn-sm btn-primary hover:scale-105 transition-transform"
              onClick={toggleModal}
            >
              查看详情
            </button>
          </div>
        </div>
      </div>

      {/* 详情模态框 */}
      {isModalOpen && (
        <div className="modal modal-open ">
          <div className="modal-box w-11/12 max-w-5xl flex">
            {/* 左侧：NFT详情 */}
            <div className="w-1/3 pr-4 ">
              <h2 className="font-bold text-xl mb-4">{nft.name}</h2>
              <img src={nft.image} alt="NFT Image" className="rounded-lg mb-4" />
              <p>
                <strong>编号：</strong> {nft.id}
              </p>
              <p>
                <strong>起拍价：</strong> {Number(nft.startPrice) / 1e18} ETH
              </p>
              <p>
                <strong>最低加价：</strong> {Number(nft.minIncrement) / 1e18} ETH
              </p>
              <p>
                <strong>最高出价：</strong> {Number(nft.highestBid) / 1e18} ETH
              </p>
              <p>
                <strong>最高出价者：</strong> <Address address={nft.highestBidder} />
              </p>
            </div>

            {/* 右侧：竞价历史 */}
            <div className="w-2/3 pl-4 bg-base-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">竞拍记录</h3>
              <p>该拍品暂无竞拍记录。</p>
            </div>
          </div>
          {/* 竞标输入框 */}
          <div className="mt-4">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="输入竞拍金额 (ETH)"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <button
              className="btn btn-primary w-full mt-2"
              onClick={handleBid}
              disabled={isBidding}
            >
              {isBidding ? "正在出价..." : "出价"}
            </button>
          </div>

          <div className="modal-action">
            <button className="btn" onClick={toggleModal}>
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
};
