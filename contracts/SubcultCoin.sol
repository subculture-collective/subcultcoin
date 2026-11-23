// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Fixed-supply token. The full supply goes to the deployer.
/// There is no owner, no mint function and no pause, so the supply cannot change.
contract SubcultCoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("SUBCULT", "SUBCULT") {
        _mint(msg.sender, initialSupply);
    }
}
