// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title BaseAuraV2
 * @dev Dynamic ERC-721 NFT that tracks Base transaction activity
 * Like Bitcoin Aura: Anyone can mint for any address, but each target address can only be minted once
 */
contract BaseAuraV2 is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    // Token ID counter
    uint256 private _nextTokenId;

    // Mapping from target address to token ID
    mapping(address => uint256) private _targetAddressToTokenId;
    
    // Mapping to check if target address has been minted
    mapping(address => bool) private _targetAddressMinted;

    // Mapping from token ID to target address (the address the NFT represents)
    mapping(uint256 => address) private _tokenToTargetAddress;

    // Mapping from token ID to aura type
    mapping(uint256 => string) private _tokenAuras;

    // Base URI for images (Supabase)
    string public baseImageURI;

    // Aura types
    string public constant FIRE_WHALE = "fire";
    string public constant WAVE_RIDER = "water";
    string public constant TIDE_WATCHER = "tide";
    string public constant ROCK_HOLDER = "rock";

    // Events
    event AuraMinted(address indexed minter, address indexed targetAddress, uint256 indexed tokenId, string auraType);
    event AuraUpdated(uint256 indexed tokenId, string oldAura, string newAura);

    constructor(string memory _baseImageURI) ERC721("Base Aura", "BAURA") Ownable(msg.sender) {
        baseImageURI = _baseImageURI;
    }

    /**
     * @dev Mint a new Base Aura NFT for a target address
     * @param targetAddress The Base address this NFT represents (the address that was scanned)
     * @param auraType The type of aura (fire, water, tide, rock)
     * Anyone can mint for any address, but each target address can only be minted once
     */
    function mint(address targetAddress, string memory auraType) public {
        require(!_targetAddressMinted[targetAddress], "This address already has an Aura NFT");
        require(_isValidAura(auraType), "Invalid aura type");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _tokenAuras[tokenId] = auraType;
        _targetAddressToTokenId[targetAddress] = tokenId;
        _targetAddressMinted[targetAddress] = true;
        _tokenToTargetAddress[tokenId] = targetAddress;

        emit AuraMinted(msg.sender, targetAddress, tokenId, auraType);
    }

    /**
     * @dev Update the aura type of an existing NFT
     * @param tokenId The token ID to update
     * @param newAura The new aura type
     */
    function updateAura(uint256 tokenId, string memory newAura) public {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(_isValidAura(newAura), "Invalid aura type");

        string memory oldAura = _tokenAuras[tokenId];
        _tokenAuras[tokenId] = newAura;

        emit AuraUpdated(tokenId, oldAura, newAura);
    }

    /**
     * @dev Get the token ID for a target address
     */
    function getTokenByTargetAddress(address targetAddress) public view returns (uint256) {
        require(_targetAddressMinted[targetAddress], "Address has no Aura NFT");
        return _targetAddressToTokenId[targetAddress];
    }

    /**
     * @dev Get the target address for a token ID
     */
    function getTargetAddress(uint256 tokenId) public view returns (address) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return _tokenToTargetAddress[tokenId];
    }

    /**
     * @dev Check if a target address has been minted
     */
    function hasMinted(address targetAddress) public view returns (bool) {
        return _targetAddressMinted[targetAddress];
    }

    /**
     * @dev Get the aura type for a token
     */
    function getAura(uint256 tokenId) public view returns (string memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return _tokenAuras[tokenId];
    }

    /**
     * @dev Generate on-chain metadata with dynamic aura
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(tokenId < _nextTokenId, "Token does not exist");

        string memory auraType = _tokenAuras[tokenId];
        string memory auraName = _getAuraName(auraType);
        string memory auraDescription = _getAuraDescription(auraType);
        string memory imageUrl = string(abi.encodePacked(baseImageURI, auraType, ".png"));
        address targetAddr = _tokenToTargetAddress[tokenId];

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Base Aura #',
                        tokenId.toString(),
                        ' - ',
                        auraName,
                        '", "description": "',
                        auraDescription,
                        '", "image": "',
                        imageUrl,
                        '", "attributes": [{"trait_type": "Aura Type", "value": "',
                        auraName,
                        '"}, {"trait_type": "Tier", "value": "',
                        _getAuraTier(auraType),
                        '"}, {"trait_type": "Target Address", "value": "',
                        Strings.toHexString(uint160(targetAddr), 20),
                        '"}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev Set the base image URI (owner only)
     */
    function setBaseImageURI(string memory newBaseURI) public onlyOwner {
        baseImageURI = newBaseURI;
    }

    /**
     * @dev Check if aura type is valid
     */
    function _isValidAura(string memory aura) internal pure returns (bool) {
        bytes32 auraHash = keccak256(bytes(aura));
        return (
            auraHash == keccak256(bytes(FIRE_WHALE)) ||
            auraHash == keccak256(bytes(WAVE_RIDER)) ||
            auraHash == keccak256(bytes(TIDE_WATCHER)) ||
            auraHash == keccak256(bytes(ROCK_HOLDER))
        );
    }

    /**
     * @dev Get human-readable aura name
     */
    function _getAuraName(string memory aura) internal pure returns (string memory) {
        bytes32 auraHash = keccak256(bytes(aura));
        if (auraHash == keccak256(bytes(FIRE_WHALE))) return "Fire Whale";
        if (auraHash == keccak256(bytes(WAVE_RIDER))) return "Wave Rider";
        if (auraHash == keccak256(bytes(TIDE_WATCHER))) return "Tide Watcher";
        if (auraHash == keccak256(bytes(ROCK_HOLDER))) return "Rock Holder";
        return "Unknown";
    }

    /**
     * @dev Get aura description
     */
    function _getAuraDescription(string memory aura) internal pure returns (string memory) {
        bytes32 auraHash = keccak256(bytes(aura));
        if (auraHash == keccak256(bytes(FIRE_WHALE))) return "DeFi Power User - 500+ transactions on Base";
        if (auraHash == keccak256(bytes(WAVE_RIDER))) return "Active Explorer - 100-499 transactions on Base";
        if (auraHash == keccak256(bytes(TIDE_WATCHER))) return "Getting Started - 10-99 transactions on Base";
        if (auraHash == keccak256(bytes(ROCK_HOLDER))) return "Diamond Hands HODLer - 1-9 transactions on Base";
        return "Base Aura NFT";
    }

    /**
     * @dev Get aura tier number
     */
    function _getAuraTier(string memory aura) internal pure returns (string memory) {
        bytes32 auraHash = keccak256(bytes(aura));
        if (auraHash == keccak256(bytes(FIRE_WHALE))) return "Legendary";
        if (auraHash == keccak256(bytes(WAVE_RIDER))) return "Rare";
        if (auraHash == keccak256(bytes(TIDE_WATCHER))) return "Uncommon";
        if (auraHash == keccak256(bytes(ROCK_HOLDER))) return "Common";
        return "Unknown";
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
