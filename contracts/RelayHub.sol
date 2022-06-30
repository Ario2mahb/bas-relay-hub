// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";

import "./interfaces/IProofVerificationFunction.sol";
import "./interfaces/IRelayHub.sol";
import "./interfaces/IBridgeRegistry.sol";

import "./libraries/BitUtils.sol";
import "./libraries/MerklePatriciaProof.sol";

import "./BlockVerifierFactory.sol";

contract RelayHub is Multicall, IRelayHub, IBridgeRegistry {

    using EnumerableSet for EnumerableSet.AddressSet;
    using BitMaps for BitMaps.BitMap;

    // lets keep default verification function as zero to make it manageable by BAS relay hub itself
    IProofVerificationFunction internal constant DEFAULT_VERIFICATION_FUNCTION = IProofVerificationFunction(0x0000000000000000000000000000000000000000);

    bytes32 internal constant ZERO_BLOCK_HASH = bytes32(0x00);
    address internal constant ZERO_ADDRESS = address(0x00);

    event ChainRegistered(uint256 indexed chainId, address[] initValidatorSet);
    event ValidatorSetUpdated(uint256 indexed chainId, address[] newValidatorSet);

    struct ValidatorHistory {
        // set with all validators and their indices (never remove values)
        EnumerableSet.AddressSet allValidators;
        // mapping from epoch to the bitmap with active validators indices
        mapping(uint64 => BitMaps.BitMap) activeValidators;
        // latest published epoch
        uint64 latestKnownEpoch;
    }

    enum ChainStatus {
        NotFound,
        Verifying,
        Active
    }

    struct BAS {
        ChainStatus chainStatus;
        IProofVerificationFunction verificationFunction;
        address bridgeAddress;
        uint32 epochLength;
    }

    // default verification function for certified chains
    IProofVerificationFunction internal _defaultVerificationFunction;
    address internal _checkpointOracle;
    // mapping with all registered chains
    mapping(uint256 => ValidatorHistory) _validatorHistories;
    mapping(uint256 => BAS) internal _registeredChains;

    constructor(IProofVerificationFunction defaultVerificationFunction) {
        _defaultVerificationFunction = defaultVerificationFunction;
    }

    function getBridgeAddress(uint256 chainId) external view returns (address) {
        return _registeredChains[chainId].bridgeAddress;
    }

    function registerCertifiedBAS(
        uint256 chainId,
        bytes calldata genesisBlock,
        address bridgeAddress,
        uint32 epochLength
    ) external {
        _registerChainWithVerificationFunction(chainId, DEFAULT_VERIFICATION_FUNCTION, genesisBlock, ZERO_BLOCK_HASH, ChainStatus.Verifying, bridgeAddress, epochLength);
    }

    function registerUsingCheckpoint(
        uint256 chainId,
        bytes calldata checkpointBlock,
        bytes32 checkpointHash,
        address bridgeAddress,
        uint32 epochLength
    ) external {
        _registerChainWithVerificationFunction(chainId, DEFAULT_VERIFICATION_FUNCTION, checkpointBlock, checkpointHash, ChainStatus.Verifying, bridgeAddress, epochLength);
    }

    function registerBAS(
        uint256 chainId,
        IProofVerificationFunction verificationFunction,
        bytes calldata genesisBlock,
        address bridgeAddress,
        uint32 epochLength
    ) external {
        _registerChainWithVerificationFunction(chainId, verificationFunction, genesisBlock, ZERO_BLOCK_HASH, ChainStatus.Verifying, bridgeAddress, epochLength);
    }

    function _registerChainWithVerificationFunction(
        uint256 chainId,
        IProofVerificationFunction verificationFunction,
        bytes calldata blockProof,
        bytes32 checkpointHash,
        ChainStatus defaultStatus,
        address bridgeAddress,
        uint32 epochLength
    ) internal {
        BAS memory bas = _registeredChains[chainId];
        require(bas.chainStatus == ChainStatus.NotFound || bas.chainStatus == ChainStatus.Verifying, "already registered");
        address[] memory initialValidatorSet;
        uint64 epochNumber = 0;
        if (checkpointHash == ZERO_BLOCK_HASH) {
            initialValidatorSet = _verificationFunction(verificationFunction).verifyGenesisBlock(blockProof, chainId, epochLength);
        } else {
            (initialValidatorSet, epochNumber) = _verificationFunction(verificationFunction).verifyCheckpointBlock(blockProof, chainId, checkpointHash, epochLength);
        }
        bas.chainStatus = defaultStatus;
        bas.verificationFunction = verificationFunction;
        bas.bridgeAddress = bridgeAddress;
        bas.epochLength = epochLength;
        ValidatorHistory storage validatorHistory = _validatorHistories[chainId];
        _updateActiveValidatorSet(validatorHistory, initialValidatorSet, epochNumber);
        _registeredChains[chainId] = bas;
        emit ChainRegistered(chainId, initialValidatorSet);
    }

    function _updateActiveValidatorSet(ValidatorHistory storage validatorHistory, address[] memory validatorsList, uint64 epochNumber) internal {
        uint256[] memory buckets = new uint256[]((validatorHistory.allValidators.length() >> 8) + 1);
        // build set of buckets with new bits
        for (uint256 i = 0; i < validatorsList.length; i++) {
            // add validator to the set of all validators
            address validator = validatorsList[i];
            validatorHistory.allValidators.add(validator);
            // get index of the validator in the set (-1 because 0 is not used)
            uint256 index = validatorHistory.allValidators._inner._indexes[bytes32(uint256(uint160(validator)))] - 1;
            buckets[index >> 8] |= 1 << (index & 0xff);
        }
        // copy buckets (its cheaper to keep buckets in memory)
        BitMaps.BitMap storage currentBitmap = validatorHistory.activeValidators[epochNumber];
        for (uint256 i = 0; i < buckets.length; i++) {
            currentBitmap._data[i] = buckets[i];
        }
        // remember latest verified epoch
        validatorHistory.latestKnownEpoch = epochNumber;
    }

    function getActiveValidators(uint256 chainId) external view returns (address[] memory) {
        ValidatorHistory storage validatorHistory = _validatorHistories[chainId];
        return _extractActiveValidators(validatorHistory, validatorHistory.latestKnownEpoch);
    }

    function _extractActiveValidators(ValidatorHistory storage validatorHistory, uint64 atEpoch) internal view returns (address[] memory) {
        uint256 validatorsLength = validatorHistory.allValidators.length();
        uint256 totalBuckets = (validatorsLength >> 8) + 1;
        address[] memory activeValidators = new address[](validatorsLength);
        BitMaps.BitMap storage bitmap = validatorHistory.activeValidators[atEpoch];
        uint256 j = 0;
        for (uint256 i = 0; i < totalBuckets; i++) {
            uint256 bucket = bitmap._data[i];
            while (bucket != 0) {
                uint256 zeroes = BitUtils.ctz(bucket);
                bucket ^= (1 << zeroes);
                activeValidators[j] = address(uint160(uint256(bytes32(validatorHistory.allValidators._inner._values[(i << 8) + zeroes]))));
                j++;
            }
        }
        assembly {
            mstore(activeValidators, j)
        }
        return activeValidators;
    }

    function checkValidators(uint256 chainId, address[] memory validators, uint64 epoch) external view returns (uint64 uniqueValidators) {
        ValidatorHistory storage validatorHistory = _validatorHistories[chainId];
        BitMaps.BitMap storage activeValidators = validatorHistory.activeValidators[epoch];
        for (uint256 i = 0; i < validators.length; i++) {
            uint256 index = validatorHistory.allValidators._inner._indexes[bytes32(uint256(uint160(validators[i])))] - 1;
            require(activeValidators.get(index), "not a validator");
            uniqueValidators++;
        }
        return uniqueValidators;
    }

    function getLatestTransitionedEpoch(uint256 chainId) external view returns (uint64) {
        ValidatorHistory storage validatorHistory = _validatorHistories[chainId];
        return validatorHistory.latestKnownEpoch;
    }

    function updateValidatorSet(uint256 chainId, bytes[] calldata blockProofs) external {
        BAS memory bas = _registeredChains[chainId];
        require(bas.chainStatus == ChainStatus.Verifying || bas.chainStatus == ChainStatus.Active, "not active");
        ValidatorHistory storage validatorHistory = _validatorHistories[chainId];
        (address[] memory newValidatorSet, uint64 epochNumber) = _verificationFunction(bas.verificationFunction).verifyValidatorTransition(blockProofs, chainId, _extractActiveValidators(validatorHistory, validatorHistory.latestKnownEpoch), bas.epochLength);
        require(epochNumber == validatorHistory.latestKnownEpoch + 1, "bad epoch");
        bas.chainStatus = ChainStatus.Active;
        _updateActiveValidatorSet(validatorHistory, newValidatorSet, epochNumber);
        _registeredChains[chainId] = bas;
        emit ValidatorSetUpdated(chainId, newValidatorSet);
    }

    function checkReceiptProof(uint256 chainId, bytes[] calldata blockProofs, bytes memory rawReceipt, bytes memory path, bytes calldata siblings) external view virtual override returns (bool) {
        BAS memory bas = _registeredChains[chainId];
        require(bas.chainStatus == ChainStatus.Active, "not active");
        ValidatorHistory storage validatorHistory = _validatorHistories[chainId];
        IProofVerificationFunction.VerifiedBlock memory verifiedBlock = _verificationFunction(bas.verificationFunction).verifyBlock(blockProofs, chainId, _extractActiveValidators(validatorHistory, validatorHistory.latestKnownEpoch), bas.epochLength);
        return MerklePatriciaProof.verify(keccak256(rawReceipt), path, siblings, verifiedBlock.receiptRoot);
    }

    function _verificationFunction(IProofVerificationFunction verificationFunction) internal view returns (IProofVerificationFunction) {
        if (verificationFunction == DEFAULT_VERIFICATION_FUNCTION) {
            return _defaultVerificationFunction;
        } else {
            return verificationFunction;
        }
    }
}