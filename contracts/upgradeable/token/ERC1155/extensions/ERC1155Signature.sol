// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract ERC1155Signature {
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct SignData {
        uint256 supply;
        uint256 nonce;
        string uri;
        address creator;
    }

    struct SignDataWithFee {
        uint256 supply;
        uint256 nonce;
        uint96 fee;
        string uri;
        address creator;
    }

    bytes32 constant EIP712DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 constant SIGNDATA_TYPEHASH =
        keccak256(
            "SignData(uint256 supply,uint256 nonce,string uri,address creator)"
        );

    bytes32 constant SIGNDATAWITHFEE_TYPEHASH =
        keccak256(
            "SignDataWithFee(uint256 supply,uint256 nonce,uint96 fee,string uri,address creator)"
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
                    signData.supply,
                    signData.nonce,
                    keccak256(bytes(signData.uri)),
                    signData.creator
                )
            );
    }

    function _hash(SignDataWithFee memory signData)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    SIGNDATAWITHFEE_TYPEHASH,
                    signData.supply,
                    signData.nonce,
                    signData.fee,
                    keccak256(bytes(signData.uri)),
                    signData.creator
                )
            );
    }

    function _getSigner(
        uint256 supply,
        uint256 nonce,
        address creator,
        string memory uri,
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
                        supply: supply,
                        nonce: nonce,
                        uri: uri,
                        creator: creator
                    })
                )
            )
        );
        return ecrecover(digest, v, r, s);
    }

    function _getSigner(
        uint256 supply,
        uint96 fee,
        uint256 nonce,
        address creator,
        string memory uri,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                EIP712DOMAIN_SEPARATOR,
                _hash(
                    SignDataWithFee({
                        supply: supply,
                        nonce: nonce,
                        fee: fee,
                        uri: uri,
                        creator: creator
                    })
                )
            )
        );
        return ecrecover(digest, v, r, s);
    }
}
