// import { MerkleTree } from "merkletreejs";
// import keccak256 from "keccak256";

// /**
//  * 生成 Merkle Tree 和 Merkle Root
//  * @param addresses - 用户地址数组
//  */
// export function generateMerkleTree(addresses: string[]) {
//   // 将用户地址哈希化
//   const leaves = addresses.map(addr => keccak256(addr));
//   const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

//   const merkleRoot = tree.getHexRoot();
//   return { tree, merkleRoot };
// }

// /**
//  * 生成 Merkle Proof
//  * @param tree - Merkle 树实例
//  * @param address - 用户地址
//  */
// export function generateMerkleProof(tree: MerkleTree, address: string) {
//   const leaf = keccak256(address);
//   return tree.getHexProof(leaf);
// }


import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { airdropAddresses } from "./airdropAddresses_llq";

/**
 * 生成 Merkle Tree 和 Merkle Root
 */
export function generateMerkleTree() {
  // 直接使用导入的白名单地址
  const leaves = airdropAddresses.map(addr => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const merkleRoot = tree.getHexRoot();
  return { tree, merkleRoot };
}

/**
 * 生成 Merkle Proof
 * @param tree - Merkle 树实例
 * @param address - 用户地址
 */
export function generateMerkleProof(tree: MerkleTree, address: string) {
  const leaf = keccak256(address);
  return tree.getHexProof(leaf);
}

// 可以添加一个便捷函数来检查地址是否在白名单中
export function isAddressInWhitelist(address: string): boolean {
  return airdropAddresses.includes(address);
}
