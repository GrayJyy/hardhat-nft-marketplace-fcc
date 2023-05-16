// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NftMarketplace__PriceInvalid();
error NftMarketplace__NotApproved();
error NftMarketplace__IsNotOwner();
error NftMarketplace__IsListed();
error NftMarketplace__IsNotListed();

contract NftMarketplace {
    struct Listing {
        address seller;
        uint256 price;
    }
    // variables
    mapping(address => mapping(uint256 => Listing)) private s_listings;

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
            revert NftMarketplace__IsNotListed();
        }
        _;
    }
    modifier notListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__IsListed();
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
        public
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
        public
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }
}
