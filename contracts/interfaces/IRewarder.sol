// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface IRewarder {
    function onReward(address to, uint256 amount) external returns (uint256);
}