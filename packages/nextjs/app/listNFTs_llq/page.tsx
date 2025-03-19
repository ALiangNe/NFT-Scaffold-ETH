"use client";

import { MyHoldings } from "./_components_llq/index_llq";
import type { NextPage } from "next";

const MyNFTs: NextPage = () => {


  return (
    <>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-indigo-100/20 to-violet-100/20 pointer-events-none" />
        
        <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 p-1">
          <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
            <span className="animate-pulse">💎 管理您的数字资产收藏</span>
          </div>
        </div>

        <div className="flex items-center flex-col pt-10">
          <div className="px-5 text-center max-w-3xl">
            <h1 className="text-center mb-4">
              <span className="block text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500">
                我的 NFT 收藏
              </span>
            </h1>
            <p className="text-xl text-base-content/70 mb-6">
              列出、管理和变现您的数字资产。将您的 NFT 转化为市场挂单、拍卖品、盲盒或设置空投。
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="badge badge-lg bg-blue-100 text-blue-800 border-blue-200 gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                </svg>
                挂单出售
              </div>
              <div className="badge badge-lg bg-indigo-100 text-indigo-800 border-indigo-200 gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/>
                </svg>
                开始拍卖
              </div>
              <div className="badge badge-lg bg-violet-100 text-violet-800 border-violet-200 gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z"/>
                </svg>
                创建盲盒
              </div>
            </div>
          </div>
        </div>
      </div>

      <MyHoldings />
    </>
  );
};

export default MyNFTs;
