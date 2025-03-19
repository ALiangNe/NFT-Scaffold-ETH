import { useEffect, useState } from "react";
import { Collectible } from "./MyHoldings_llq";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { usePublicClient } from "wagmi";
import { saveNFTToDB } from "~~/utils/db";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [price, setPrice] = useState(""); // 上架价格输入框
  const [startPrice, setStartPrice] = useState(""); // 起拍价
  const [minIncrement, setMinIncrement] = useState(""); // 最小加价金额
  const [duration, setDuration] = useState(""); // 拍卖持续时间
  const [isModalOpen, setIsModalOpen] = useState(false); // 上架模态框
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false); // 拍卖模态框
  const [royaltyAmount, setRoyaltyAmount] = useState(""); // 计算出的版税金额
  const [isCreator, setIsCreator] = useState(false); // 是否是创作者
  const [isListed, setIsListed] = useState(false); // 是否已上架
  const [royaltyRecipient, setRoyaltyRecipient] = useState(""); // 版税接收者
  const [countdown, setCountdown] = useState<string>(""); // 租赁NFT倒计时
  // -- 盲盒
  const [boxTokenIds, setBoxTokenIds] = useState(""); // 输入NFT ID列表
  const [boxPrice, setBoxPrice] = useState(""); // 输入盲盒价格
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false); // 控制盲盒模态框状态
  // -- 空投
  const [airdropEndTime, setAirdropEndTime] = useState(""); // 设置空投结束时间（日期时间）
  const [isAirdropModalOpen, setIsAirdropModalOpen] = useState(false); // 控制空投模态框的状态
  // -- 碎片化
  const [totalShares, setTotalShares] = useState(0); // 总份额输入框
  const [sharePrice, setSharePrice] = useState(""); // 每份价格输入框
  const [isFragmentModalOpen, setIsFragmentModalOpen] = useState(false); // 控制模态框
  // 更多操作
  const [isMoreActionsModalOpen, setIsMoreActionsModalOpen] = useState(false); // 控制"更多操作"模态框 


  // 新增状态变量
  const [isRentModalOpen, setIsRentModalOpen] = useState(false); // 控制租赁模态框的状态
  const [userAddress, setUserAddress] = useState(""); // 保存租赁用户地址
  const [expires, setExpires] = useState(""); // 保存租赁到期时间

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const publicClient = usePublicClient(); // 获取公共客户端

  // 使用合约读取方法
  const { data: creatorAddress } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getCreator",
    args: [BigInt(nft.id)],
  });

  const { data: royaltyInfo } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "royaltyInfo",
    args: [BigInt(nft.id), BigInt(price ? Number(price) * 1e18 : 0)],
  });

  // 获取租赁NFT的倒计时函数
  const { data: expiresFromContract } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "userExpires",
    args: [BigInt(nft.id)],
  });

  // 获取NFT是否被租赁的状态
  useEffect(() => {
    console.log("Type--------------:", nft.type)
    if (creatorAddress && creatorAddress.toLowerCase() === nft.owner.toLowerCase()) {
      setIsCreator(true);
    }
  }, [creatorAddress, nft.owner]);

  useEffect(() => {
    if (royaltyInfo) {
      const [recipient, amountInWei] = royaltyInfo;
      setRoyaltyRecipient(recipient);
      const amountInEth = Number(amountInWei) / 1e18;
      setRoyaltyAmount(amountInEth.toFixed(4));
    }
  }, [royaltyInfo]);

  // 动态更新倒计时
  useEffect(() => {
    if (nft.type === "RENTED" && expiresFromContract) {
      const interval = setInterval(() => {
        const remainingTime = Math.max(
          Math.floor(Number(expiresFromContract) - Date.now() / 1000),
          0
        );

        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;

        setCountdown(`${hours}h ${minutes}m ${seconds}s`);

        if (remainingTime <= 0) {
          clearInterval(interval);
          setCountdown("Expired");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [nft.type, expiresFromContract]);

 // 1. 主要功能：上架NFT出售
  const handleListForSale = async () => {
    if (!price || isNaN(Number(price))) {
      notification.error("Invalid price");
      return;
    }

    if (isListed) {
      notification.error("This NFT is already listed!");
      return;
    }

    try {
      const listTx = await writeContractAsync({
        functionName: "listNFT",
        args: [BigInt(nft.id), BigInt(Number(price) * 1e18)],
        value: BigInt((Number(price) * 0.2 * 1e18).toString()), // 上架费用的 20%
      });

      // 获取交易收据
      const receipt = await publicClient?.getTransactionReceipt({
        hash: listTx as `0x${string}`,
      });

      console.log("receipt----------:", receipt);

      // 提取信息
      const nft_id = receipt?.logs[0].topics[3];
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      const gasUsed = receipt?.gasUsed;
      const list_time = new Date().toISOString().slice(0, 19).replace("T", " ");

      // 构造数据对象
      if (nft_id) {
        const data = {
          nft_id: numericId,
          token_uri: "上架", // 默认值
          mint_time: list_time,
          owner: "default_creator", // 调用者
          creator: "default_creator", // 默认值
          state: 0, // 默认值
          royaltyFeeNumerator: 0, // 默认值
          gasFee: gasUsed.toString(), // 保存Gas费用
        };

        // 保存数据至数据库
        await saveNFTToDB(data);

        notification.success("NFT listed and data saved successfully");
      }

      setIsListed(true);
    } catch (err) {
      console.error("Error listing NFT:", err);
      notification.error("Failed to list NFT");
    }
  };

  // 2. 主要功能：发起NFT拍卖
  const handleStartAuction = async () => {
    if (!startPrice || !minIncrement || !expires) {
      notification.error("Please fill in all fields for the auction");
      return;
    }

    try {
      const durationInSeconds = Math.floor(
        new Date(expires).getTime() / 1000 - Date.now() / 1000
      ); // 将日期选择器的值转换为持续时间
      if (durationInSeconds <= 0) {
        notification.error("Auction duration must be in the future");
        return;
      }

      const auctionTx = await writeContractAsync({
        functionName: "startAuction",
        args: [
          BigInt(nft.id), // NFT ID
          BigInt(Number(startPrice) * 1e18), // 起拍价（转为 wei）
          BigInt(Number(minIncrement) * 1e18), // 最小加价金额（转为 wei）
          BigInt(durationInSeconds), // 拍卖持续时间（秒）
        ],
      });

      // 获取交易收据
      const receipt = await publicClient?.getTransactionReceipt({
        hash: auctionTx as `0x${string}`,
      });

      console.log("Auction receipt----------:", receipt);

      // 提取信息
      const nft_id = receipt?.logs[0].topics[3];
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      const gasUsed = receipt?.gasUsed;
      const auction_time = new Date().toISOString().slice(0, 19).replace("T", " ");

      // 构造数据对象
      if (nft_id) {
        const data = {
          nft_id: numericId,
          token_uri: "发起拍卖", // 默认值
          mint_time: auction_time,
          owner: "default_creator", // 调用者
          creator: "default_creator", // 默认值
          state: 0, // 默认值
          royaltyFeeNumerator: 0, // 默认值
          gasFee: gasUsed.toString(), // 保存Gas费用
        };

        // 保存数据至数据库
        await saveNFTToDB(data);

        notification.success("Auction started and data saved successfully");
      }

      setIsAuctionModalOpen(false);
    } catch (err) {
      console.error("Error starting auction:", err);
      notification.error("Failed to start auction");
    }
  };

  // 改为日期选择器，设置使用者
  const handleSetUser = async () => {
    if (!userAddress || !expires) {
      notification.error("Invalid input for rent setup");
      return;
    }

    try {
      const expiresTimestamp = Math.floor(new Date(expires).getTime() / 1000); // 转换为时间戳
      await writeContractAsync({
        functionName: "setUser",
        args: [BigInt(nft.id), userAddress, BigInt(expiresTimestamp)],
      });
      notification.success("Rent setup successfully");
      setIsRentModalOpen(false);
    } catch (err) {
      console.error("Error setting rent:", err);
      notification.error("Failed to set rent");
    }
  };

  
// 3. 主要功能：创建NFT盲盒
  const handleCreateMysteryBox = async () => {
    if (!boxTokenIds || !boxPrice) {
      notification.error("Please enter NFT IDs and price");
      return;
    }

    try {
      const tokenIdsArray = boxTokenIds.split(",").map(id => BigInt(id.trim())); // 转换为 BigInt 数组
      const priceInWei = BigInt(Number(boxPrice) * 1e18); // 转换为 wei

      const boxTx = await writeContractAsync({
        functionName: "createMysteryBox",
        args: [tokenIdsArray, priceInWei],
      });

      // 获取交易收据
      const receipt = await publicClient?.getTransactionReceipt({
        hash: boxTx as `0x${string}`,
      });

      console.log("Mystery Box receipt----------:", receipt);

      // 提取信息
      const nft_id = receipt?.logs[0].topics[3];
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      const gasUsed = receipt?.gasUsed;
      const box_time = new Date().toISOString().slice(0, 19).replace("T", " ");

      // 构造数据对象
      if (nft_id) {
        const data = {
          nft_id: numericId,
          token_uri: "创建盲盒", // 默认值
          mint_time: box_time,
          owner: "default_creator", // 调用者
          creator: "default_creator", // 默认值
          state: 0, // 默认值
          royaltyFeeNumerator: 0, // 默认值
          gasFee: gasUsed.toString(), // 保存Gas费用
        };

        // 保存数据至数据库
        await saveNFTToDB(data);

        notification.success("Mystery Box created and data saved successfully");
      }

      setIsBoxModalOpen(false); // 关闭模态框
    } catch (err) {
      console.error("Error creating mystery box:", err);
      notification.error("Failed to create mystery box");
    }
  };

  // 4. 主要功能：设置NFT空投
  const handleSetAirdrop = async () => {
    if (!airdropEndTime) {
      notification.error("Please select a valid end time for airdrop");
      return;
    }

    try {
      const endTimeInSeconds = Math.floor(new Date(airdropEndTime).getTime() / 1000); // 转换为 Unix 时间戳
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      if (endTimeInSeconds <= currentTimeInSeconds) {
        notification.error("End time must be in the future");
        return;
      }

      const airdropTx = await writeContractAsync({
        functionName: "temporarilyTransferToContract",
        args: [BigInt(nft.id), BigInt(endTimeInSeconds)],
      });

      // 获取交易收据
      const receipt = await publicClient?.getTransactionReceipt({
        hash: airdropTx as `0x${string}`,
      });

      console.log("Airdrop receipt----------:", receipt);

      // 提取信息
      const nft_id = receipt?.logs[0].topics[3];
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      const gasUsed = receipt?.gasUsed;
      const airdrop_time = new Date().toISOString().slice(0, 19).replace("T", " ");

      // 构造数据对象
      if (nft_id) {
        const data = {
          nft_id: numericId,
          token_uri: "设置空投", // 默认值
          mint_time: airdrop_time,
          owner: "default_creator", // 调用者
          creator: "default_creator", // 默认值
          state: 0, // 默认值
          royaltyFeeNumerator: 0, // 默认值
          gasFee: gasUsed.toString(), // 保存Gas费用
        };

        // 保存数据至数据库
        await saveNFTToDB(data);

        notification.success("Airdrop setup and data saved successfully");
      }

      setIsAirdropModalOpen(false); // 关闭模态框
    } catch (err) {
      console.error("Error setting airdrop:", err);
      notification.error("Failed to set airdrop");
    }
  };

// 5. 主要功能：碎片化NFT
  const handleFragmentNFT = async () => {
    if (totalShares <= 0 || !sharePrice || isNaN(Number(sharePrice))) {
      notification.error("Invalid input for fragmenting NFT");
      return;
    }

    try {
      const fragmentTx = await writeContractAsync({
        functionName: "fragmentNFT",
        args: [
          BigInt(nft.id), // NFT ID
          BigInt(totalShares), // 总份额
          BigInt(Number(sharePrice) * 1e18), // 每份价格（转为 wei）
        ],
      });

      // 获取交易收据
      const receipt = await publicClient?.getTransactionReceipt({
        hash: fragmentTx as `0x${string}`,
      });

      console.log("Fragment NFT receipt----------:", receipt);

      // 提取信息
      const nft_id = receipt?.logs[0].topics[3];
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      const gasUsed = receipt?.gasUsed;
      const fragment_time = new Date().toISOString().slice(0, 19).replace("T", " ");

      // 构造数据对象
      if (nft_id) {
        const data = {
          nft_id: numericId,
          token_uri: "碎片化", // 默认值
          mint_time: fragment_time,
          owner: "default_creator", // 调用者
          creator: "default_creator", // 默认值
          state: 0, // 默认值
          royaltyFeeNumerator: 0, // 默认值
          gasFee: gasUsed.toString(), // 保存Gas费用
        };

        // 保存数据至数据库
        await saveNFTToDB(data);

        notification.success("NFT fragmented and data saved successfully");
      }

      setIsFragmentModalOpen(false); // 关闭模态框
    } catch (err) {
      console.error("Error fragmenting NFT:", err);
      notification.error("Failed to fragment NFT");
    }
  };


  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white "># {nft.id}</span>
        </figcaption>
      </figure>

      <div className="card-body space-y-2">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
          {nft.attributes?.map((attr, index) => (
            <span key={index} className="badge badge-primary py-3">
              {attr.value}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap space-x-2 mt-1">

        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{nft.description}</p>

          {/* <p className="text-lg font-semibold">Type: {nft.type}</p> */}
          {nft.type === "RENTED"}

        </div>
        <div className="flex space-x-3 mt-1 items-center">

          <span className="text-lg font-semibold">拥有者：</span>
          <Address address={nft.owner} />
        </div>
        <span className="text-lg font-semibold">已上架：{isListed ? "是" : "否"}</span>

        {/* 若Type=RENTED，则显示倒计时 */}
        {nft.type === "RENTED" && (
          <div className="mt-4">
            <p className="text-lg font-semibold text-red-500">结束时间：{countdown}</p>
            {/* <p className="text-red-500 text-xl font-bold">{countdown}</p> */}
          </div>
        )}

        {/* 判断类型，若为OWNER则显示button */}
        {nft.type === "OWNED" && (
          <>
            <div className="flex flex-col my-2 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-semibold">当前价格：</span>
                <span className="text-gray-500 text-xl">{price ? `${price} ETH` : "暂无"}</span>
              </div>
              <input
                type="text"
                value={price}
                placeholder="设置价格（ETH）"
                onChange={e => setPrice(e.target.value)}
                className="input input-bordered w-full"
              />

              {/* 添加"上架"按钮 */}
              <button
                className="btn btn-primary btn-md mt-2"
                onClick={handleListForSale}
                disabled={isListed}
              >
                {isListed ? "已上架" : "上架出售"}
              </button>
            </div>

            
            {/* // "更多操作"按钮和模态框 */}
            <button
              className="btn btn-secondary btn-md mt-2"
              onClick={() => setIsMoreActionsModalOpen(true)}
            >
              更多操作
            </button>

          </>
        )}

        {/* "更多操作"模态框 */}
        {isMoreActionsModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-[600px]">
              <h3 className="text-xl font-semibold mb-4 text-center">更多操作</h3>
              <div className="flex flex-col space-y-2">

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsAuctionModalOpen(true);
                    setIsMoreActionsModalOpen(false);
                  }}
                >
                  开始拍卖
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsBoxModalOpen(true);
                    setIsMoreActionsModalOpen(false);
                  }}
                >
                  创建盲盒
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsAirdropModalOpen(true);
                    setIsMoreActionsModalOpen(false);
                  }}
                >
                  设置空投
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsFragmentModalOpen(true);
                    setIsMoreActionsModalOpen(false);
                  }}
                >
                  碎片化
                </button>
              </div>
              <div className="modal-action flex justify-center">
                <button
                  className="btn btn-secondary w-40"
                  onClick={() => setIsMoreActionsModalOpen(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 拍卖信息的模态框 */}
        {isAuctionModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-[600px]">
              <h3 className="text-xl font-semibold mb-4">开始拍卖</h3>
              <div className="form-control mb-2">
                <label className="label">
                  <span className="label-text">起拍价格 (ETH)</span>
                </label>
                <input
                  type="text"
                  value={startPrice}
                  onChange={e => setStartPrice(e.target.value)}
                  placeholder="Set starting price"
                  className="input input-bordered"
                />
              </div>
              <div className="form-control mb-2">
                <label className="label">
                  <span className="label-text">最小加价 (ETH)</span>
                </label>
                <input
                  type="text"
                  value={minIncrement}
                  onChange={e => setMinIncrement(e.target.value)}
                  placeholder="Set minimum increment"
                  className="input input-bordered"
                />
              </div>

              {/* 改为日期选择器 */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">结束时间</span>
                </label>
                <input
                  type="datetime-local" // 使用HTML5日期时间选择器
                  value={expires}
                  onChange={e => setExpires(e.target.value)} // 更新状态为ISO格式
                  className="input input-bordered"
                />
              </div>
              <div className="modal-action">
                <button
                  onClick={() => setIsAuctionModalOpen(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleStartAuction}
                  className="btn btn-primary"
                >
                  开始拍卖
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 创建盲盒的模态框 */}
        {isBoxModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-[600px]">
              <h3 className="text-xl font-semibold mb-4">创建盲盒</h3>
              <div className="form-control mb-2">
                <label className="label">
                  <span className="label-text">NFT 编号（用逗号分隔）</span>
                </label>
                <input
                  type="text"
                  value={boxTokenIds}
                  onChange={e => setBoxTokenIds(e.target.value)}
                  placeholder="Enter NFT Token IDs, e.g., 1,2,3"
                  className="input input-bordered"
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">价格 (ETH)</span>
                </label>
                <input
                  type="text"
                  value={boxPrice}
                  onChange={e => setBoxPrice(e.target.value)}
                  placeholder="Set price in ETH"
                  className="input input-bordered"
                />
              </div>
              <div className="modal-action">
                <button
                  onClick={() => setIsBoxModalOpen(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateMysteryBox}
                  className="btn btn-primary"
                >
                  创建盲盒
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 空投设置模态框 */}
        {isAirdropModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-[600px]">
              <h3 className="text-xl font-semibold mb-4">设置空投</h3>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">空投结束时间</span>
                </label>
                <input
                  type="datetime-local" // 使用日期时间选择器
                  value={airdropEndTime}
                  onChange={e => setAirdropEndTime(e.target.value)} // 更新状态
                  className="input input-bordered"
                />
              </div>
              <div className="modal-action">
                <button
                  onClick={() => setIsAirdropModalOpen(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleSetAirdrop}
                  className="btn btn-primary"
                >
                  设置空投
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 碎片化模态框 */}
        {isFragmentModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-[600px]">
              <h3 className="text-xl font-semibold mb-4">碎片化 NFT</h3>
              <div className="form-control mb-2">
                <label className="label">
                  <span className="label-text">总份额</span>
                </label>
                <input
                  type="number"
                  value={totalShares}
                  onChange={e => setTotalShares(Number(e.target.value))}
                  placeholder="Enter total shares"
                  className="input input-bordered"
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">每份价格 (ETH)</span>
                </label>
                <input
                  type="text"
                  value={sharePrice}
                  onChange={e => setSharePrice(e.target.value)}
                  placeholder="Enter price per share in ETH"
                  className="input input-bordered"
                />
              </div>
              <div className="modal-action">
                <button
                  onClick={() => setIsFragmentModalOpen(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleFragmentNFT}
                  className="btn btn-primary"
                >
                  确认碎片化
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};
