
"use client";

import { MyHoldings } from "./_components_llq/index_llq";
import { useState } from "react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const CreateNFTs = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  const [metadata, setMetadata] = useState({
    name: "",
    description: "",
    external_url: "",
    image: "",
    attributes: [{ trait_type: "", value: "" }],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAttributesChange = (index: number, field: string, value: string) => {
    const updatedAttributes = metadata.attributes.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    );
    setMetadata(prevState => ({
      ...prevState,
      attributes: updatedAttributes,
    }));
  };

  const addAttributeField = () => {
    setMetadata(prevState => ({
      ...prevState,
      attributes: [...prevState.attributes, { trait_type: "", value: "" }],
    }));
  };

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

  const handleMintItem = async () => {
    if (!metadata.name || !metadata.image || tokenIdCounter === undefined || !isConnected) return;

    const notificationId = notification.loading("Uploading metadata to IPFS");

    try {
      const uploadedItem = await addToIPFS(metadata);
      console.log('uploadedItem.IpfsHash----------------', uploadedItem.IpfsHash);

      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, uploadedItem.IpfsHash],
      });
      notification.success("NFT Minted Successfully!");
    } catch (error) {
      notification.remove(notificationId);
      console.error("Minting NFT failed", error);
      notification.error("Minting NFT failed");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Create NFTs</span>
          </h1>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="card bg-base-100 shadow-lg w-full max-w-lg p-5 rounded-lg">
          {/* 表单区域 */}
          <h2 className="card-title mb-4">NFT Details</h2>

          <label className="mb-2 font-semibold">NFT Name</label>
          <input
            type="text"
            name="name"
            value={metadata.name}
            onChange={handleInputChange}
            className="input input-bordered w-full mb-4"
            placeholder="Enter NFT name"
          />

          <label className="mb-2 font-semibold">Description</label>
          <textarea
            name="description"
            value={metadata.description}
            onChange={handleInputChange}
            className="textarea textarea-bordered w-full mb-4"
            placeholder="Enter description"
          />

          <label className="mb-2 font-semibold">External URL</label>
          <input
            type="text"
            name="external_url"
            value={metadata.external_url}
            onChange={handleInputChange}
            className="input input-bordered w-full mb-4"
            placeholder="Enter external URL"
          />

          <label className="mb-2 font-semibold">Upload Image</label>
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
            {uploadingImage ? "Uploading..." : "Upload Image"}
          </button>

          {metadata.image && (
            <div className="my-4">
              <img src={metadata.image} alt="Uploaded NFT" className="w-full h-64 object-cover rounded-lg mb-4" />
              {/* <p className="text-sm text-gray-500">Image URL: {metadata.image}</p> */}
            </div>
          )}

          <h3 className="font-semibold mb-2">Attributes</h3>
          {metadata.attributes.map((attr, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={attr.trait_type}
                onChange={e => handleAttributesChange(index, "trait_type", e.target.value)}
                className="input input-bordered w-full"
                placeholder="Trait Type"
              />
              <input
                type="text"
                value={attr.value}
                onChange={e => handleAttributesChange(index, "value", e.target.value)}
                className="input input-bordered w-full"
                placeholder="Value"
              />
            </div>
          ))}
          <button className="btn btn-secondary w-full mb-4" onClick={addAttributeField}>
            Add Attribute
          </button>

          <div className="card-actions justify-center">
            {!isConnected || isConnecting ? (
              <RainbowKitCustomConnectButton />
            ) : (
              <button className="btn btn-accent w-full" onClick={handleMintItem} disabled={!metadata.name || !metadata.image}>
                Mint NFT
              </button>
            )}
          </div>
        </div>
      </div>
      <MyHoldings />
    </>
  );
};



export default CreateNFTs;
