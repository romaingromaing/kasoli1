// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../node_modules/openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 * @title Kasoli‑ku‑Mukutu EscrowSafe (v3‑auto‑order)
 * @notice Three‑way payout escrow for grain trades.
 *         • **Automatic payout** executes the moment the Buyer signs (after Farmer & Transporter).
 *         • **Strict order enforcement**: Farmer → Transporter → Buyer.
 *         • **Platform fallback** (`forceFinalize`) can release funds only if
 *           all signatures exist and automatic payout somehow failed (edge‑case).
 *
 *  Payout split (in stable‑coin):
 *         • Farmer        – `farmerAmount`
 *         • Transporter   – `freightAmount`
 *         • Platform fee  – 3 % of the total locked
 */


contract EscrowSafe {
    /* -------------------------------------------------------------------------- */
    /*                                  STRUCTS                                   */
    /* -------------------------------------------------------------------------- */

    struct Deal {
        address buyer;
        address farmer;
        address transporter;
        address platform;
        uint256 farmerAmount;   // payment to farmer (18 decimals)
        uint256 freightAmount;  // payment to transporter (18 decimals)
        uint256 platformFee; // 3 % platform fee (18 decimals)
        uint256 total;          // farmer + freight + 3 % platform fee (18 decimals)
        uint8   sigMask;        // bitmask tracking signatures (0x1 buyer, 0x2 farmer, 0x4 transporter)
    }

    /* -------------------------------------------------------------------------- */
    /*                                   STATE                                    */
    /* -------------------------------------------------------------------------- */

    IERC20 public immutable token;                    // ERC‑20 stable‑coin (e.g. USDC‑e)
    mapping(bytes32 => Deal) public deals;            // key = keccak256(batchId)

    /* -------------------------------------------------------------------------- */
    /*                                CONSTRUCTOR                                 */
    /* -------------------------------------------------------------------------- */

    constructor(IERC20 _token) {
        token = _token;
    }

    /* -------------------------------------------------------------------------- */
    /*                                  ESCROW                                    */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Buyer locks funds into escrow; creates a fresh Deal struct.
     * @param id             keccak256(batchId) – unique per grain batch.
     * @param farmer         Farmer address (receives `farmerAmount`).
     * @param transporter    Transporter address (receives `freightAmount`).
     * @param platform       Neutral platform/operator address.
     * @param farmerAmount   Payment to farmer (18 decimals).
     * @param freightAmount  Payment to transporter (18 decimals).
     * @param total          Sum paid into escrow (farmer + freight + 3 % fee).
     */
    function lock(
        bytes32 id,
        address farmer,
        address transporter,
        address platform,
        uint256 farmerAmount,
        uint256 freightAmount,
        uint256 platformFee,
        uint256 total
    ) external {
        require(deals[id].total == 0, "deal exists");
        require(total == farmerAmount + freightAmount + platformFee, "bad total");

        // Transfer tokens from Buyer to this contract
        token.transferFrom(msg.sender, address(this), total);

        deals[id] = Deal({
            buyer: msg.sender,
            farmer: farmer,
            transporter: transporter,
            platform: platform,
            farmerAmount: farmerAmount,
            freightAmount: freightAmount,
            platformFee: platformFee,
            total: total,
            sigMask: 0
        });
    }

    /* --------------------------- Signature functions -------------------------- */

    /// @notice Farmer signs at warehouse (step 1)
    function farmerSign(bytes32 id) external {
        Deal storage d = deals[id];
        require(msg.sender == d.farmer, "!farmer");
        _setBit(d, 0x2); // farmer bit
    }

    /// @notice Transporter signs on pick‑up (step 2); farmer must have signed.
    function transporterSign(bytes32 id) external {
        Deal storage d = deals[id];
        require(msg.sender == d.transporter, "!transporter");
        require(_hasBit(d.sigMask, 0x2), "farmer first");
        _setBit(d, 0x4); // transporter bit
    }

    /// @notice Buyer signs on delivery (step 3); triggers auto‑payout.
    function buyerSign(bytes32 id) external {
        Deal storage d = deals[id];
        require(msg.sender == d.buyer, "!buyer");
        require(_hasBit(d.sigMask, 0x2 | 0x4), "not in transit");
        _setBit(d, 0x1); // buyer bit
        if (_hasBit(d.sigMask, 0x7)) {
            _payout(id);
        }
    }

    /**
     * @notice Platform override – executes payout if automatic step failed
     *         or after dispute resolution (all sigs must exist).
     */
    function forceFinalize(bytes32 id) external {
        Deal storage d = deals[id];
        require(msg.sender == d.platform, "!platform");
        require(d.total > 0, "already paid");
        require(_hasBit(d.sigMask, 0x7), "missing sigs");
        _payout(id);
    }

    /* -------------------------------------------------------------------------- */
    /*                                INTERNALS                                   */
    /* -------------------------------------------------------------------------- */

    function _setBit(Deal storage d, uint8 bit) internal {
        d.sigMask |= bit;
    }

    function _hasBit(uint8 mask, uint8 bits) internal pure returns (bool) {
        return (mask & bits) == bits;
    }

    function _payout(bytes32 id) internal {
        Deal storage d = deals[id];
        uint256 total = d.total;
        require(total > 0, "paid");
        d.total = 0; // re‑entrancy guard

        uint256 platformFee   = d.platformFee;          // 3 % fee
        uint256 farmerTake    = d.farmerAmount;
        uint256 transportTake = d.freightAmount;

        // sanity check (handles rounding)
        require(farmerTake + transportTake + platformFee <= total, "math error");

        token.transfer(d.farmer, farmerTake);
        token.transfer(d.transporter, transportTake);
        token.transfer(d.platform, platformFee);
    }
}
