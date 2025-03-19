import { useEffect, useState } from "react";
import { Collectible } from "./MyHoldings_llq";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [fragmentInfo, setFragmentInfo] = useState({
    totalShares: 0,
    availableShares: 0,
    sharePrice: 0,
  });
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  useEffect(() => {
    const fetchFragmentInfo = async () => {
      if (!yourCollectibleContract) return;

      try {
        const [totalShares, availableShares, sharePrice] =
          await yourCollectibleContract.read.getFragmentInfo([BigInt(nft.id)]);

        setFragmentInfo({
          totalShares: parseInt(totalShares.toString()),
          availableShares: parseInt(availableShares.toString()),
          sharePrice: parseInt(sharePrice.toString()),
        });
      } catch (err) {
        console.error(`Error fetching fragment info for NFT ID ${nft.id}`, err);
      }
    };

    fetchFragmentInfo();
  }, [yourCollectibleContract, nft.id]);

  useEffect(() => {
    setTotalPrice(purchaseAmount * fragmentInfo.sharePrice);
  }, [purchaseAmount, fragmentInfo.sharePrice]);

  const handlePurchaseShares = async () => {
    if (purchaseAmount <= 0 || purchaseAmount > fragmentInfo.availableShares) {
      alert("请输入有效的购买数量。");
      return;
    }

    try {
      const value = BigInt(purchaseAmount) * BigInt(fragmentInfo.sharePrice);

      console.log("Calling purchaseShares with:", {
        tokenId: nft.id,
        shares: BigInt(purchaseAmount),
        value: value.toString(),
      });

      await writeContractAsync({
        functionName: "purchaseShares",
        args: [BigInt(nft.id), BigInt(purchaseAmount)],
        value: value,
      });

      alert("份额购买成功！");
    } catch (err) {
      console.error("Error purchasing shares:", err);
      // alert(`Failed to purchase shares. ${err.message || "Unknown error"}`);
    }
  };

  const handleRedeemNFT = async () => {
    try {
      console.log("Calling redeemNFT with Token ID:", nft.id);

      await writeContractAsync({
        functionName: "redeemNFT",
        args: [BigInt(nft.id)], // 传递 tokenId
      });

      alert("NFT 赎回成功！");
    } catch (err) {
      console.error("Error redeeming NFT:", err);
      // alert(`Failed to redeem NFT. ${err.message || "Unknown error"}`);
    }
  };

  return (
    <div className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
      <figure className="relative">
        <img src={nft.image} alt="NFT Image" className="h-60 min-w-full" />
        <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
          <span className="text-white"># {nft.id}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg">{nft.description}</p>
        </div>
        <div className="flex flex-col my-2 space-y-1">
          <span className="text-lg font-semibold mb-1">总份额：{fragmentInfo.totalShares}</span>
          <span className="text-lg font-semibold mb-1">可用份额：{fragmentInfo.availableShares}</span>
          <span className="text-lg font-semibold mb-1">每份价格：{(fragmentInfo.sharePrice / 10 ** 18).toFixed(6)} ETH</span>
        </div>
        <div className="flex flex-col space-y-2">
          <input
            type="number"
            className="input input-bordered"
            placeholder="输入购买份数"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
          />
          <p className="text-lg">总价：{(totalPrice / 10 ** 18).toFixed(6)} ETH</p>
          <button
            className="btn btn-primary btn-md"
            onClick={handlePurchaseShares}
          >
            购买份额
          </button>
          <button
            className="btn btn-secondary btn-md"
            onClick={handleRedeemNFT}
          >
            赎回 NFT
          </button>
        </div>
      </div>
    </div>
  );
};
