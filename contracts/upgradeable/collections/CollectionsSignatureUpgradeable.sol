// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract CollectionSignatureUpgradeable {
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct SignData {
        uint256[] tokens;
        address implementation;
        address creator;
    }

    bytes32 constant EIP712DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 constant SIGNDATA_TYPEHASH =
        keccak256(
            "SignData(uint256[] tokens, address implementation, address creator)"
        );

    bytes32 EIP712DOMAIN_SEPARATOR;

    function __CollectionSignature_init(
        string memory _name,
        string memory _version
    ) internal {
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
                    keccak256(abi.encodePacked(signData.tokens)),
                    signData.implementation,
                    signData.creator
                )
            );
    }

    function _getSigner(
        uint256[] calldata tokens,
        address implementation,
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
                        tokens: tokens,
                        implementation: implementation,
                        creator: creator
                    })
                )
            )
        );
        return ecrecover(digest, v, r, s);
    }
}
