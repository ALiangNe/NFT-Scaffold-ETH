
"use client";

import { useEffect, useState } from "react";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

interface TransactionHistory {
  id: number; // 添加ID字段
  tokenId: number;
  buyer: string;
  seller: string;
  price: string;
  listingFee: string;
  timestamp: string;
}

const HistoryPage = () => {
  // 状态变量，用于过滤和显示的交易记录
  const [filteredHistories, setFilteredHistories] = useState<TransactionHistory[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 使用钩子函数读取交易历史事件
  const { data: eventHistory, isLoading, error } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "TransactionRecorded",
    fromBlock: 0n, // 根据需要调整起始区块
  });

  // 格式化历史记录
  useEffect(() => {
    if (eventHistory) {
      const formattedHistories = eventHistory.map((event: any, index: number) => ({
        id: index + 1, // 分配唯一的ID，从1开始计数
        tokenId: Number(event.args.tokenId),
        buyer: event.args.buyer,
        seller: event.args.seller,
        price: formatEther(event.args.price),
        listingFee: formatEther(event.args.listingFee),
        timestamp: new Date(Number(event.args.timestamp) * 1000).toISOString(),
      }));
      setFilteredHistories(formattedHistories);
    }
  }, [eventHistory]);

  // 过滤组件
  const handleFilter = () => {
    const minPriceNum = parseFloat(minPrice) || 0;
    const maxPriceNum = parseFloat(maxPrice) || Infinity;
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    const filtered = eventHistory
      .map((event: any, index: number) => ({
        id: index + 1, // 分配唯一的ID
        tokenId: Number(event.args.tokenId),
        buyer: event.args.buyer,
        seller: event.args.seller,
        price: formatEther(event.args.price),
        listingFee: formatEther(event.args.listingFee),
        timestamp: new Date(Number(event.args.timestamp) * 1000).toISOString(),
      }))
      .filter((transaction: TransactionHistory) => {
        const transactionDate = new Date(transaction.timestamp).getTime();
        const transactionPrice = parseFloat(transaction.price);
        return (
          transactionPrice >= minPriceNum &&
          transactionPrice <= maxPriceNum &&
          transactionDate >= start &&
          transactionDate <= end
        );
      });

    setFilteredHistories(filtered);
  };

  if (isLoading) return <div>Loading transaction history...</div>;
  if (error) return <div>Error loading transaction history</div>;

  return (
    <div className="p-8 max-w-[90vw] mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">NFT Transaction History</h1>

      <div className="flex flex-wrap gap-2 items-center mb-6 justify-center">
        <span className="text-lg font-semibold">Date:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input input-bordered w-70"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input input-bordered w-70"
        />
        <span className="text-lg font-semibold ml-4">Price:</span>
        <input
          type="text"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="input input-bordered w-28"
          placeholder="Min"
        />
        <input
          type="text"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="input input-bordered w-28"
          placeholder="Max"
        />
        <button onClick={handleFilter} className="btn btn-primary ml-4">
          Apply Filters
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg">
        <table className="table w-full min-w-[1100px]">
          <thead>
            <tr>
              <th className="bg-primary">ID</th>
              <th className="bg-primary">Token ID</th>
              <th className="bg-primary">Buyer</th>
              <th className="bg-primary">Seller</th>
              <th className="bg-primary">Price (ETH)</th>
              <th className="bg-primary">Listing Fee (ETH)</th>
              <th className="bg-primary">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistories.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">No transactions found.</td>
              </tr>
            ) : (
              filteredHistories.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="text-center">{transaction.id}</td>
                  <td className="text-center">{transaction.tokenId}</td>
                  <td><Address address={transaction.buyer} /></td>
                  <td><Address address={transaction.seller} /></td>
                  <td>{transaction.price}</td>
                  <td>{transaction.listingFee}</td>
                  <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;

// 单位转换函数
function formatEther(wei: string | bigint): string {
  const ethValue = BigInt(wei) / BigInt(10 ** 18);
  const remainder = BigInt(wei) % BigInt(10 ** 18);
  return `${ethValue}.${remainder.toString().padStart(18, "0").slice(0, 4)}`;
}
