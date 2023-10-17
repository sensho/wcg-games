/*
This is the official contract of the WifeChangingGame token. This token
is the first of its kind to implement an innovative jackpot mechanism.

Every buy and sell will feed the jackpot (2%/5%). If for 10 mins, no buys are
recorded, the last buyer will receive a portion of the jackpot. This will drive
a consistent buy pressure.

The jackpot has a hard limit ($100K) that, if reached, will trigger the big bang event. A portion
of the jackpot will be cashed out to the buyback wallet. The buyback wallet will
then either burn the tokens or dedicate a portion of it towards staking.

Website: https://www.wcg.com
Twitter: https://twitter.com/the_las_bsc
*/

// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./Ownable.sol";
import "hardhat/console.sol";

contract WifeChangingGame is Context, IERC20, Ownable {
    using Address for address;
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(address => uint256) private _tOwned;
    mapping(address => mapping(address => uint256)) private _allowances;

    EnumerableSet.AddressSet private _isExcludedFromFee;
    EnumerableSet.AddressSet private _isExcludedFromSwapAndLiquify;

    // 100%
    uint256 private constant MAX_PCT = 10000;
    uint256 private constant ETH_DECIMALS = 18;
    uint256 private constant USDT_DECIMALS = 18;
    address private constant USDT = 0x3B00Ef435fA4FcFF5C209a37d1f3dcff37c705aD;
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // At any given time, buy and sell fees can NOT exceed 25% each
    uint256 private constant TOTAL_FEES_LIMIT = 2500;
    // We don't add to liquidity unless we have at least 1 WCG token
    uint256 private constant LIQ_SWAP_THRESH = 10**decimals;

    // PCS takes 0.25% fee on all txs
    uint256 private constant ROUTER_FEE = 25;

    // Jackpot hard limits
    uint256 private constant JACKPOT_TIMESPAN_LIMIT_MIN = 30;
    uint256 private constant JACKPOT_TIMESPAN_LIMIT_MAX = 1200;

    uint256 private constant JACKPOT_BIGBANG_MIN = 30000 * 10**USDT_DECIMALS;
    uint256 private constant JACKPOT_BIGBANG_MAX = 250000 * 10**USDT_DECIMALS;

    uint256 private constant JACKPOT_BUYER_SHARE_MIN = 5000;
    uint256 private constant JACKPOT_BUYER_SHARE_MAX = 10000;

    uint256 private constant JACKPOT_MINBUY_MIN = 5 * 10**(ETH_DECIMALS - 2);
    uint256 private constant JACKPOT_MINBUY_MAX = 5 * 10**(ETH_DECIMALS - 1);

    uint256 private constant JACKPOT_CASHOUT_MIN = 4000;
    uint256 private constant JACKPOT_CASHOUT_MAX = 7000;

    uint256 private constant JACKPOT_BIGBANG_BUYBACK_MIN = 3000;
    uint256 private constant JACKPOT_BIGBANG_BUYBACK_MAX = 7000;

    string public constant name = "WifeChangingGame";
    string public constant symbol = "WCG";
    uint8 public constant decimals = 18;
    uint256 public totalSupply = 10000000 * 10**decimals;

    // Max wallet size initially set to 1%
    uint256 public maxWalletSize = totalSupply / 100;

    // Buy fees
    // 1% liquidity
    uint256 private _bLiquidityFee = 100;
    // 2% marketing
    uint256 private _bMarketingFee = 200;
    // 2% dev
    uint256 private _bDevFee = 200;
    // 2% jackpot
    uint256 private _bJackpotFee = 200;

    // Sell fees
    // 1% liquidity
    uint256 private _sLiquidityFee = 100;
    // 5% marketing
    uint256 private _sMarketingFee = 500;
    // 2% dev
    uint256 private _sDevFee = 200;
    // 5% jackpot
    uint256 private _sJackpotFee = 500;

    // Fee variables for cross-method usage
    uint256 private _liquidityFee = 0;
    uint256 private _marketingFee = 0;
    uint256 private _devFee = 0;
    uint256 private _jackpotFee = 0;

    // Token distribution held by the contract
    uint256 private _liquidityTokens = 0;
    uint256 private _marketingTokens = 0;
    uint256 private _devTokens = 0;
    uint256 private _jackpotTokens = 0;

    // Jackpot related variables
    // 55.55% jackpot cashout to last buyer
    uint256 public jackpotCashout = 5555;
    // 90% of jackpot cashout to last buyer
    uint256 public jackpotBuyerShare = 9000;
    // Buys > 0.1 ETH will be eligible for the jackpot
    uint256 public jackpotMinBuy = 1 * 10**(ETH_DECIMALS - 1);
    // Jackpot time span is initially set to 10 mins
    uint256 public jackpotTimespan = 10 * 60;
    // Jackpot hard limit, ETH value
    uint256 public jackpotHardLimit = 250 * 10**(ETH_DECIMALS);
    // Jackpot hard limit buyback share
    uint256 public jackpotHardBuyback = 5000;

    address payable private _lastBuyer = payable(address(this));
    uint256 private _lastBuyTimestamp = 0;

    address private _lastAwarded = address(0);
    uint256 private _lastAwardedCash = 0;
    uint256 private _lastAwardedTokens = 0;
    uint256 private _lastAwardedTimestamp = 0;

    uint256 private _lastBigBangCash = 0;
    uint256 private _lastBigBangTokens = 0;
    uint256 private _lastBigBangTimestamp = 0;

    // The minimum transaction limit that can be set is 0.1% of the total supply
    uint256 private constant MIN_TX_LIMIT = 10;
    // Initially, max TX amount is set to the total supply
    uint256 public maxTxAmount = totalSupply;

    uint256 public numTokensSellToAddToLiquidity = 2000 * 10**decimals;

    // Pending balances (ETH) ready to be collected
    uint256 private _pendingMarketingBalance = 0;
    uint256 private _pendingDevBalance = 0;
    uint256 private _pendingJackpotBalance = 0;

    // Total ETH/WCG collected by various mechanisms (dev, marketing, jackpot)
    uint256 private _totalMarketingFeesCollected = 0;
    uint256 private _totalDevFeesCollected = 0;
    uint256 private _totalJackpotCashedOut = 0;
    uint256 private _totalJackpotTokensOut = 0;
    uint256 private _totalJackpotBuyer = 0;
    uint256 private _totalJackpotBuyback = 0;
    uint256 private _totalJackpotBuyerTokens = 0;
    uint256 private _totalJackpotBuybackTokens = 0;

    bool public tradingOpen = false;
    // Liquidity
    bool public swapAndLiquifyEnabled = true;
    bool private _inSwapAndLiquify;

    IUniswapV2Router02 public uniswapV2Router;
    address public uniswapV2Pair;

    event SwapAndLiquifyEnabledUpdated(bool enabled);
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiquidity
    );
    event DevFeesCollected(uint256 ethCollected);
    event MarketingFeesCollected(uint256 ethCollected);
    event JackpotAwarded(
        uint256 cashedOut,
        uint256 tokensOut,
        uint256 buyerShare,
        uint256 tokensToBuyer,
        uint256 toBuyback,
        uint256 tokensToBuyback
    );
    event BigBang(uint256 cashedOut, uint256 tokensOut);

    event BuyFeesChanged(
        uint256 liquidityFee,
        uint256 marketingFee,
        uint256 devFee,
        uint256 jackpotFee
    );

    event SellFeesChanged(
        uint256 liquidityFee,
        uint256 marketingFee,
        uint256 devFee,
        uint256 jackpotFee
    );

    event JackpotFeaturesChanged(
        uint256 jackpotCashout,
        uint256 jackpotBuyerShare,
        uint256 jackpotMinBuy
    );

    event JackpotTimespanChanged(uint256 jackpotTimespan);

    event MaxTransferAmountChanged(uint256 maxTxAmount);

    event MaxWalletSizeChanged(uint256 maxWalletSize);

    event TokenToSellOnSwapChanged(uint256 numTokens);

    event BigBangFeaturesChanged(
        uint256 jackpotHardBuyback,
        uint256 jackpotHardLimit
    );

    modifier lockTheSwap() {
        _inSwapAndLiquify = true;
        _;
        _inSwapAndLiquify = false;
    }

    constructor(address cOwner) Ownable(cOwner) {
        _tOwned[cOwner] = totalSupply;

        uniswapV2Router = IUniswapV2Router02(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
        );

        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).createPair(
                address(this),
                uniswapV2Router.WETH()
            );

        // Exclude system addresses from fee
        _isExcludedFromFee.add(owner);
        _isExcludedFromFee.add(address(this));

        _isExcludedFromSwapAndLiquify.add(uniswapV2Pair);

        emit Transfer(address(0), cOwner, totalSupply);
    }

    receive() external payable {}

    function balanceOf(address account) public view override returns (uint256) {
        return _tOwned[account];
    }

    function transfer(address recipient, uint256 amount)
        public
        override
        returns (bool)
    {
        transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender)
        public
        view
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount)
        public
        override
        returns (bool)
    {
        approve(_msgSender(), spender, amount);
        return true;
    }

    function approve(
        address owner,
        address spender,
        uint256 amount
    ) private {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        require(
            _allowances[sender][_msgSender()] >= amount,
            "ERC20: transfer amount exceeds allowance"
        );
        transfer(sender, recipient, amount);
        approve(
            sender,
            _msgSender(),
            _allowances[sender][_msgSender()] - amount
        );
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        virtual
        returns (bool)
    {
        approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender] + addedValue
        );
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        virtual
        returns (bool)
    {
        require(
            _allowances[_msgSender()][spender] >= subtractedValue,
            "ERC20: decreased allowance below zero"
        );
        approve(
            _msgSender(),
            spender,
            _allowances[_msgSender()][spender] - subtractedValue
        );
        return true;
    }

    function totalMarketingFeesCollected()
        external
        view
        onlyMarketing
        returns (uint256)
    {
        return _totalMarketingFeesCollected;
    }

    function totalDevFeesCollected() external view onlyDev returns (uint256) {
        return _totalDevFeesCollected;
    }

    function totalJackpotOut() external view returns (uint256, uint256) {
        return (_totalJackpotCashedOut, _totalJackpotTokensOut);
    }

    function totalJackpotBuyer() external view returns (uint256, uint256) {
        return (_totalJackpotBuyer, _totalJackpotBuyerTokens);
    }

    function totalJackpotBuyback() external view returns (uint256, uint256) {
        return (_totalJackpotBuyback, _totalJackpotBuybackTokens);
    }

    function excludeFromFee(address account) public onlyAuthorized {
        _isExcludedFromFee.add(account);
    }

    function includeInFee(address account) public onlyAuthorized {
        _isExcludedFromFee.remove(account);
    }

    function setBuyFees(
        uint256 liquidityFee,
        uint256 marketingFee,
        uint256 devFee,
        uint256 jackpotFee
    ) external onlyAuthorized {
        require(
            liquidityFee + marketingFee + devFee + jackpotFee <=
                TOTAL_FEES_LIMIT,
            "Total fees can not exceed the declared limit"
        );

        _bLiquidityFee = liquidityFee;
        _bMarketingFee = marketingFee;
        _bDevFee = devFee;
        _bJackpotFee = jackpotFee;

        emit BuyFeesChanged(
            _bLiquidityFee,
            _bMarketingFee,
            _bDevFee,
            _bJackpotFee
        );
    }

    function getBuyTax() public view returns (uint256) {
        return _bLiquidityFee + _bMarketingFee + _bDevFee + _bJackpotFee;
    }

    function setSellFees(
        uint256 liquidityFee,
        uint256 marketingFee,
        uint256 devFee,
        uint256 jackpotFee
    ) external onlyAuthorized {
        require(
            liquidityFee + marketingFee + devFee + jackpotFee <=
                TOTAL_FEES_LIMIT,
            "Total fees can not exceed the declared limit"
        );
        _sLiquidityFee = liquidityFee;
        _sMarketingFee = marketingFee;
        _sDevFee = devFee;
        _sJackpotFee = jackpotFee;

        emit SellFeesChanged(
            _sLiquidityFee,
            _sMarketingFee,
            _sDevFee,
            _sJackpotFee
        );
    }

    function getSellTax() public view returns (uint256) {
        return _sLiquidityFee + _sMarketingFee + _sDevFee + _sJackpotFee;
    }

    function setJackpotFeatures(
        uint256 _jackpotCashout,
        uint256 _jackpotBuyerShare,
        uint256 _jackpotMinBuy
    ) external onlyAuthorized {
        require(
            _jackpotCashout >= JACKPOT_CASHOUT_MIN &&
                _jackpotCashout <= JACKPOT_CASHOUT_MAX,
            "Jackpot cashout percentage needs to be between 40% and 70%"
        );
        require(
            _jackpotBuyerShare >= JACKPOT_BUYER_SHARE_MIN &&
                _jackpotBuyerShare <= JACKPOT_BUYER_SHARE_MAX,
            "Jackpot buyer share percentage needs to be between 50% and 100%"
        );
        require(
            _jackpotMinBuy >= JACKPOT_MINBUY_MIN &&
                _jackpotMinBuy <= JACKPOT_MINBUY_MAX,
            "Jackpot min buy needs to be between 0.05 and 0.5 ETH"
        );
        jackpotCashout = _jackpotCashout;
        jackpotBuyerShare = _jackpotBuyerShare;
        jackpotMinBuy = _jackpotMinBuy;

        emit JackpotFeaturesChanged(
            jackpotCashout,
            jackpotBuyerShare,
            jackpotMinBuy
        );
    }

    function setJackpotHardFeatures(
        uint256 _jackpotHardBuyback,
        uint256 _jackpotHardLimit
    ) external onlyAuthorized {
        require(
            _jackpotHardBuyback >= JACKPOT_BIGBANG_BUYBACK_MIN &&
                _jackpotHardBuyback <= JACKPOT_BIGBANG_BUYBACK_MAX,
            "Jackpot hard buyback percentage needs to be between 30% and 70%"
        );
        jackpotHardBuyback = _jackpotHardBuyback;

        uint256 hardLimitUsd = usdEquivalent(_jackpotHardLimit);
        require(
            hardLimitUsd >= JACKPOT_BIGBANG_MIN &&
                hardLimitUsd <= JACKPOT_BIGBANG_MAX,
            "Jackpot hard value limit for the big bang needs to be between 30K and 250K USD"
        );
        jackpotHardLimit = _jackpotHardLimit;

        emit BigBangFeaturesChanged(jackpotHardBuyback, jackpotHardLimit);
    }

    function setJackpotTimespanInSeconds(uint256 _jackpotTimespan)
        external
        onlyAuthorized
    {
        require(
            _jackpotTimespan >= JACKPOT_TIMESPAN_LIMIT_MIN &&
                _jackpotTimespan <= JACKPOT_TIMESPAN_LIMIT_MAX,
            "Jackpot timespan needs to be between 30 and 1200 seconds (20 minutes)"
        );
        jackpotTimespan = _jackpotTimespan;

        emit JackpotTimespanChanged(jackpotTimespan);
    }

    function setMaxTxAmount(uint256 txAmount) external onlyAuthorized {
        require(
            txAmount >= (totalSupply * MIN_TX_LIMIT) / MAX_PCT,
            "Maximum transaction limit can't be less than 0.1% of the total supply"
        );
        maxTxAmount = txAmount;

        emit MaxTransferAmountChanged(maxTxAmount);
    }

    function setMaxWallet(uint256 amount) external onlyAuthorized {
        require(
            amount >= totalSupply / 1000,
            "Max wallet size must be at least 0.1% of the total supply"
        );
        maxWalletSize = amount;

        emit MaxWalletSizeChanged(maxWalletSize);
    }

    function setNumTokensSellToAddToLiquidity(uint256 numTokens)
        external
        onlyAuthorized
    {
        numTokensSellToAddToLiquidity = numTokens;

        emit TokenToSellOnSwapChanged(numTokensSellToAddToLiquidity);
    }

    function isJackpotEligible(uint256 tokenAmount) public view returns (bool) {
        if (jackpotMinBuy == 0) {
            return true;
        }
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = address(this);

        uint256 tokensOut = (uniswapV2Router.getAmountsOut(jackpotMinBuy, path)[
            1
        ] * (MAX_PCT - ROUTER_FEE)) / MAX_PCT;

        return tokenAmount >= tokensOut;
    }

    function usdEquivalent(uint256 ethAmount) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = USDT;

        return uniswapV2Router.getAmountsOut(ethAmount, path)[1];
    }

    function getUsedTokens(
        uint256 accSum,
        uint256 tokenAmount,
        uint256 tokens
    ) private pure returns (uint256, uint256) {
        if (accSum >= tokenAmount) {
            return (0, accSum);
        }
        uint256 available = tokenAmount - accSum;
        if (tokens <= available) {
            return (tokens, accSum + tokens);
        }
        return (available, accSum + available);
    }

    function getTokenShares(uint256 tokenAmount)
        private
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 accSum = 0;
        uint256 liquidityTokens = 0;
        uint256 marketingTokens = 0;
        uint256 devTokens = 0;
        uint256 jackpotTokens = 0;

        // Either 0 or 1+ WCG to prevent PCS errors on liq swap
        if (_liquidityTokens >= LIQ_SWAP_THRESH) {
            (liquidityTokens, accSum) = getUsedTokens(
                accSum,
                tokenAmount,
                _liquidityTokens
            );
            _liquidityTokens = _liquidityTokens - liquidityTokens;
        }

        (marketingTokens, accSum) = getUsedTokens(
            accSum,
            tokenAmount,
            _marketingTokens
        );
        _marketingTokens = _marketingTokens - marketingTokens;

        (devTokens, accSum) = getUsedTokens(accSum, tokenAmount, _devTokens);
        _devTokens = _devTokens - devTokens;

        (jackpotTokens, accSum) = getUsedTokens(
            accSum,
            tokenAmount,
            _jackpotTokens
        );
        _jackpotTokens = _jackpotTokens - jackpotTokens;

        return (liquidityTokens, marketingTokens, devTokens, jackpotTokens);
    }

    function setSwapAndLiquifyEnabled(bool enabled) public onlyOwner {
        swapAndLiquifyEnabled = enabled;
        emit SwapAndLiquifyEnabledUpdated(enabled);
    }

    function isExcludedFromFee(address account) public view returns (bool) {
        return _isExcludedFromFee.contains(account);
    }

    function isExcludedFromSwapAndLiquify(address account)
        public
        view
        returns (bool)
    {
        return _isExcludedFromSwapAndLiquify.contains(account);
    }

    function includeFromSwapAndLiquify(address account) external onlyOwner {
        _isExcludedFromSwapAndLiquify.remove(account);
    }

    function excludeFromSwapAndLiquify(address account) external onlyOwner {
        _isExcludedFromSwapAndLiquify.add(account);
    }

    function setUniswapRouter(address otherRouterAddress) external onlyOwner {
        uniswapV2Router = IUniswapV2Router02(otherRouterAddress);
    }

    function setUniswapPair(address otherPairAddress) external onlyOwner {
        require(
            otherPairAddress != address(0),
            "You must supply a non-zero address"
        );
        uniswapV2Pair = otherPairAddress;
    }

    function transfer(
        address from,
        address to,
        uint256 amount
    ) private {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(to != devWallet, "Dev wallet address cannot receive tokens");
        require(from != devWallet, "Dev wallet address cannot send tokens");
        require(amount > 0, "Transfer amount must be greater than zero");

        if (from != owner && to != owner) {
            require(
                amount <= maxTxAmount,
                "Transfer amount exceeds the maxTxAmount"
            );
        }

        if (!authorizations[from] && !authorizations[to]) {
            require(tradingOpen, "Trading is currently not open");
        }

        // Jackpot mechanism locks the swap if triggered. We should handle it as
        // soon as possible so that we could award the jackpot on a sell and on a buy
        if (!_inSwapAndLiquify && _pendingJackpotBalance >= jackpotHardLimit) {
            processBigBang();
        } else if (
            // We can't award the jackpot in swap and liquify
            // Pending balances need to be untouched (externally) for swaps
            !_inSwapAndLiquify &&
            _lastBuyer != address(0) &&
            _lastBuyer != address(this) &&
            block.timestamp - _lastBuyTimestamp >= jackpotTimespan
        ) {
            awardJackpot();
        }

        uint256 contractTokenBalance = balanceOf(address(this));

        if (contractTokenBalance >= maxTxAmount) {
            contractTokenBalance = maxTxAmount;
        }

        bool isOverMinTokenBalance = contractTokenBalance >=
            numTokensSellToAddToLiquidity;
        if (
            isOverMinTokenBalance &&
            !_inSwapAndLiquify &&
            !_isExcludedFromSwapAndLiquify.contains(from) &&
            swapAndLiquifyEnabled
        ) {
            swapAndLiquify(numTokensSellToAddToLiquidity);
        }

        bool takeFee = true;
        if (
            _isExcludedFromFee.contains(from) ||
            _isExcludedFromFee.contains(to) ||
            (uniswapV2Pair != from && uniswapV2Pair != to)
        ) {
            takeFee = false;
        }

        tokenTransfer(from, to, amount, takeFee);
    }

    function enableTrading() public onlyOwner {
        // Trading can only be enabled, so it can never be turned off
        tradingOpen = true;
    }

    function collectMarketingFees() public onlyMarketing {
        _totalMarketingFeesCollected =
            _totalMarketingFeesCollected +
            _pendingMarketingBalance;
        marketingWallet.transfer(_pendingMarketingBalance);
        emit MarketingFeesCollected(_pendingMarketingBalance);
        _pendingMarketingBalance = 0;
    }

    function collectDevFees() public onlyDev {
        _totalDevFeesCollected = _totalDevFeesCollected + _pendingDevBalance;
        devWallet.transfer(_pendingDevBalance);
        emit DevFeesCollected(_pendingDevBalance);
        _pendingDevBalance = 0;
    }

    function getJackpot() public view returns (uint256, uint256) {
        return (_pendingJackpotBalance, _jackpotTokens);
    }

    function jackpotBuyerShareAmount() public view returns (uint256, uint256) {
        uint256 eth = (((_pendingJackpotBalance * jackpotCashout) / MAX_PCT) *
            jackpotBuyerShare) / MAX_PCT;
        uint256 tokens = (((_jackpotTokens * jackpotCashout) / MAX_PCT) *
            jackpotBuyerShare) / MAX_PCT;
        return (eth, tokens);
    }

    function jackpotBuybackAmount() public view returns (uint256, uint256) {
        uint256 eth = (((_pendingJackpotBalance * jackpotCashout) / MAX_PCT) *
            (MAX_PCT - jackpotBuyerShare)) / MAX_PCT;
        uint256 tokens = (((_jackpotTokens * jackpotCashout) / MAX_PCT) *
            (MAX_PCT - jackpotBuyerShare)) / MAX_PCT;

        return (eth, tokens);
    }

    function getLastBuy() public view returns (address, uint256) {
        return (_lastBuyer, _lastBuyTimestamp);
    }

    function getLastAwarded()
        public
        view
        returns (
            address,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            _lastAwarded,
            _lastAwardedCash,
            _lastAwardedTokens,
            _lastAwardedTimestamp
        );
    }

    function getLastBigBang()
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (_lastBigBangCash, _lastBigBangTokens, _lastBigBangTimestamp);
    }

    function getPendingBalances()
        public
        view
        onlyAuthorized
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (
            _pendingMarketingBalance,
            _pendingDevBalance,
            _pendingJackpotBalance
        );
    }

    function getPendingTokens()
        public
        view
        onlyAuthorized
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (_liquidityTokens, _marketingTokens, _devTokens, _jackpotTokens);
    }

    function processBigBang() private lockTheSwap {
        uint256 cashedOut = (_pendingJackpotBalance * jackpotHardBuyback) /
            MAX_PCT;
        uint256 tokensOut = (_jackpotTokens * jackpotHardBuyback) / (MAX_PCT);

        buybackWallet.transfer(cashedOut);
        transferBasic(address(this), buybackWallet, tokensOut);
        emit BigBang(cashedOut, tokensOut);

        _lastBigBangCash = cashedOut;
        _lastBigBangTokens = tokensOut;
        _lastBigBangTimestamp = block.timestamp;

        _pendingJackpotBalance = _pendingJackpotBalance - cashedOut;
        _jackpotTokens = _jackpotTokens - tokensOut;

        _totalJackpotCashedOut = _totalJackpotCashedOut + cashedOut;
        _totalJackpotBuyback = _totalJackpotBuyback + cashedOut;
        _totalJackpotTokensOut = _totalJackpotTokensOut + tokensOut;
        _totalJackpotBuybackTokens = _totalJackpotBuybackTokens + tokensOut;
    }

    function awardJackpot() private lockTheSwap {
        require(
            _lastBuyer != address(0) && _lastBuyer != address(this),
            "No last buyer detected"
        );
        uint256 cashedOut = (_pendingJackpotBalance * jackpotCashout) / MAX_PCT;
        uint256 tokensOut = (_jackpotTokens * jackpotCashout) / MAX_PCT;
        uint256 buyerShare = (cashedOut * jackpotBuyerShare) / MAX_PCT;
        uint256 tokensToBuyer = (tokensOut * jackpotBuyerShare) / MAX_PCT;
        uint256 toBuyback = cashedOut - buyerShare;
        uint256 tokensToBuyback = tokensOut - tokensToBuyer;
        _lastBuyer.transfer(buyerShare);
        transferBasic(address(this), _lastBuyer, tokensToBuyer);
        buybackWallet.transfer(toBuyback);
        transferBasic(address(this), buybackWallet, tokensToBuyback);

        _pendingJackpotBalance = _pendingJackpotBalance - cashedOut;
        _jackpotTokens = _jackpotTokens - tokensOut;

        emit JackpotAwarded(
            cashedOut,
            tokensOut,
            buyerShare,
            tokensToBuyer,
            toBuyback,
            tokensToBuyback
        );

        _lastAwarded = _lastBuyer;
        _lastAwardedTimestamp = block.timestamp;
        _lastAwardedCash = buyerShare;
        _lastAwardedTokens = tokensToBuyer;

        _lastBuyer = payable(address(this));
        _lastBuyTimestamp = 0;

        _totalJackpotCashedOut = _totalJackpotCashedOut + cashedOut;
        _totalJackpotTokensOut = _totalJackpotTokensOut + tokensOut;
        _totalJackpotBuyer = _totalJackpotBuyer + buyerShare;
        _totalJackpotBuyerTokens = _totalJackpotBuyerTokens + tokensToBuyer;
        _totalJackpotBuyback = _totalJackpotBuyback + toBuyback;
        _totalJackpotBuybackTokens =
            _totalJackpotBuybackTokens +
            tokensToBuyback;
    }

    function swapAndLiquify(uint256 tokenAmount) private lockTheSwap {
        (
            uint256 liqTokens,
            uint256 marketingTokens,
            uint256 devTokens,
            uint256 jackpotTokens
        ) = getTokenShares(tokenAmount);
        uint256 toBeSwapped = liqTokens +
            marketingTokens +
            devTokens +
            jackpotTokens;

        // This variable holds the liquidity tokens that won't be converted
        uint256 pureLiqTokens = liqTokens / 2;

        // Everything else from the tokens should be converted
        uint256 tokensForEthExchange = toBeSwapped - pureLiqTokens;

        uint256 initialBalance = address(this).balance;
        swapTokensForEth(tokensForEthExchange);

        // How many ETHs did we gain after this conversion?
        uint256 gainedEth = address(this).balance - initialBalance;

        // Calculate the amount of ETH that's assigned to the marketing wallet
        uint256 balanceToMarketing = (gainedEth * marketingTokens) /
            tokensForEthExchange;
        _pendingMarketingBalance += balanceToMarketing;

        // Same for dev
        uint256 balanceToDev = (gainedEth * devTokens) / tokensForEthExchange;
        _pendingDevBalance += balanceToDev;

        // Same for Jackpot
        uint256 balanceToJackpot = (gainedEth * jackpotTokens) /
            tokensForEthExchange;
        _pendingJackpotBalance += balanceToJackpot;

        uint256 remainingEth = gainedEth -
            balanceToMarketing -
            balanceToDev -
            balanceToJackpot;

        if (liqTokens >= LIQ_SWAP_THRESH) {
            // The leftover ETHs are purely for liquidity here
            // We are not guaranteed to have all the pure liq tokens to be transferred to the pair
            // This is because the uniswap router, PCS in this case, will make a quote based
            // on the current reserves of the pair, so one of the parameters will be fully
            // consumed, but the other will have leftovers.
            uint256 prevBalance = balanceOf(address(this));
            uint256 prevEthBalance = address(this).balance;
            addLiquidity(pureLiqTokens, remainingEth);
            uint256 usedEths = prevEthBalance - address(this).balance;
            uint256 usedTokens = prevBalance - balanceOf(address(this));
            // Reallocate the tokens that weren't used back to the internal liquidity tokens tracker
            if (usedTokens < pureLiqTokens) {
                _liquidityTokens += pureLiqTokens - usedTokens;
            }
            // Reallocate the unused ETHs to the pending marketing wallet balance
            if (usedEths < remainingEth) {
                _pendingMarketingBalance += remainingEth - usedEths;
            }

            emit SwapAndLiquify(tokensForEthExchange, usedEths, usedTokens);
        } else {
            // We could have some dust, so we'll just add it to the pending marketing wallet balance
            _pendingMarketingBalance += remainingEth;

            emit SwapAndLiquify(tokensForEthExchange, 0, 0);
        }
    }

    function swapTokensForEth(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();

        approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        // Approve token transfer to cover all possible scenarios
        approve(address(this), address(uniswapV2Router), tokenAmount);

        // Add the liquidity
        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0, // slippage is unavoidable
            0, // slippage is unavoidable
            lockedLiquidity,
            block.timestamp
        );
    }

    function tokenTransfer(
        address sender,
        address recipient,
        uint256 amount,
        bool takeFee
    ) private {
        if (!takeFee) {
            // If we're here, it means either the sender or recipient is excluded from taxes
            // Also, it could be that this is just a transfer of tokens between wallets
            _liquidityFee = 0;
            _marketingFee = 0;
            _devFee = 0;
            _jackpotFee = 0;
        } else if (recipient == uniswapV2Pair) {
            // This is a sell
            _liquidityFee = _sLiquidityFee;
            _marketingFee = _sMarketingFee;
            _devFee = _sDevFee;
            _jackpotFee = _sJackpotFee;
        } else {
            // If we're here, it must mean that the sender is the uniswap pair
            // This is a buy
            if (isJackpotEligible(amount)) {
                _lastBuyTimestamp = block.timestamp;
                _lastBuyer = payable(recipient);
            }

            _liquidityFee = _bLiquidityFee;
            _marketingFee = _bMarketingFee;
            _devFee = _bDevFee;
            _jackpotFee = _bJackpotFee;
        }

        transferStandard(sender, recipient, amount);
    }

    function transferBasic(
        address sender,
        address recipient,
        uint256 amount
    ) private {
        _tOwned[sender] = _tOwned[sender] - amount;
        _tOwned[recipient] = _tOwned[recipient] + amount;

        emit Transfer(sender, recipient, amount);
    }

    function transferStandard(
        address sender,
        address recipient,
        uint256 tAmount
    ) private {
        (
            uint256 tTransferAmount,
            uint256 tLiquidity,
            uint256 tMarketing,
            uint256 tDev,
            uint256 tJackpot
        ) = processAmount(tAmount);
        uint256 tFees = tLiquidity + tMarketing + tDev + tJackpot;
        if (recipient != uniswapV2Pair && recipient != DEAD) {
            require(
                isExcludedFromFee(recipient) ||
                    balanceOf(recipient) + tTransferAmount <= maxWalletSize,
                "Transfer amount will push this wallet beyond the maximum allowed size"
            );
        }

        _tOwned[sender] = _tOwned[sender] - tAmount;
        _tOwned[recipient] = _tOwned[recipient] + tTransferAmount;

        _tOwned[address(this)] = _tOwned[address(this)] + tFees;
        _liquidityTokens += tLiquidity;
        _marketingTokens += tMarketing;
        _devTokens += tDev;
        _jackpotTokens += tJackpot;

        emit Transfer(sender, recipient, tTransferAmount);
    }

    function processAmount(uint256 tAmount)
        private
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 tLiquidity = (tAmount * _liquidityFee) / MAX_PCT;
        uint256 tMarketing = (tAmount * _marketingFee) / MAX_PCT;
        uint256 tDev = (tAmount * _devFee) / MAX_PCT;
        uint256 tJackpot = (tAmount * _jackpotFee) / MAX_PCT;
        uint256 tTransferAmount = tAmount -
            (tLiquidity + tMarketing + tDev + tJackpot);
        return (tTransferAmount, tLiquidity, tMarketing, tDev, tJackpot);
    }
}
