// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
//  引入OpenZeppelin标准合约
import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // 引入ERC721 标准合约
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol"; // 引入 ERC721 可枚举扩展
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // 引入 ERC721 URI 存储扩展
import "@openzeppelin/contracts/access/Ownable.sol"; // 引入拥有者管理合约
import "@openzeppelin/contracts/utils/Counters.sol"; // 引入计数器库
import "@openzeppelin/contracts/token/common/ERC2981.sol"; // 引入  ERC2981 版税标准
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol"; // 引入 MerkleProof 库

// YourCollectible合约：实现ERC721标准的NFT并包含市场功能
contract YourCollectible is
	ERC721,
	ERC721Enumerable,
	ERC721URIStorage,
	Ownable,
	ERC2981
{
	// 合约构造函数，设置NFT的名称和符号
	constructor() ERC721("LLQCollectible", "LLQNFT") {}

	uint256[] public allBoxIds; // 存储所有盲盒的ID
	// 新增存储Merkle Root的变量
	bytes32 public merkleRoot;

	// 定义一个计数器，用于跟踪代币ID
	using Counters for Counters.Counter; // 使用计数器库
	Counters.Counter public tokenIdCounter; // Token ID计数器
	Counters.Counter private boxIdCounter; // 盲盒ID计数器

	// 定义NFT的上架信息结构
	struct Listing {
		uint256 price; // NFT的销售价格
		address seller; // NFT的卖家地址
		uint256 listingFee; // 上架费用
	}

	// 定义NFT的拍卖信息结构
	struct Auction {
		uint256 tokenId; // NFT的代币ID
		address seller; // 拍卖发起者
		uint256 startPrice; // 起拍价格
		uint256 minIncrement; // 最小加价金额
		uint256 endTime; // 拍卖结束时间
		address highestBidder; // 当前最高出价者
		uint256 highestBid; // 当前最高出价
		bool ended; // 拍卖是否已结束
		address[] bidders; // 存储所有参与竞拍的地址
	}

	// 盲盒数据结构
	struct MysteryBox {
		uint256[] tokenIds; // 包含的NFT ID列表
		address creator; // 创建者
		uint256 price; // 盲盒价格
		bool opened; // 是否已打开
	}

	// NFT收藏信息结构体
	struct Favorite {
		uint256 tokenId; // 被收藏的NFT ID
		uint256 timestamp; // 收藏的时间戳
	}

	// 临时转移结构体
	struct TemporaryTransfer {
		address originalOwner; // 原拥有者
		uint256 returnTime; // 自动归还时间（Unix 时间戳）
	}

	// 碎片化结构体
	struct Fragment {
		uint256 tokenId; // 原始NFT的ID
		uint256 totalShares; // 总份额数
		uint256 availableShares; // 剩余可购买的份额数
		uint256 sharePrice; // 每份的价格
		mapping(address => uint256) sharesOwned; // 用户拥有的份额
		address originalOwner; // NFT原始拥有者
		mapping(address => Listing) listings; // 用户的份额上架信息
		address[] activeSellers; // 当前活跃的卖家列表
		mapping(address => bool) isActiveSeller; // 跟踪卖家是否处于活跃状态
	}

	/*
		映射
	*/
	mapping(uint256 => Listing) public listings; // 存储每个NFT的上架信息
	mapping(uint256 => address) private creators; // 存储每个NFT的创作者地址（原始创作者）
	mapping(uint256 => Auction) public auctions; // 存储每个NFT的拍卖信息
	mapping(address => uint256) public pendingReturns; // 存储用户的押金待退回金额

	mapping(uint256 => MysteryBox) public mysteryBoxes; // 映射盲盒ID到盲盒数据
	mapping(address => uint256[]) public purchasedBoxes; // 用于存储每个用户购买的盲盒ID
	// 存储用户收藏的NFT列表（结构体形式）
	mapping(address => Favorite[]) private _userFavorites;
	// 记录已经领取的地址
	mapping(address => bool) public hasClaimed;
	// 映射：记录临时转移的 NFT
	mapping(uint256 => TemporaryTransfer) public temporaryTransfers;
	mapping(uint256 => Fragment) public fragmentedNFTs; // tokenId 到碎片化信息的映射

	/*
		事件
	*/
	// 记录上架信息
	event Listed(
		uint256 tokenId,
		uint256 price,
		address seller,
		uint256 listingFee
	);
	// 记录购买信息
	event Sold(
		uint256 tokenId,
		address buyer,
		address seller,
		uint256 price,
		uint256 royaltyAmount
	);
	// 记录交易历史
	event TransactionRecorded(
		uint256 tokenId,
		address buyer,
		address seller,
		uint256 price,
		uint256 listingFee,
		uint256 timestamp
	);
	// 记录拍卖发起事件
	event AuctionStarted(
		uint256 tokenId,
		address seller,
		uint256 startPrice,
		uint256 endTime
	);
	// 记录竞价事件
	event BidPlaced(
		uint256 tokenId,
		address bidder,
		uint256 bidAmount,
		uint256 timestamp
	);

	// 定义基础URI，用于获取NFT元数据的基本地址
	function _baseURI() internal pure override returns (string memory) {
		return "https://bronze-careful-clam-859.mypinata.cloud/ipfs/";
	}

	// 铸造新的N FT
	function mintItem(
		address to, // 接收NFT的地址
		string memory uri, // NFT元数据的URI
		uint96 royaltyPercentage, // 版税比例（基于基础点 ，1000表示10% ）
		address royaltyRecipient // 版税接收者地址
	) public returns (uint256) {
		require(
			royaltyPercentage <= 1000,
			"Royalty percentage cannot exceed 10%"
		); // 确保版税不超过10%
		tokenIdCounter.increment(); // 增加代币ID计数器
		uint256 tokenId = tokenIdCounter.current(); // 获取当前的代币ID
		_safeMint(to, tokenId); // 安全地将NFT铸造到目标地址
		_setTokenURI(tokenId, uri); // 设置NFT的元数据URI

		// 使用ERC2981标准方法设置版税
		_setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage);

		// 记录创作者地址
		creators[tokenId] = msg.sender;

		return tokenId; // 返回新铸造的代币ID
	}

	// 批量铸造NFT
	function mintBatchItems(
		address to, // 接收NFT的地址
		string memory uri, // NFT元数据的URI
		uint96 royaltyPercentage, // 版税比例
		address royaltyRecipient, // 版税接收者
		uint256 quantity // 铸造的数量
	) public returns (uint256[] memory) {
		require(
			royaltyPercentage <= 1000,
			"Royalty percentage cannot exceed 10%"
		); // 确保版税不超过10%
		require(quantity > 0, "Quantity must be greater than zero"); // 确保数量大于0

		uint256[] memory tokenIds = new uint256[](quantity); // 创建一个数组存储代币ID

		for (uint256 i = 0; i < quantity; i++) {
			tokenIdCounter.increment(); // 增加代币ID计数器
			uint256 tokenId = tokenIdCounter.current(); // 获取当前的代币ID
			_safeMint(to, tokenId); // 安全地将NFT铸造到目标地址
			_setTokenURI(tokenId, uri); // 设置NFT的元数据URI
			_setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage); // 设置版税

			creators[tokenId] = msg.sender; // 记录创作者地址
		}

		return tokenIds; // 返回所有新铸造的代币ID
	}

	// 卖家上架NFT的函数
	function listNFT(uint256 tokenId, uint256 price) external payable {
		require(price > 0, "Price must be greater than zero"); // 确保价格有效
		require(ownerOf(tokenId) == msg.sender, "You do not own this NFT"); // 确保卖家拥有该NFT

		uint256 listingFee = (price * 20) / 100; // 计算上架费用

		transferFrom(msg.sender, address(this), tokenId); // 将NFT从卖家转移到合约

		listings[tokenId] = Listing({
			price: price,
			seller: msg.sender,
			listingFee: listingFee
		}); // 存储上架信息

		emit Listed(tokenId, price, msg.sender, listingFee); // 触发上架事件
	}

	// 卖家下架NFT的函数
	function unlistNFT(uint256 tokenId) external {
		// 确保调用者是NFT的拥有者
		Listing memory listing = listings[tokenId];
		require(
			listing.seller == msg.sender,
			"You are not the seller of this NFT"
		); // 确保调用者是卖家

		// 确保该NFT是已经上架的
		require(listing.price > 0, "NFT is not listed for sale");

		// 将NFT从合约转回卖家
		this.transferFrom(address(this), msg.sender, tokenId);

		// 删除上架信息
		delete listings[tokenId];

		// 触发下架事件
		emit Unlisted(tokenId, msg.sender);
	}

	// 新增下架事件
	event Unlisted(uint256 tokenId, address seller);

	// 买家购买NFT的函数
	function buyNFT(uint256 tokenId) external payable {
		Listing memory listing = listings[tokenId]; // 获取NFT的上架信息
		require(listing.price > 0, "NFT not for sale"); // 确保NFT在出售中
		require(msg.value >= listing.price, "Insufficient payment"); // 确保支付金额足够

		address seller = listing.seller; // 获取卖家地址
		uint256 sellerPayment = listing.price; // 初始化卖家应得金额

		(address royaltyRecipient, uint256 royaltyAmount) = royaltyInfo(
			tokenId,
			listing.price
		); // 获取版税信息

		// 如果版税接收者存在且金额大于0，则支付版税
		if (royaltyRecipient != address(0) && royaltyAmount > 0) {
			payable(royaltyRecipient).transfer(royaltyAmount); // 转账版税
			sellerPayment -= royaltyAmount; // 减去版税金额
		}

		this.transferFrom(address(this), msg.sender, tokenId); // 将NFT从合约转移到买家
		payable(seller).transfer(sellerPayment); // 支付卖家应得金额

		// 删除上架信息
		delete listings[tokenId];
		// 触发记录交易的事件
		emit TransactionRecorded(
			tokenId,
			msg.sender,
			seller,
			listing.price,
			listing.listingFee,
			block.timestamp
		);
		// 触发销售事件
		emit Sold(tokenId, msg.sender, seller, listing.price, royaltyAmount);
	}

	// 获取当前NFT的创作者
	function getCreator(uint256 tokenId) external view returns (address) {
		return creators[tokenId];
	}

	// 获取所有已上架的NFT的tokenId列表
	function getListedNFTs() external view returns (uint256[] memory) {
		uint256 total = tokenIdCounter.current();
		uint256 listedCount = 0;

		for (uint256 i = 1; i <= total; i++) {
			if (listings[i].price > 0) {
				listedCount++;
			}
		}

		uint256[] memory listedTokenIds = new uint256[](listedCount);
		uint256 index = 0;

		for (uint256 i = 1; i <= total; i++) {
			if (listings[i].price > 0) {
				listedTokenIds[index] = i;
				index++;
			}
		}

		return listedTokenIds;
	}

	// 获取特定NFT的上架价格
	function getListingPrice(uint256 tokenId) external view returns (uint256) {
		return listings[tokenId].price;
	}

	// 发起拍卖
	function startAuction(
		uint256 tokenId, // NFT的代币ID
		uint256 startPrice, // 起拍价格
		uint256 minIncrement, // 最小加价金额
		uint256 duration // 拍卖持续时长（秒）
	) external {
		require(
			ownerOf(tokenId) == msg.sender,
			"Only the owner can start the auction"
		); // 确保发起者是NFT的拥有者
		require(
			auctions[tokenId].endTime == 0,
			"Auction already started for this token"
		); // 确保NFT未处于拍卖状态

		transferFrom(msg.sender, address(this), tokenId); // 将NFT从卖家转移到合约

		// 初始化拍卖信息
		auctions[tokenId] = Auction({
			tokenId: tokenId,
			seller: msg.sender,
			startPrice: startPrice,
			minIncrement: minIncrement,
			endTime: block.timestamp + duration,
			highestBidder: address(0),
			highestBid: 0,
			ended: false,
			bidders: new address[](0) //空数组
		});

		emit AuctionStarted(
			tokenId,
			msg.sender,
			startPrice,
			block.timestamp + duration
		); // 触发拍卖开始事件
	}

	// 获取正在拍卖的NFT列表
	function getAuctionedNFTs() public view returns (uint256[] memory) {
		uint256 totalSupply = tokenIdCounter.current();
		uint256 auctionedCount = 0;

		for (uint256 i = 1; i <= totalSupply; i++) {
			if (auctions[i].endTime > block.timestamp && !auctions[i].ended) {
				auctionedCount++;
			}
		}

		uint256[] memory auctionedTokenIds = new uint256[](auctionedCount);
		uint256 index = 0;

		for (uint256 i = 1; i <= totalSupply; i++) {
			if (auctions[i].endTime > block.timestamp && !auctions[i].ended) {
				auctionedTokenIds[index] = i;
				index++;
			}
		}
		return auctionedTokenIds;
	}

	// 获取某个NFT的拍卖详情
	function getAuctionDetails(
		uint256 tokenId
	)
		public
		view
		returns (
			address seller,
			uint256 startPrice,
			uint256 minIncrement,
			uint256 endTime,
			address highestBidder,
			uint256 highestBid,
			bool ended
		)
	{
		Auction memory auction = auctions[tokenId];
		return (
			auction.seller,
			auction.startPrice,
			auction.minIncrement,
			auction.endTime,
			auction.highestBidder,
			auction.highestBid,
			auction.ended
		);
	}

	// 参与竞拍
	function bid(uint256 tokenId) external payable {
		Auction storage auction = auctions[tokenId];
		// 1. 基本验证
		require(block.timestamp < auction.endTime, "Auction has ended");
		require(!auction.ended, "Auction already ended");
		require(
			msg.sender != auction.seller,
			"Seller cannot bid on their own auction"
		);

		// 2. 验证出价金额
		if (auction.highestBid == 0) {
			require(
				msg.value >= auction.startPrice,
				"Bid must be at least the starting price"
			);
		} else {
			require(
				msg.value + pendingReturns[msg.sender] >=
					auction.highestBid + auction.minIncrement,
				"Bid must be higher than current highest bid plus increment"
			);
		}

		if (msg.sender == auction.highestBidder) {
			uint256 refundAmount = auction.highestBid;
			auction.highestBid = 0;
			(bool success, ) = payable(msg.sender).call{ value: refundAmount }(
				""
			);
			require(success, "Refund failed");
		}

		// 3. 处理之前的最高出价者的退款
		if (auction.highestBidder != address(0) && auction.highestBid > 0) {
			pendingReturns[auction.highestBidder] += auction.highestBid;
		}

		// 4. 添加新的竞拍者到列表
		if (pendingReturns[msg.sender] == 0) {
			auction.bidders.push(msg.sender);
		}

		// 5. 更新最高出价信息
		auction.highestBidder = msg.sender;
		auction.highestBid = msg.value;
		pendingReturns[msg.sender] = 0;

		// 触发事件
		// emit BidPlaced(tokenId, msg.sender, msg.value);
		emit BidPlaced(tokenId, msg.sender, msg.value, block.timestamp);
	}

	// 结束拍卖并自动退还押金
	function endAuction(uint256 tokenId) external {
		Auction storage auction = auctions[tokenId];
		require(auction.endTime != 0, "Auction does not exist");
		// require(block.timestamp >= auction.endTime, "Auction has not ended yet");
		require(!auction.ended, "Auction already ended");

		auction.ended = true;

		// 3. 处理拍卖结果
		if (auction.highestBid != 0) {
			// 有人竞拍成功：转账给卖家，NFT转给最高出价者
			payable(auction.seller).transfer(auction.highestBid);
			this.transferFrom(address(this), auction.highestBidder, tokenId);
		} else {
			// 无人竞拍成功：NFT转回卖家
			this.transferFrom(address(this), auction.seller, tokenId);
		}

		// 自动退还押金
		for (uint256 i = 0; i < auction.bidders.length; i++) {
			address bidder = auction.bidders[i];
			uint256 amount = pendingReturns[bidder];
			if (amount > 0) {
				pendingReturns[bidder] = 0;
				(bool success, ) = payable(bidder).call{ value: amount }("");
				require(success, "Failed to refund deposit");
			}
		}
	}

	// 重写 _beforeTokenTransfer，防止非法转移
	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId,
		uint256 batchSize
	) internal override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId, batchSize);
	}

	// 创建盲盒，绑定已铸造的NFT
	function createMysteryBox(
		uint256[] memory tokenIds,
		uint256 pricePerNFT
	) external {
		require(tokenIds.length > 0, "Box must contain at least one NFT");

		// 验证创建者拥有所有NFT并将NFT转入合约
		for (uint256 i = 0; i < tokenIds.length; i++) {
			require(
				ownerOf(tokenIds[i]) == msg.sender,
				"You must own all NFTs"
			);
			transferFrom(msg.sender, address(this), tokenIds[i]);
		}

		uint256 boxId = boxIdCounter.current();
		boxIdCounter.increment();

		// 存储盲盒信息
		mysteryBoxes[boxId] = MysteryBox({
			tokenIds: tokenIds,
			creator: msg.sender,
			price: pricePerNFT, // 每个NFT的价格
			opened: false
		});

		allBoxIds.push(boxId);
	}

	// 购买并打开盲盒，随机获得一个NFT
	function purchaseAndOpenMysteryBox(uint256 boxId) external payable {
		// 1.获取盲盒信息
		MysteryBox storage box = mysteryBoxes[boxId];

		// 2.验证盲盒的有效性
		require(box.tokenIds.length > 0, "No NFTs left in mystery box");
		require(!box.opened, "Mystery box already opened");
		require(msg.value >= box.price, "Insufficient payment");

		// 3.生成随机数
		uint256 randomIndex = uint256(
			keccak256(
				abi.encodePacked(
					block.timestamp,
					block.difficulty,
					msg.sender,
					box.tokenIds.length
				)
			)
		) % box.tokenIds.length;

		// 4.获取随机选中的NFT ID
		uint256 selectedTokenId = box.tokenIds[randomIndex];

		// 5.从tokenIds数组中移除已选中的NFT（将最后一个元素移到被选中的位置，然后删除最后一个元素）
		box.tokenIds[randomIndex] = box.tokenIds[box.tokenIds.length - 1];
		box.tokenIds.pop();

		// 6.转账给盲盒创建者
		payable(box.creator).transfer(msg.value);

		// 7.将选中的NFT转移给购买者
		_safeTransfer(address(this), msg.sender, selectedTokenId, "");

		// 8.记录购买历史
		purchasedBoxes[msg.sender].push(boxId);

		// 9.如果盲盒中没有剩余NFT，标记为已打开
		if (box.tokenIds.length == 0) {
			box.opened = true;
		}
	}

	// 查询用户已购买的盲盒列表
	function getPurchasedBoxes() external view returns (uint256[] memory) {
		return purchasedBoxes[msg.sender];
	}

	// 返回所有盲盒ID
	function getAllBoxIds() public view returns (uint256[] memory) {
		return allBoxIds;
	}

	// 获取单个盲盒的详情
	function getBoxDetails(
		uint256 boxId
	)
		public
		view
		returns (
			uint256 id,
			uint256[] memory tokenIds,
			address creator,
			uint256 price,
			bool opened
		)
	{
		MysteryBox memory box = mysteryBoxes[boxId];
		return (boxId, box.tokenIds, box.creator, box.price, box.opened);
	}

	// 添加收藏
	function addFavorite(uint256 tokenId) external {
		require(_exists(tokenId), "NFT does not exist");

		// 创建一个新的Favorite结构体并保存
		Favorite memory newFavorite = Favorite({
			tokenId: tokenId,
			timestamp: block.timestamp // 当前时间戳
		});

		_userFavorites[msg.sender].push(newFavorite); // 将新的收藏添加到用户的收藏列表
	}

	// 取消收藏
	function removeFavorite(uint256 tokenId) external {
		// 从用户的收藏列表中查找该tokenId
		Favorite[] storage userFavorites = _userFavorites[msg.sender];
		bool found = false;

		for (uint256 i = 0; i < userFavorites.length; i++) {
			if (userFavorites[i].tokenId == tokenId) {
				// 将要删除的元素与最后一个元素交换，并删除
				userFavorites[i] = userFavorites[userFavorites.length - 1];
				userFavorites.pop();
				found = true;
				break;
			}
		}

		require(found, "NFT not found in favorites");
	}

	// 查询某个地址收藏的所有 NFT 列表
	function getFavoritesForAddress(
		address user
	) public view returns (Favorite[] memory) {
		return _userFavorites[user]; // 返回指定地址的收藏列表
	}

	// 查询用户是否收藏了某个NFT
	function isFavorite(
		address user,
		uint256 tokenId
	) external view returns (bool) {
		// 获取用户的收藏列表
		Favorite[] storage userFavorites = _userFavorites[user];

		// 遍历用户的收藏列表，检查是否包含指定的 tokenId
		for (uint256 i = 0; i < userFavorites.length; i++) {
			if (userFavorites[i].tokenId == tokenId) {
				return true; // 如果找到了匹配的tokenId，则返回true，表示用户已收藏
			}
		}

		return false; // 如果未找到匹配的tokenId，则返回false
	}

	// 获取用户收藏的 NFT
	function getMyFavoriteItems(
		address user
	) public view returns (uint256[] memory) {
		uint256 count = balanceOf(user); // 假设是获取该用户的NFT个数
		uint256[] memory tokenIds = new uint256[](count);

		for (uint256 i = 0; i < count; i++) {
			tokenIds[i] = tokenOfOwnerByIndex(user, i); // 获取每个token的ID
		}

		return tokenIds;
	}

	// 设置Merkle Root（仅限合约拥有者）
	function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
		merkleRoot = _merkleRoot;
	}

	// 空投领取功能
	function claimAirdrop(
		bytes32[] calldata merkleProof,
		uint256 tokenId
	) external {
		// 1. 验证用户是否已经领取过
		require(!hasClaimed[msg.sender], "Airdrop already claimed");
		// 2. 验证Merkle Root是否已设置
		require(merkleRoot != bytes32(0), "Merkle root not set");

		// 3. 验证用户地址对应的叶子节点
		bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
		require(
			MerkleProof.verify(merkleProof, merkleRoot, leaf),
			"Invalid Merkle proof"
		);

		// 验证 NFT 是否仍在合约中
		require(ownerOf(tokenId) == address(this), "NFT is not available");

		// 标记用户已领取
		hasClaimed[msg.sender] = true;

		// 将 NFT 转移到用户地址
		// TODO:修改为transferFrom
		_transfer(address(this), msg.sender, tokenId);

		// 触发事件
	}

	// 验证某地址是否已经领取
	function hasClaimedAirdrop(address user) external view returns (bool) {
		return hasClaimed[user];
	}

	// 空投：将 NFT 转移到合约
	function temporarilyTransferToContract(
		uint256 tokenId,
		uint256 returnTime
	) external {
		require(ownerOf(tokenId) == msg.sender, "You must own the NFT");
		require(returnTime > 0, "Duration must be greater than zero");

		// 记录临时转移信息
		temporaryTransfers[tokenId] = TemporaryTransfer({
			originalOwner: msg.sender,
			returnTime: returnTime
		});

		// 转移 NFT 到合约
		// TODO:修改为transferFrom
		_transfer(msg.sender, address(this), tokenId);
	}

	// 空投：检查并归还到期的NFT
	function retrieveExpiredNFTs(uint256[] calldata tokenIds) external {
		for (uint256 i = 0; i < tokenIds.length; i++) {
			uint256 tokenId = tokenIds[i];
			TemporaryTransfer memory tempTransfer = temporaryTransfers[tokenId];

			// 检查是否已到期并仍在合约地址
			if (
				block.timestamp >= tempTransfer.returnTime &&
				ownerOf(tokenId) == address(this)
			) {
				// TODO:修改为transferFrom
				_transfer(address(this), tempTransfer.originalOwner, tokenId);

				// 删除记录
				delete temporaryTransfers[tokenId];
			}
		}
	}

	// 空投：获取转移的NFT所有列表
	function getTemporarilyTransferredNFTs()
		external
		view
		returns (uint256[] memory)
	{
		uint256 totalSupply = tokenIdCounter.current(); // 获取当前已铸造的总 NFT 数量
		uint256 count = 0;

		// 首次遍历：统计临时转移的 NFT 数量
		for (uint256 i = 1; i <= totalSupply; i++) {
			if (
				temporaryTransfers[i].originalOwner != address(0) &&
				ownerOf(i) == address(this)
			) {
				count++;
			}
		}

		// 创建结果数组
		uint256[] memory transferredNFTs = new uint256[](count);
		uint256 index = 0;

		//  第二次遍历：填充结果数组
		for (uint256 i = 1; i <= totalSupply; i++) {
			if (
				temporaryTransfers[i].originalOwner != address(0) &&
				ownerOf(i) == address(this)
			) {
				transferredNFTs[index] = i;
				index++;
			}
		}

		return transferredNFTs;
	}

	/*
		碎片化NFT
	 */
	function fragmentNFT(
		uint256 tokenId,
		uint256 totalShares,
		uint256 sharePrice
	) external {
		// 1. 验证所有权和参数
		require(
			ownerOf(tokenId) == msg.sender,
			"You must own the NFT to fragment it"
		);
		require(totalShares > 1, "Total shares must be greater than 1");
		require(sharePrice > 0, "Share price must be greater than 0");

		// 2. 转移NFT到合约
		// TODO:修改为transferFrom
		_transfer(msg.sender, address(this), tokenId);

		// 3. 初始化碎片化数据
		Fragment storage fragment = fragmentedNFTs[tokenId];
		fragment.tokenId = tokenId;
		fragment.totalShares = totalShares;
		fragment.availableShares = totalShares;
		fragment.sharePrice = sharePrice;
		fragment.originalOwner = msg.sender;
	}

	// 购买NFT份额
	function purchaseShares(uint256 tokenId, uint256 shares) external payable {
		Fragment storage fragment = fragmentedNFTs[tokenId];
		// 1. 验证
		require(fragment.tokenId == tokenId, "This NFT is not fragmented");
		require(shares > 0, "Shares must be greater than 0");
		require(
			fragment.availableShares >= shares,
			"Not enough shares available"
		);
		require(msg.value == shares * fragment.sharePrice, "Incorrect payment");

		 // 2. 转账给原始持有者
		payable(fragment.originalOwner).transfer(msg.value);

// 3. 更新份额信息
		fragment.sharesOwned[msg.sender] += shares;
		fragment.availableShares -= shares;
	}

	// 获取份额价格
	function getSharePrice(uint256 tokenId) public view returns (uint256) {
		return fragmentedNFTs[tokenId].sharePrice;
	}

	// 赎回NFT
	function redeemNFT(uint256 tokenId) external {
		Fragment storage fragment = fragmentedNFTs[tokenId];
		require(fragment.tokenId == tokenId, "This NFT is not fragmented");
		require(
			fragment.sharesOwned[msg.sender] == fragment.totalShares,
			"You must own all shares to redeem"
		);

		// 将NFT转移回持有所有份额的用户
		// TODO:修改为transferFrom
		_transfer(address(this), msg.sender, tokenId);

		// 删除碎片化数据
		delete fragmentedNFTs[tokenId];
	}

	// 获取用户的拥有份额
	function getSharesOwned(
		uint256 tokenId,
		address user
	) external view returns (uint256) {
		return fragmentedNFTs[tokenId].sharesOwned[user];
	}

	// 获取碎片化NFT列表
	function getFragmentedNFTs() public view returns (uint256[] memory) {
		uint256 totalSupply = tokenIdCounter.current();
		uint256 count = 0;

		// 统计碎片化的NFT数量
		for (uint256 i = 1; i <= totalSupply; i++) {
			if (fragmentedNFTs[i].totalShares > 0) {
				count++;
			}
		}

		// 创建数组并填充碎片化的NFT ID
		uint256[] memory fragmentedNFTIds = new uint256[](count);
		uint256 index = 0;
		for (uint256 i = 1; i <= totalSupply; i++) {
			if (fragmentedNFTs[i].totalShares > 0) {
				fragmentedNFTIds[index] = i;
				index++;
			}
		}

		return fragmentedNFTIds;
	}

	// 获取碎片化NFT的信息
	function getFragmentInfo(
		uint256 tokenId
	)
		public
		view
		returns (
			uint256 totalShares,
			uint256 availableShares,
			uint256 sharePrice
		)
	{
		Fragment storage fragment = fragmentedNFTs[tokenId];
		require(fragment.totalShares > 0, "NFT is not fragmented"); // 确保NFT已碎片化
		return (
			fragment.totalShares,
			fragment.availableShares,
			fragment.sharePrice
		);
	}

	// 获取用户拥有的碎片化NFT及其拥有的份额
	function getUserFragmentShares(
		address user
	)
		public
		view
		returns (
			uint256[] memory tokenIds,
			uint256[] memory ownedShares,
			uint256[] memory totalShares
		)
	{
		uint256 totalSupply = tokenIdCounter.current(); // 当前已铸造的NFT数量
		uint256 count = 0;

		// 统计用户拥有碎片的NFT数量
		for (uint256 i = 1; i <= totalSupply; i++) {
			if (fragmentedNFTs[i].sharesOwned[user] > 0) {
				count++;
			}
		}

		// 初始化结果数组
		tokenIds = new uint256[](count);
		ownedShares = new uint256[](count);
		totalShares = new uint256[](count);

		uint256 index = 0;

		// 填充结果数组
		for (uint256 i = 1; i <= totalSupply; i++) {
			if (fragmentedNFTs[i].sharesOwned[user] > 0) {
				tokenIds[index] = i;
				ownedShares[index] = fragmentedNFTs[i].sharesOwned[user];
				totalShares[index] = fragmentedNFTs[i].totalShares; // 添加总份额字段
				index++;
			}
		}

		return (tokenIds, ownedShares, totalShares);
	}

	/* *
	 * @dev 重写ERC721Enumerable的必要函数
	 */

	function _burn(
		uint256 tokenId
	) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
		_resetTokenRoyalty(tokenId); // 重置版税信息
	}

	function tokenURI(
		uint256 tokenId
	) public view override(ERC721, ERC721URIStorage) returns (string memory) {
		return super.tokenURI(tokenId);
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(ERC721, ERC721Enumerable, ERC2981, ERC721URIStorage)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}

	// 上架碎片份额
	function listFragmentShares(
		uint256 tokenId,
		uint256 shares,
		uint256 price
	) external {
		Fragment storage fragment = fragmentedNFTs[tokenId];

		require(shares > 0, "Must list at least 1 share");
// 1. 计算上架费用
		uint256 listingFee = (price * 20) / 100; // 计算上架费用

		// 2. 转移份额到合约
		fragment.sharesOwned[msg.sender] -= shares;
		fragment.sharesOwned[address(this)] += shares;

		// 3. 创建上架信息
		fragment.listings[msg.sender] = Listing({
			price: price,
			seller: msg.sender,
			listingFee: listingFee
		});

		// 添加到活跃卖家列表
		if (!fragment.isActiveSeller[msg.sender]) {
			fragment.activeSellers.push(msg.sender);
			fragment.isActiveSeller[msg.sender] = true;
		}
	}

	// 添加购买碎片函数
	function buyListedShares(
		uint256 tokenId,
		address seller,
		uint256 sharesToBuy
	) external payable {
		// 1. 转移份额
		Fragment storage fragment = fragmentedNFTs[tokenId];
		Listing storage listing = fragment.listings[seller];

		// 从合约转移份额给买家
		fragment.sharesOwned[address(this)] -= sharesToBuy;
		fragment.sharesOwned[msg.sender] += sharesToBuy;

		// 2. 计算支付金额
		uint256 payment = sharesToBuy * listing.price;
		uint256 listingFee = listing.listingFee;
		uint256 sellerPayment = payment - listingFee;

		// 如果合约没有剩余份额,删除上架信 息
		if (fragment.sharesOwned[address(this)] == 0) {
			delete fragment.listings[seller];
		}

		// 转账给卖家
		payable(seller).transfer(sellerPayment);
	}
	
	// 获取已上架碎片的NFT列表
	function getListedFragmentNFTs() external view returns (uint256[] memory) {
		uint256 totalSupply = tokenIdCounter.current();
		uint256 count = 0;

		// 计算有上架碎片的NFT数量
		for (uint256 i = 1; i <= totalSupply; i++) {
			Fragment storage fragment = fragmentedNFTs[i];
			if (fragment.activeSellers.length > 0) {
				count++;
			}
		}

		// 创建返回数组
		uint256[] memory listedNFTs = new uint256[](count);
		uint256 index = 0;

		// 填充数据
		for (uint256 i = 1; i <= totalSupply; i++) {
			Fragment storage fragment = fragmentedNFTs[i];
			if (fragment.activeSellers.length > 0) {
				listedNFTs[index] = i;
				index++;
			}
		}

		return listedNFTs;
	}
}
