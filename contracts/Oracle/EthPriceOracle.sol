// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/CallerContractInterface.sol";

contract EthPriceOracle is AccessControl {
    using Math for uint256;
    // Create a new role identifier for the minter role
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    uint private randNonce = 0;
    uint private modulus = 1000;
    uint private numOracles = 0;
    uint private THRESHOLD = 0;

    struct Response {
        address oracleAddress;
        address callerAddress;
        uint256 ethPrice;   
    }

    mapping(uint256=>bool) pendingRequests;
    mapping (uint256=>Response[]) public requestIdToResponse;
    
    event GetLatestEthPriceEvent(address callerAddress, uint id);
    event SetLatestEthPriceEvent(uint256 ethPrice, address callerAddress);
    event AddOracleEvent(address oracleAddress);
    event RemoveOracleEvent(address oracleAddress);
    event SetThresholdEvent (uint threshold);

    
    constructor(address _owner) {
        _grantRole(OWNER_ROLE, _owner);
    }
    
    function addOracle (address _oracle) public onlyRole(OWNER_ROLE) {
        require(!hasRole(ORACLE_ROLE, _oracle), "Already an oracle!");
        // grant oracle role for address _oracle
        require(_grantRole(ORACLE_ROLE, _oracle), "Cannot grant role");
        numOracles++;
        emit AddOracleEvent(_oracle);
    }

    function removeOracle (address _oracle) public onlyRole(OWNER_ROLE) {
        require(hasRole(ORACLE_ROLE, _oracle), "Not an oracle!");
        require(numOracles > 1, "Do not remove the last oracle!");
        
        require(_revokeRole(ORACLE_ROLE, _oracle), "Cannot revoke role. Reverting!");
        numOracles--;
        emit RemoveOracleEvent(_oracle);
    }

    function setThreshold (uint _threshold) public onlyRole(OWNER_ROLE) {
        THRESHOLD = _threshold;
        emit SetThresholdEvent(THRESHOLD);
    }

    function getLatestEthPrice() public returns(uint256) {
        randNonce++;
        uint256 id = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % modulus;
        pendingRequests[id] = true;
        emit GetLatestEthPriceEvent(msg.sender, id);
        return id;
    }

    function setLatestEthPrice(uint256 _ethPrice, address _callerAddress, uint256 _id) public onlyRole(ORACLE_ROLE) {
        require(pendingRequests[_id], "This request is not in my pending list.");

        Response memory resp = Response(msg.sender, _callerAddress, _ethPrice);
        requestIdToResponse[_id].push(resp);

         uint numResponses = requestIdToResponse[_id].length;
        if (numResponses == THRESHOLD) {
            uint computedEthPrice = 0;
            bool res = false;
            for (uint f=0; f < requestIdToResponse[_id].length; f++) {
                (res, computedEthPrice) = computedEthPrice.tryAdd(requestIdToResponse[_id][f].ethPrice);
            }
            (res, computedEthPrice) = computedEthPrice.tryDiv(numResponses);
            delete pendingRequests[_id];
            delete requestIdToResponse[_id];
            CallerContractInterface callerContractInstance;
            callerContractInstance = CallerContractInterface(_callerAddress);
            
            callerContractInstance.callback(computedEthPrice, _id);
            emit SetLatestEthPriceEvent(computedEthPrice, _callerAddress);
        } 
    }
}

// While calculating the average is not complicated, bear in mind that this method can make your contract vulnerable to attacks if a few oracles decide to manipulate the price. This is not an easy problem, and the solution is beyond the scope of this lesson. One way to solve this would be to remove the outliers by using quartiles and interquartile ranges