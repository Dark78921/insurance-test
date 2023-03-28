// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Insurance {
    using SafeERC20 for IERC20;

    uint256 public constant INSURANCE_AMOUNT = 500000 * 10 ** 18;
    address public immutable USDT_ADDRESS;
    address public immutable UNO_ADDRESS;
    uint256 constant INSURANCE_PERIOD = 7776000; // = 3 * 30 * 24 * 3600

    uint256 private _startInsuranceTime;
    uint256 private _totalDepositedAmount;
    mapping(address => mapping(uint256 => bool)) public isDeposited; 

    address payable public owner;

    event Deposit(address indexed account, uint256 indexed productId);
    event Withdraw(address indexed account, uint256 indexed productId, uint256 rewardAmount);
    event StartInsurance();

    modifier onlyOwner {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // do you think you can pass such arrays whose length is 256 in the constract?
    constructor(address _USDT_ADDRESS, address _UNO_ADDRESS) {
        owner = payable(msg.sender);
        USDT_ADDRESS = _USDT_ADDRESS;
        UNO_ADDRESS = _UNO_ADDRESS;
    }

    function deposit(uint256 _productID) external {
        require(isDeposited[msg.sender][_productID] == false, "Already deposited!");
        require(_startInsuranceTime == 0, "Insurance is already started!");
        require(_productID < 256, "Invalid product id");

        uint256 amount = 50 * (_productID + 1) * 10 ** 18;
        IERC20(USDT_ADDRESS).safeTransferFrom(msg.sender, address(this), amount);
        isDeposited[msg.sender][_productID] = true;

        _totalDepositedAmount += amount;
        if (_totalDepositedAmount >= INSURANCE_AMOUNT) {
            _startInsuranceTime = block.timestamp;
            
            emit StartInsurance();
        }

        emit Deposit(msg.sender, _productID);
    }

    function withdraw(uint256 _productId) public {
        require(isDeposited[msg.sender][_productId], "You have no any deposited amount for this product");
        require(_startInsuranceTime != 0, "Insurance is not started yet");
        require(_startInsuranceTime + INSURANCE_PERIOD <= block.timestamp, "Still insurance period");

        isDeposited[msg.sender][_productId] = false;
    
        uint256 rewardAmount = 100 * (_productId + 1) * 10 ** 18;
        uint256 contractUnoBalance = IERC20(UNO_ADDRESS).balanceOf(address(this));
        rewardAmount = rewardAmount <= contractUnoBalance ? rewardAmount : contractUnoBalance;
        
        IERC20(UNO_ADDRESS).safeTransfer(msg.sender, rewardAmount);

        uint256 depositAmount = 50 * (_productId + 1) * 10 ** 18;
        IERC20(USDT_ADDRESS).safeTransfer(msg.sender, depositAmount);
        emit Withdraw(msg.sender, _productId, rewardAmount);
    }

    function withdrawUNO(uint256 amount) external onlyOwner {
        IERC20(UNO_ADDRESS).safeTransfer(msg.sender, amount);
    }

    function getInsuranceStartedTime() external view returns (uint256) {
        return _startInsuranceTime;
    }
}
