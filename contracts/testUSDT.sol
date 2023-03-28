// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract testUSDT is ERC20 {
    constructor() ERC20("testUSDT", "USDT") {}

    function mintUSDT(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    function approveFrom(address _owner, address _spender, uint256 _amount) public {
        _approve(_owner, _spender, _amount);
    }
}