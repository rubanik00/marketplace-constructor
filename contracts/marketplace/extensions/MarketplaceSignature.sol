// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract MarketplaceSignature {
    struct Vrs {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct SignData {
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 nonce;
        address token;
        address saleToken;
        address buyer;
        bool tokenType;
    }

    bytes32 private constant EIP712DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 private constant SIGNDATA_TYPEHASH =
        keccak256(
            "SignData(uint256 tokenId,uint256 quantity,uint256 price,uint256 nonce,address token,address saleToken,address buyer,bool tokenType)"
        );
    bytes32 private eip712DomainSeparator;

    function __Signature_init(string memory _name, string memory _version)
        internal
    {
        eip712DomainSeparator = _hash(
            EIP712Domain({
                name: _name,
                version: _version,
                chainId: block.chainid,
                verifyingContract: address(this)
            })
        );
    }

    function _hash(EIP712Domain memory domain) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    EIP712DOMAIN_TYPEHASH,
                    keccak256(bytes(domain.name)),
                    keccak256(bytes(domain.version)),
                    domain.chainId,
                    domain.verifyingContract
                )
            );
    }

    function _hash(SignData memory signData) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    SIGNDATA_TYPEHASH,
                    signData.tokenId,
                    signData.quantity,
                    signData.price,
                    signData.nonce,
                    signData.token,
                    signData.saleToken,
                    signData.buyer,
                    signData.tokenType
                )
            );
    }

    function _getSigner(
        address buyer,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint256 nonce,
        address token,
        address saleToken,
        bool tokenType,
        Vrs memory vrs
    ) internal view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                eip712DomainSeparator,
                _hash(
                    SignData({
                        tokenId: tokenId,
                        quantity: quantity,
                        price: price,
                        nonce: nonce,
                        token: token,
                        saleToken: saleToken,
                        buyer: buyer,
                        tokenType: tokenType
                    })
                )
            )
        );
        return ecrecover(digest, vrs.v, vrs.r, vrs.s);
    }
}
