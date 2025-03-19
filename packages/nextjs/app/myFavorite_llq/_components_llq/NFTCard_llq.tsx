import { useState } from "react";
import { Collectible } from "./MyHoldings_llq";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // --从收藏夹移除
  const handleUnfavorite = async () => {
    setIsProcessing(true);
    try {
      await writeContractAsync({
        functionName: "removeFavorite",
        args: [BigInt(nft.id)],
      });
      alert(`NFT #${nft.id} 已从收藏夹中移除`);
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert("移除收藏失败");
    } finally {
      setIsProcessing(false);
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
      <div className="card-body space-y-3">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold">收藏者：</span>
          <Address address={nft.owner} />
        </div>
        <div className="card-actions justify-center mt-4">
          <button
            className={`btn btn-danger ${isProcessing ? "loading" : ""}`}
            onClick={handleUnfavorite}
            disabled={isProcessing}
          >
            从收藏夹移除
          </button>
        </div>
      </div>
    </div>
  );
};
