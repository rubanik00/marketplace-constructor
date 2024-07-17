// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract ERC721SignatureFee {
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct SignData {
        uint256 nonce;
        uint96 fee;
        address creator;
        string uri;
    }
    bytes32 constant EIP712DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 constant SIGNDATA_TYPEHASH =
        keccak256(
            "SignData(uint256 nonce,uint96 fee,address creator,string uri)"
        );

    bytes32 EIP712DOMAIN_SEPARATOR;

    function __Signature_init(string memory _name, string memory _version)
        internal
    {
        EIP712DOMAIN_SEPARATOR = _hash(
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
                    signData.nonce,
                    signData.fee,
                    signData.creator,
                    keccak256(bytes(signData.uri))
                )
            );
    }

    function _getSigner(
        uint96 fee,
        uint256 nonce,
        string memory uri,
        address creator,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                EIP712DOMAIN_SEPARATOR,
                _hash(
                    SignData({
                        nonce: nonce,
                        fee: fee,
                        creator: creator,
                        uri: uri
                    })
                )
            )
        );
        return ecrecover(digest, v, r, s);
    }
}
