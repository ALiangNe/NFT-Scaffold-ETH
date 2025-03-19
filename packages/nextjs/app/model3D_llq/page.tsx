'use client'
import type { NextPage } from "next";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("../../components/model/ModelViewer"), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-base-300 to-base-100">
      {/* 顶部横幅 */}
      <div className="w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 p-1">
        <div className="flex justify-center items-center py-1 text-white text-sm font-medium">
          <span className="animate-pulse">✨ 3D NFT 展示空间已开放！</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-10">
        {/* 标题区域 */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
            3D NFT 展示
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            探索数字艺术的新维度！在这里，您可以以前所未有的方式欣赏和互动3D NFT作品。
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M14.555 3.168a1 1 0 00-1.414 0L3.707 12.602a1 1 0 001.414 1.414l9.434-9.434a1 1 0 000-1.414z"/>
                <path d="M16.555 5.168a1 1 0 00-1.414 0L5.707 14.602a1 1 0 001.414 1.414l9.434-9.434a1 1 0 000-1.414z"/>
              </svg>
              <span>3D 互动</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/>
              </svg>
              <span>高清渲染</span>
            </div>
            <div className="flex items-center space-x-2 bg-base-200 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              <span>沉浸体验</span>
            </div>
          </div>
        </div>

        {/* 3D 模型展示区域 */}
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden 
          shadow-[0_0_30px_rgba(139,92,246,0.3)] border border-purple-500/20">
          <div className="absolute inset-0">
            {/* <ModelViewer modelPath="/model/elephantAI.glb" /> */}
          </div>
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-base-300/80 to-transparent"></div>
        </div>

        {/* 底部信息 */}
        <div className="mt-16 text-center space-y-6">
          <h3 className="text-2xl font-bold">操作指南</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">🖱️</div>
                <h4 className="text-xl font-bold mb-2">旋转视角</h4>
                <p>点击并拖动鼠标来旋转模型</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">🔍</div>
                <h4 className="text-xl font-bold mb-2">缩放模型</h4>
                <p>使用鼠标滚轮进行缩放</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">👆</div>
                <h4 className="text-xl font-bold mb-2">平移视角</h4>
                <p>按住右键拖动来平移视角</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;