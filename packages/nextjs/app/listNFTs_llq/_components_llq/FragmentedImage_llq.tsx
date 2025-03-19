import React, { useMemo } from 'react';
interface FragmentedImageProps {
  src: string;
  ownedShares: number;
  totalShares: number;
  className?: string;
}
export const FragmentedImage: React.FC<FragmentedImageProps> = ({
  src,
  ownedShares,
  totalShares,
  className = ""
}) => {
  // 计算网格大小 (将总份额转换为最接近的平方数)
  const gridSize = Math.ceil(Math.sqrt(totalShares));

  // 计算需要显示的块数
  const visibleBlocks = Math.floor((ownedShares / totalShares) * (gridSize * gridSize));

  // 生成随机可见块的索引
  const visibleIndices = useMemo(() => {
    const indices = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    // Fisher-Yates 洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, visibleBlocks);
  }, [gridSize, visibleBlocks]);

  const cellSize = 100 / gridSize; // 每个单元格的百分比大小

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        className="w-full h-full grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {Array.from({ length: gridSize * gridSize }, (_, index) => (
          <div
            key={index}
            className="relative overflow-hidden"
            style={{
              opacity: visibleIndices.includes(index) ? 1 : 0.1,
              transition: 'opacity 0.3s ease'
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${src})`,
                backgroundPosition: `${(index % gridSize) * (100 / (gridSize - 1))}% ${Math.floor(index / gridSize) * (100 / (gridSize - 1))}%`,
                backgroundSize: `${gridSize * 100}%`,
                transform: 'scale(1.01)', // 避免边缘出现缝隙
              }}
            />
          </div>
        ))}
      </div>

      {/* 显示拥有份额信息的覆盖层 */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-center">
        {Math.round((ownedShares / totalShares) * 100)}% Owned
      </div>
    </div>
  );
};

