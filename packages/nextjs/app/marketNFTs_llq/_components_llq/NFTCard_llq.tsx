import { useState, useEffect } from "react";
import { Collectible } from "./MyHoldings_llq";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListed, setIsListed] = useState(false); // 上架状态
  const [isFavorited, setIsFavorited] = useState<boolean | undefined>(undefined); // 收藏状态，初始为 undefined
  const [loadingFavorite, setLoadingFavorite] = useState(true); // 用于处理加载状态

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 使用 Scaffolding 钩子获取交易记录
  const { data: eventHistory } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "TransactionRecorded",
    fromBlock: 0n, // 确保查询从合约部署开始
  });

  // 使用 `useScaffoldReadContract` 获取 NFT 是否已上架
  const { data: listedStatus } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getListingPrice",
    args: [BigInt(nft.id)],
  });

  // 检查某个 NFT 是否已被收藏
  const { data: isFavoriteStatus, refetch } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "isFavorite",
    args: [nft.owner, BigInt(nft.id)], // 传入用户地址和 NFT 的 tokenId
  });

  // 初始化收藏状态
  useEffect(() => {
    if (isFavoriteStatus !== undefined) {
      setIsFavorited(Boolean(isFavoriteStatus)); // 如果返回为 true，则设置为已收藏
      setLoadingFavorite(false); // 数据加载完毕，停止加载
    }
  }, [isFavoriteStatus]);

  // 初始化上架状态
  useEffect(() => {
    if (listedStatus !== undefined) {
      setIsListed(Number(listedStatus) > 0); // 如果价格大于0，则表示已上架
    }
  }, [listedStatus]);

  // 格式化和过滤历史记录 手动在前端对 eventHistory 结果进行二次过滤
  const formattedHistories = eventHistory
    ? eventHistory
      .filter((event: any) => BigInt(event.args.tokenId) === BigInt(nft.id)) // 过滤当前NFT的交易记录
      .map((event: any) => ({
        buyer: event.args.buyer,
        seller: event.args.seller,
        price: `${Number(event.args.price) / 1e18} ETH`,
        timestamp: new Date(Number(event.args.timestamp) * 1000).toLocaleString(),
      }))
    : [];

  // 模态框的显示和隐藏
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // --购买
  const handleBuyNFT = async () => {
    setIsProcessing(true);
    const notificationId = notification.loading("正在处理购买...");

    try {
      await writeContractAsync({
        functionName: "buyNFT",
        args: [BigInt(nft.id)],
        value: BigInt(Number(nft.price) * 1e18),
      });

      notification.success("购买成功！");
    } catch (error) {
      notification.error("购买失败");
      console.error(error);
    } finally {
      setIsProcessing(false);
      notification.remove(notificationId);
    }
  };

  // --发起下架
  const handleUnlist = async () => {
    try {
      await writeContractAsync({
        functionName: "unlistNFT",
        args: [BigInt(nft.id)],
      });
      setIsListed(false); // 更新状态为未上架
      notification.success("NFT 下架成功");
    } catch (err) {
      console.error("Error unlisting NFT:", err);
      notification.error("NFT 下架失败");
    }
  };

  // --收藏NFT
  const handleAddFavorite = async () => {
    if (isFavorited) {
      notification.error("您已经收藏过这个 NFT 了");
      return; // 如果已经收藏，不执行任何操作
    }

    setIsProcessing(true);
    const notificationId = notification.loading("正在添加到收藏...");

    try {
      await writeContractAsync({
        functionName: "addFavorite",
        args: [BigInt(nft.id)],
      });

      setIsFavorited(true); // 更新收藏状态
      notification.success("已添加到收藏！");
      await refetch();
    } catch (error) {
      notification.error("Failed to add to favorites");
      console.error(error);
    } finally {
      setIsProcessing(false);
      notification.remove(notificationId);
    }
  };

  // --取消收藏NFT
  const handleRemoveFavorite = async () => {
    setIsProcessing(true);
    const notificationId = notification.loading("Removing from favorites...");

    try {
      await writeContractAsync({
        functionName: "removeFavorite",
        args: [BigInt(nft.id)],
      });

      setIsFavorited(false); // 更新收藏状态
      notification.success("Removed from favorites!");
      await refetch();
    } catch (error) {
      notification.error("Failed to remove from favorites");
      console.error(error);
    } finally {
      setIsProcessing(false);
      notification.remove(notificationId);
    }
  };

  return (
    <>
      {/* 主卡片 */}
      <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
        <figure className="relative">
          <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
          <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
            <span className="text-white "># {nft.id}</span>
          </figcaption>
        </figure>
        <div className="card-body space-y-3">
          <div className="flex items-center justify-center">
            <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
            <div className="flex flex-wrap space-x-2 mt-1">
              {nft.attributes?.map((attr, index) => (
                <span key={index} className="badge badge-primary py-3">
                  {attr.value}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center mt-1">
            <p className="my-0 text-lg">{nft.description}</p>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-lg font-semibold">价格：</span>
            <span className="text-lg">{nft.price} ETH</span>
          </div>
          <div className="flex space-x-3 mt-1 items-center">
            <span className="text-lg font-semibold">拥有者：</span>
            <Address address={nft.owner} />
          </div>
          {/* 新增是否上架的字段 */}
          <div className="flex space-x-3 mt-1 items-center">
            <span className="text-lg font-semibold">已上架：</span>
            <span className="text-lg pr-12">{isListed ? "是" : "否"}</span>

            <button
              className="btn btn-danger "
              onClick={handleUnlist}
            >
              下架 NFT
            </button>
          </div>

          {/* 收藏按钮 */}
          <div className="card-actions justify-between mt-4 flex space-x-3 w-full">
            <button
              className={`btn btn-primary ${isProcessing ? "loading" : ""}`}
              onClick={handleBuyNFT}
              disabled={isProcessing}
            >
              {isProcessing ? "处理中..." : "购买 NFT"}
            </button>

            <button className="btn btn-secondary" onClick={toggleModal}>
              查看详情
            </button>
            <div className="card-actions justify-center mt-4 flex w-full">
            <button
              className={`btn ${isFavorited ? "btn-success" : "btn-outline"} mt-2 w-full `}
              onClick={isFavorited ? handleRemoveFavorite : handleAddFavorite}
              disabled={isProcessing || loadingFavorite}
            >
              {loadingFavorite ? "加载中..." : isFavorited ? "取消收藏" : "添加收藏"}
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* 模态框 */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl flex">
            {/* 左边：NFT详情 */}
            <div className="w-1/3 pr-4">
              <h2 className="font-bold text-xl mb-4">{nft.name}</h2>
              <img src={nft.image} alt="NFT Image" className="rounded-lg mb-4" />
              <p>
                <strong>ID:</strong> {nft.id}
              </p>
              <p>
                <strong>描述：</strong> {nft.description}
              </p>
              <p>
                <strong>价格：</strong> {nft.price} ETH
              </p>
              <p>
                <strong>拥有者：</strong> <Address address={nft.owner} />
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <strong>属性：</strong>
                {nft.attributes?.map((attr, index) => (
                  <span key={index} className="badge badge-outline">
                    {attr.trait_type}: {attr.value}
                  </span>
                ))}
              </div>
            </div>

            {/* 右边：交易历史记录 */}
            <div className="w-2/3 pl-4 bg-base-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">交易历史</h3>
              {formattedHistories.length === 0 ? (
                <p>该 NFT 暂无交易历史。</p>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <ul className="space-y-3">
                    {formattedHistories.map((history, index) => (
                      <li key={index} className="p-3 border rounded-lg shadow-sm">
                        <div className="flex justify-between items-center space-x-4">
                          <p>
                            <strong>买家：</strong> <Address address={history.buyer} />
                          </p>
                          <p>
                            <strong>卖家：</strong> <Address address={history.seller} />
                          </p>
                          <p>
                            <strong>价格：</strong> <br />{history.price}
                          </p>
                          <p>
                            <strong>日期：</strong> <br />{history.timestamp}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
