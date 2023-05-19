// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__PriceInvalid();
error NftMarketplace__NotApproved();
error NftMarketplace__IsNotOwner();
error NftMarketplace__IsListed(address nftAddress, uint256 tokenId);
error NftMarketplace__IsNotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PaymentIsNotEnough(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarketplace__WithdrawExcess();
error NftMarketplace__WithdrawFailed();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
    }
    // variables
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    // events
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    // modifier
    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace__IsNotOwner();
        }
        _;
    }
    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__IsNotListed(nftAddress, tokenId);
        }
        _;
    }
    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__IsListed(nftAddress, tokenId);
        }
        _;
    }

    // fn
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        notListed(nftAddress, tokenId)
    {
        if (price <= 0) {
            revert NftMarketplace__PriceInvalid();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApproved();
        }
        s_listings[nftAddress][tokenId] = Listing(msg.sender, price);

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function cancelList(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete s_listings[nftAddress][tokenId];
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        IERC721 nft = IERC721(nftAddress);
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (msg.value < listing.price) {
            revert NftMarketplace__PaymentIsNotEnough(
                nftAddress,
                tokenId,
                listing.price
            );
        }
        s_proceeds[listing.seller] += msg.value;
        delete s_listings[nftAddress][tokenId];
        nft.safeTransferFrom(listing.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listing.price);
    }

    function withdraw(uint256 amount) external payable {
        require(amount > 0, "amount less than 0");
        uint256 total = s_proceeds[msg.sender];
        require(total > 0, "total less than 0");
        if (amount > total) {
            revert NftMarketplace__WithdrawExcess();
        }
        s_proceeds[msg.sender] -= amount;
        // 注意这里是msg.sender而不是this。意为将 amount 个以太币从 NFT Marketplace 合约发送到 msg.sender 所代表的地址。
        (bool success, ) = payable(address(msg.sender)).call{value: amount}("");
        if (!success) {
            revert NftMarketplace__WithdrawFailed();
        }
    }

    // getter
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
