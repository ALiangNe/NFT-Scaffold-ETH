"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard_llq";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import { FragmentedImage } from "./FragmentedImage_llq";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
  type: string; // 用于区分 OWNED 和 RENTED
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [fragmentedNFTs, setFragmentedNFTs] = useState<
    { id: number; shares: number; totalShares: number; name: string; image: string }[]
  >([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false); // 防止重复加载
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [currentFragmentPage, setCurrentFragmentPage] = useState(1); // 碎片化NFT当前页码
  const itemsPerPage = 5; // 每页显示的NFT数量
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [sharesToList, setSharesToList] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const { targetNetwork } = useTargetNetwork();

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { data: myTotalBalance } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // 1. 主要功能：获取用户拥有的NFT和租赁的NFT
  const fetchMyCollectibles = async () => {
    if (!connectedAddress || !yourCollectibleContract || hasFetched) return;
    const collectibleUpdate: Collectible[] = [];

    try {
      // 获取用户拥有的 NFT
      if (myTotalBalance !== undefined) {
        const totalBalance = parseInt(myTotalBalance.toString());
        for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
          try {
            const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
              connectedAddress,
              BigInt(tokenIndex),
            ]);

            const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
            const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);

            collectibleUpdate.push({
              id: parseInt(tokenId.toString()),
              uri: tokenURI,
              owner: connectedAddress,
              type: "OWNED",
              ...nftMetadata,
            });
          } catch (error) {
            console.error("Error fetching owned NFT:", error);
          }
        }
      }

      // 获取用户租赁的 NFT
      const totalSupply = await yourCollectibleContract.read.tokenIdCounter();
      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          const user = await yourCollectibleContract.read.userOf([BigInt(tokenId)]);
          const expires = await yourCollectibleContract.read.userExpires([BigInt(tokenId)]);

          if (user.toLowerCase() === connectedAddress.toLowerCase() && Number(expires) > Date.now() / 1000) {
            const tokenURI = await yourCollectibleContract.read.tokenURI([BigInt(tokenId)]);
            const nftMetadata: NFTMetaData = await getMetadataFromIPFS(tokenURI as string);

            collectibleUpdate.push({
              id: tokenId,
              uri: tokenURI,
              owner: user,
              type: "RENTED",
              ...nftMetadata,
            });
          }
        } catch (error) {
          console.error("Error fetching rented NFT:", error);
        }
      }

      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setHasFetched(true); // 标记为已加载
    } catch (error) {
      notification.error("Error fetching collectibles");
      console.error(error);
    } finally {
      setAllCollectiblesLoading(false);
    }
  };

// 2. 主要功能：获取用户拥有的碎片化NFT列表
  const fetchFragmentedNFTs = async () => {
    if (!connectedAddress || !yourCollectibleContract) return;

    try {
      const [tokenIds, ownedShares, totalShares] = await yourCollectibleContract.read.getUserFragmentShares([
        connectedAddress,
      ]);

      const fragmentedNFTsData = await Promise.all(
        tokenIds.map(async (id: any, index: number) => {
          const tokenId = parseInt(id.toString());
          const shares = parseInt(ownedShares[index].toString());
          const total = parseInt(totalShares[index].toString());

          try {
            // 检查NFT是否存在于合约中(未���赎回)
            const fragmentInfo = await yourCollectibleContract.read.getFragmentInfo([BigInt(tokenId)]);

            // 如果NFT已被赎回,fragmentInfo会抛出异常或返回零值
            // 我们只处理未被赎回的NFT
            if (fragmentInfo[0] > 0) { // totalShares > 0 表示NFT仍在碎片化状态
              const tokenURI = await yourCollectibleContract.read.tokenURI([BigInt(tokenId)]);
              const nftMetadata = await getMetadataFromIPFS(tokenURI as string);
              return {
                id: tokenId,
                shares,
                totalShares: total,
                image: nftMetadata.image || "",
                name: nftMetadata.name || `NFT #${tokenId}`,
              };
            }
            return null; // 已赎回的NFT返回null

          } catch (error) {
            console.error("Error fetching metadata for fragmented NFT:", error);
            return null; // 如果发生错误或NFT已被赎回,返回null
          }
        })
      );

      // 过滤掉null值(已赎回的NFT)
      const validFragmentedNFTs = fragmentedNFTsData.filter(
        (nft): nft is NonNullable<typeof nft> => nft !== null
      );

      setFragmentedNFTs(validFragmentedNFTs);
    } catch (error) {
      notification.error("Error fetching fragmented NFTs");
      console.error("Fragmented NFT Error:", error);
    }
  };

  // 计算当前页显示的NFT
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = myAllCollectibles.slice(indexOfFirstItem, indexOfLastItem);

  // 计算当前页显示的碎片化NFT
  const indexOfLastFragmentItem = currentFragmentPage * itemsPerPage;
  const indexOfFirstFragmentItem = indexOfLastFragmentItem - itemsPerPage;
  const currentFragmentItems = fragmentedNFTs.slice(indexOfFirstFragmentItem, indexOfLastFragmentItem);

  // 处理页码变化
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 处理碎片化NFT页码变化
  const handleFragmentPageChange = (pageNumber: number) => {
    setCurrentFragmentPage(pageNumber);
  };

  // 计算总页数
  const totalPages = Math.ceil(myAllCollectibles.length / itemsPerPage);
  const totalFragmentPages = Math.ceil(fragmentedNFTs.length / itemsPerPage);

  // 3. 主要功能：碎片上架
  const handleListShares = async () => {
    if (!selectedNFT || !sharesToList || !listingPrice) {
      notification.error("Please fill in all fields");
      return;
    }

    try {
      const tokenId = BigInt(selectedNFT.id);
      const shares = BigInt(sharesToList);
      const price = BigInt(Number(listingPrice) * 1e18); // 转换为 wei

      await writeContractAsync({
        functionName: "listFragmentShares",
        args: [tokenId, shares, price],
      });

      notification.success("Shares listed successfully");
      setIsListingModalOpen(false);
      setSelectedNFT(null);
      setSharesToList("");
      setListingPrice("");
      
      // 重新获取碎片化NFT列表
      await fetchFragmentedNFTs();
    } catch (err) {
      console.error("Error listing shares:", err);
      notification.error("Failed to list shares");
    }
  };

  useEffect(() => {
    console.log("Current network:", targetNetwork);
    console.log("Contract:", yourCollectibleContract);
    // console.log("Total Collectibles:", myAllCollectibles.length);
    // console.log("Total Pages:", totalPages);
    // console.log("Current Page:", currentPage);
    fetchMyCollectibles();
    fetchFragmentedNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, yourCollectibleContract, targetNetwork]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      <h2 className="text-2xl font-bold text-center mt-10">已拥有的 NFT</h2>
      {currentItems.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">未找到 NFT</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {currentItems.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}

      {/* 分页按钮 */}
      <div className="flex justify-center mt-4">
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="btn btn-secondary mx-1"
          >
            上一页
          </button>
        )}
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            className={`btn ${currentPage === index + 1 ? 'btn-primary' : 'btn-secondary'} mx-1`}
          >
            {index + 1}
          </button>
        ))}
        {currentPage < totalPages && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="btn btn-secondary mx-1"
          >
            下一页
          </button>
        )}
      </div>

      <h2 className="text-2xl font-bold text-center mt-10">碎片化 NFT</h2>
      {currentFragmentItems.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">未找到碎片化 NFT</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {currentFragmentItems.map(item => (
            <div key={item.id} className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary">
              <figure className="relative h-60">
                <FragmentedImage
                  src={item.image}
                  ownedShares={item.shares}
                  totalShares={item.totalShares}
                  className="h-full w-full"
                />
              </figure>
              <div className="card-body">
                <h3 className="text-xl font-semibold"># {item.id}</h3>
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <h3 className="text-xl font-semibold">已拥有份额: {item.shares}</h3>
                <span className="text-lg">总份额: {item.totalShares}</span>
                
                {/* 添加上架按钮 */}
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => {
                    setSelectedNFT(item);
                    setIsListingModalOpen(true);
                  }}
                >
                  碎片上架
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 碎片化NFT分页按钮 */}
      <div className="flex justify-center mt-4">
        {currentFragmentPage > 1 && (
          <button
            onClick={() => handleFragmentPageChange(currentFragmentPage - 1)}
            className="btn btn-secondary mx-1"
          >
            上一页
          </button>
        )}
        {Array.from({ length: totalFragmentPages }, (_, index) => (
          <button
            key={index}
            onClick={() => handleFragmentPageChange(index + 1)}
            className={`btn ${currentFragmentPage === index + 1 ? 'btn-primary' : 'btn-secondary'} mx-1`}
          >
            {index + 1}
          </button>
        ))}
        {currentFragmentPage < totalFragmentPages && (
          <button
            onClick={() => handleFragmentPageChange(currentFragmentPage + 1)}
            className="btn btn-secondary mx-1"
          >
            下一页
          </button>
        )}
      </div>

      {/* 添加上架模态框 */}
      {isListingModalOpen && selectedNFT && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">挂单出售份额</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">挂单份额数量</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={sharesToList}
                onChange={(e) => setSharesToList(e.target.value)}
                max={selectedNFT.shares}
                min="1"
              />
            </div>
            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">每份价格 (ETH)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                min="0"
                step="0.000001"
              />
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={() => {
                  setIsListingModalOpen(false);
                  setSelectedNFT(null);
                  setSharesToList("");
                  setListingPrice("");
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleListShares}
              >
                确认挂单
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
