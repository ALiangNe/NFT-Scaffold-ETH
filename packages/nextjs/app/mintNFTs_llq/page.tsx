"use client";

import { MyHoldings } from "./_components_llq/index_llq";
import { useState } from "react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { usePublicClient } from "wagmi";
import { saveNFTToDB } from "~~/utils/db";

const NFTPreview = ({ metadata }: { metadata: any }) => {
  return (
    <div className="card bg-base-100 shadow-xl w-[380px] hover:shadow-2xl transition-all duration-300">
      <figure className="relative rounded-t-2xl overflow-hidden">
        {metadata.image ? (
          <img 
            src={metadata.image} 
            alt="NFT Preview" 
            className="h-[380px] w-full object-cover transform hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="h-[380px] w-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </figure>
      <div className="card-body p-6 bg-white rounded-b-2xl">
        <div className="space-y-4">
          <div className="flex flex-col items-start">
            <h3 className="text-2xl font-bold text-gray-800">
              {metadata.name || "未命名 NFT"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {metadata.description || "添加NFT描述..."}
            </p>
          </div>
          
          {metadata.attributes?.some(attr => attr.trait_type && attr.value) && (
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">属性</h4>
              <div className="flex flex-wrap gap-2">
                {metadata.attributes?.map((attr: any, index: number) => (
                  attr.trait_type && attr.value ? (
                    <span 
                      key={index} 
                      className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 
                                 rounded-xl text-base font-semibold tracking-wide shadow-sm 
                                 hover:shadow-md transition-all duration-200"
                    >
                      <span className="font-bold">{attr.trait_type}</span>: {attr.value}
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateNFTs = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");//读取合约并且解构

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  const publicClient = usePublicClient(); // 获取公共客户端

  const [metadata, setMetadata] = useState({ // 设置元数据
    name: "",
    description: "",
    external_url: "",
    image: "",
    attributes: [{ trait_type: "", value: "" }],
  });

  const [royaltyPercentage, setRoyaltyPercentage] = useState("");//版税比例和接收者地址。
  const [royaltyRecipient, setRoyaltyRecipient] = useState(connectedAddress || "");
  const [imageFile, setImageFile] = useState<File | null>(null);//存储上传的图像文件
  const [uploadingImage, setUploadingImage] = useState(false);//上传状态。
  const [mintQuantity, setMintQuantity] = useState(1); // 新增的字段

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // 添加属性标签
  const handleAttributesChange = (index: number, field: string, value: string) => {
    const updatedAttributes = metadata.attributes.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    );
    setMetadata(prevState => ({
      ...prevState,
      attributes: updatedAttributes,
    }));
  };

  // 添加属性标签
  const addAttributeField = () => {
    setMetadata(prevState => ({
      ...prevState,
      attributes: [...prevState.attributes, { trait_type: "", value: "" }],
    }));
  };

  // 上传图片
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploadingImage(true);
    const notificationId = notification.loading("Uploading image to IPFS...");

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await fetch("/api/ipfs/add", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.IpfsHash) {
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
        setMetadata(prevState => ({
          ...prevState,
          image: imageUrl,
        }));
        notification.success("Image uploaded successfully!");
      } else {
        throw new Error("Failed to get IPFS hash");
      }
    } catch (error) {
      notification.error("Image upload failed");
      console.error("Error uploading image:", error);
    } finally {
      notification.remove(notificationId);
      setUploadingImage(false);
    }
  };

  // -- 单个铸造并保存到数据库 --02（有gasFee）
  const handleMintItem = async () => {
    if (
      !metadata.name ||
      !metadata.image ||
      !royaltyPercentage ||
      !royaltyRecipient ||
      tokenIdCounter === undefined ||
      !isConnected
    )
      return;
  
    const notificationId = notification.loading("Uploading metadata to IPFS");
  
    try {
      // 1. 上传到IPFS
      const uploadedItem = await addToIPFS(metadata);
      console.log("uploadedItem.IpfsHash:", uploadedItem.IpfsHash);
  
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");
  
      // 2. 调用合约铸造函数
      const mintTx = await writeContractAsync({
        functionName: "mintItem",
        args: [
          connectedAddress,
          uploadedItem.IpfsHash,
          parseInt(royaltyPercentage),
          royaltyRecipient,
        ],
      });
  
      console.log("mintTx:", mintTx);
  
      // 3. 获取交易收据
      const receipt = await publicClient?.getTransactionReceipt({
        hash: mintTx as `0x${string}`,
      });
  
      console.log("receipt:", receipt);
  
      // 4. 提取NFT ID和计算Gas费用
      const nft_id = receipt?.logs[0].topics[3]; // 提取日志中的NFT ID
      const numericId = parseInt(nft_id as `0x${string}`, 16);
      console.log("numericId:", numericId);
  
      const gasUsed = receipt?.gasUsed;
  
      const mint_time = new Date().toISOString().slice(0, 19).replace("T", " ");
  
      // 5. 构造数据对象
      if (nft_id) {
        const data = {
          nft_id: numericId,
          token_uri: uploadedItem.IpfsHash,
          mint_time: mint_time,
          owner: connectedAddress,
          creator: connectedAddress,
          state: 0,
          royaltyFeeNumerator: 500,
          gasFee: gasUsed.toString(), // 保存Gas费用，转换为字符串避免整数溢出
          // gasFee: gasUsed // 保存Gas费用，转换为字符串避免整数溢出
          
        };
  
        console.log("Data to save:", data);
  
        // 6. 保存数据至数据库
        await saveNFTToDB(data);
  
        notification.success("NFT Minted and Saved Successfully!");
      }
    } catch (error) {
      notification.remove(notificationId);
      console.error("Minting NFT failed", error);
      notification.error("Minting NFT failed");
    }
  };
  
  
 // -- 批量铸造并保存到数据库 --02（有gasFee）
 const handleMintBatchItems = async () => {
  if (
    !metadata.name ||
    !metadata.image ||
    !royaltyPercentage ||
    !royaltyRecipient ||
    tokenIdCounter === undefined ||
    !isConnected ||
    mintQuantity <= 0
  )
    return;

  const notificationId = notification.loading(
    "Uploading metadata to IPFS for batch minting"
  );

  try {
    // 1.  上传元数据到IP  FS
    const uploadedItem = await addToIPFS(metadata);
    console.log("uploadedItem.IpfsHash:", uploadedItem.IpfsHash);

    notification.remove(notificationId);
    notification.success("Metadata uploaded to IPFS");

    // 2. 调用批量铸造合约数
    const mintTx = await writeContractAsync({
      functionName: "mintBatchItems",
      args: [
        connectedAddress,
        uploadedItem.IpfsHash,
        parseInt(royaltyPercentage),
        royaltyRecipient,
        mintQuantity,
      ],
    });

    console.log("mintBatchTx:", mintTx);

    // 3. 获取交易收据
    const receipt = await publicClient?.getTransactionReceipt({
      hash: mintTx as `0x${string}`,
    });

    console.log("receipt:", receipt);

    // 4. 解析交易日志，提取每个NFT的ID
    if (!receipt || !receipt.logs || receipt.logs.length === 0) {
      throw new Error("Transaction receipt or logs are invalid");
    }

    const mint_time = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 提取并计算Gas费用
    const gasUsed = receipt.gasUsed;
    const effectiveGasPrice = receipt.effectiveGasPrice;
    const totalGasFee = gasUsed && effectiveGasPrice ? gasUsed * effectiveGasPrice : BigInt(0);

    console.log("Total Gas Fee (wei):", totalGasFee);

    const mintedNFTIds = receipt.logs.map((log) => {
      const nft_id = log.topics[3];
      return parseInt(nft_id as `0x${string}`, 16);
    });

    console.log("Minted NFT IDs:", mintedNFTIds);

    // 计算每个NFT的平均Gas费用
    // const gasFeePerNFT = mintedNFTIds.length > 0 ? (totalGasFee / BigInt(mintedNFTIds.length)).toString() : "0";
    const gasFeePerNFT = mintedNFTIds.length > 0 ? (gasUsed / BigInt(mintedNFTIds.length)).toString() : "0";

    // 5. 保存每个NFT数据到数据库
    for (const numericId of mintedNFTIds) {
      const data = {
        nft_id: numericId,
        token_uri: uploadedItem.IpfsHash,
        mint_time: mint_time,
        owner: connectedAddress,
        creator: connectedAddress,
        state: 0,
        royaltyFeeNumerator: parseInt(royaltyPercentage),
        gasFee: gasFeePerNFT, // 保存平均分配的Gas费用
      };

      console.log("Data to save:", data);

      await saveNFTToDB(data);
    }

    notification.success(`Successfully minted ${mintQuantity} NFTs and saved to database!`);
  } catch (error) {
    notification.remove(notificationId);
    console.error("Batch minting NFTs failed:", error);
    notification.error("Batch minting NFTs failed");
  }
};


  return (
    <>
      <div className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-rose-100/20 to-purple-100/20 pointer-events-none" />
        
        {/* 顶部横幅 */}
        <div className="w-full bg-gradient-to-r from-amber-600 via-rose-500 to-purple-600 p-1">
          <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
            <span className="animate-pulse">✨ 释放创造力 - 现在就铸造 NFT！</span>
          </div>
        </div>

        {/* 介绍标题区域 */}
        <div className="flex items-center flex-col pt-10 pb-8">
          <div className="px-5 text-center max-w-3xl">
            <h1 className="text-center mb-4">
              <span className="block text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500">
                铸造你的 NFT
              </span>
            </h1>
            <p className="text-xl text-base-content/70 mb-6">
              将你的数字创作转化为独特的区块链资产。支持单个或批量铸造 NFT，可自定义属性和版税。
            </p>
            
            {/* 特性标签 */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="badge badge-lg bg-amber-100 text-amber-800 border-amber-200 gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                批量铸造
              </div>
              <div className="badge badge-lg bg-rose-100 text-rose-800 border-rose-200 gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
                自定义版税
              </div>
              <div className="badge badge-lg bg-purple-100 text-purple-800 border-purple-200 gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                </svg>
                丰富属性
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-start gap-12 px-8">
        {/* 左侧表单 - 保持原样 */}
        <div className="card bg-base-100 shadow-lg w-full max-w-lg p-5 rounded-lg">
          <h2 className="card-title mb-4">NFT 详情</h2>

          <label className="mb-2 font-semibold">NFT 名称</label>
          <input
            type="text"
            name="name"
            value={metadata.name}
            onChange={handleInputChange}
            className="input input-bordered w-full mb-4"
            placeholder="输入 NFT 名称"
          />

          <label className="mb-2 font-semibold">描述</label>
          <textarea
            name="description"
            value={metadata.description}
            onChange={handleInputChange}
            className="textarea textarea-bordered w-full mb-4"
            placeholder="输入描述"
          />

          <label className="mb-2 font-semibold">外部链接</label>
          <input
            type="text"
            name="external_url"
            value={metadata.external_url}
            onChange={handleInputChange}
            className="input input-bordered w-full mb-4"
            placeholder="输入外部链接"
          />

          <label className="mb-2 font-semibold">上传图片</label>
          <input
            type="file"
            onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
            className="file-input file-input-bordered w-full mb-4"
            accept="image/*"
          />
          <button
            className="btn btn-primary w-full mb-4"
            onClick={handleImageUpload}
            disabled={!imageFile || uploadingImage}
          >
            {uploadingImage ? "上传中..." : "上传图片"}
          </button>

          {metadata.image && (
            <div className="my-4">
              <img src={metadata.image} alt="Uploaded NFT" className="w-full h-64 object-cover rounded-lg mb-4" />
            </div>
          )}

          {/* 添加版税 */}
          <label className="mb-2 font-semibold">版税比例</label>
          <input
            type="number"
            value={royaltyPercentage}
            onChange={e => setRoyaltyPercentage(e.target.value)}
            className="input input-bordered w-full mb-4"
            placeholder="输入版税比例"
          />

          <label className="mb-2 font-semibold">版税接收地址</label>
          <input
            type="text"
            value={royaltyRecipient}
            onChange={e => setRoyaltyRecipient(e.target.value)}
            className="input input-bordered w-full mb-4"
            placeholder="输入接收者地址"
          />

          {/* 添加标签 */}
          <h3 className="font-semibold mb-2">属性</h3>
          {metadata.attributes.map((attr, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={attr.trait_type}
                onChange={e => handleAttributesChange(index, "trait_type", e.target.value)}
                className="input input-bordered w-full"
                placeholder="属性类型"
              />
              <input
                type="text"
                value={attr.value}
                onChange={e => handleAttributesChange(index, "value", e.target.value)}
                className="input input-bordered w-full"
                placeholder="属性值"
              />
            </div>
          ))}
          <button className="btn btn-secondary w-full mb-4" onClick={addAttributeField}>
            添加属性
          </button>

          {/* 批量铸造NFT */}
          <label className="mb-2 font-semibold">数量</label>
          <input
            type="number"
            value={mintQuantity}
            onChange={e => setMintQuantity(parseInt(e.target.value))}
            className="input input-bordered w-full mb-4"
            placeholder="输入批量铸造数量"
          />

          <div className="card-actions justify-center">
            {!isConnected || isConnecting ? (
              <RainbowKitCustomConnectButton />
            ) : (
              <>
                <button
                  className="btn btn-accent w-full mb-4"
                  onClick={handleMintItem} // 铸造单个NFT
                  disabled={!metadata.name || !metadata.image || !royaltyPercentage || !royaltyRecipient}
                >
                  铸造 NFT
                </button>
                <button
                  className="btn btn-secondary w-full"
                  onClick={handleMintBatchItems} //   量铸造NFT
                  disabled={!metadata.name || !metadata.image || !royaltyPercentage || !royaltyRecipient || mintQuantity <= 0}
                >
                  批量铸造 NFT
                </button>
              </>
            )}
          </div>
        </div>

        {/* 右侧预览 */}
        <div className="sticky top-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">预览</h2>
            <NFTPreview metadata={metadata} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <MyHoldings />
      </div>
    </>
  );
};

export default CreateNFTs;
