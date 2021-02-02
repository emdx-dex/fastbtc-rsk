// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract FastSwap is Ownable, AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 maxAmount;
    uint256 minAmount;
    /*
    struct SwapInStruct {
        bytes32 source;
        address destiny;
        uint256 amount;
    }

    struct SwapOutStruct {
        address source;
        bytes32 destiny;
        uint256 amount;
    }

    mapping(bytes32 => SwapInStruct) public inputSwaps;
    mapping(bytes32 => SwapOutStruct) public outboundSwaps;
*/
    event FundDeposit(address from, uint256 amount);
    event FundWithdraw(address from, uint256 amount);
    event RBTCSwapIn(bytes32 source, address destiny, uint256 amount);
    //event RBTCSwapOut(address source, bytes32 destiny, uint256 amount);
    event RBTCSwapOut(address source, uint256 amount);

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not a operator");
        _;
    }

    constructor(
        address _operator,
        uint256 _maxAmount,
        uint256 _minAmount
    ) {
        require(_operator != address(0), "_operator is required");
        require(_maxAmount != 0, "_maxAmount is required");
        require(_minAmount != 0, "_minAmount is required");
        maxAmount = _maxAmount;
        minAmount = _minAmount;
        // Grant the operator role
        _setupRole(OPERATOR_ROLE, _operator);
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /* Swap out
     **/
    receive() external payable {
        require(
            msg.value <= maxAmount,
            "msg.value exceeds the maximum required"
        );
        require(
            msg.value >= minAmount,
            "msg.value does not reach the minimum required"
        );

        emit RBTCSwapOut(msg.sender, msg.value);
    }

    function depositFunds() external payable onlyOwner {
        emit FundDeposit(msg.sender, msg.value);
    }

    function rbtcSwapIn(
        bytes32 _source,
        address payable _destiny,
        uint256 _amount
    ) external onlyOperator {
        require(_amount <= maxAmount, "_amount exceeds the maximum required");
        require(
            _amount >= minAmount,
            "_amount does not reach the minimum required"
        );
        require(
            _amount <= address(this).balance,
            "_amount is greater than the contract fund"
        );

        _destiny.transfer(_amount);

        emit RBTCSwapIn(_source, _destiny, _amount);
    }

    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(_amount != 0, "_amount is required");
        require(
            _amount <= address(this).balance,
            "The withdrawal value is greater than the contract fund"
        );

        msg.sender.transfer(_amount);

        emit FundWithdraw(msg.sender, _amount);
    }

    function withdrawAllFunds() external onlyOwner {
        uint256 amount = address(this).balance;
        msg.sender.transfer(amount);

        emit FundWithdraw(msg.sender, amount);
    }

    function setMaxAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount != 0, "_newAmount is required");
        maxAmount = _newAmount;
    }

    function setMinAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount != 0, "_newAmount is required");
        minAmount = _newAmount;
    }
}
