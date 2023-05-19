// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
    uint256 private s_tokenId;

    event Minted(uint256 indexed tokenId);

    constructor() ERC721("Test NFT", "TN") {
        s_tokenId = 0;
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenId);
        emit Minted(s_tokenId);
        s_tokenId += 1;
    }

    function tokenURI(uint256) public pure override returns (string memory) {
        return TOKEN_URI;
    }

    function tokenId() public view returns (uint256) {
        return s_tokenId;
    }
}
