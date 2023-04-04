const { expect, assert } = require('chai');
const { BigNumber } = require('ethers');
// const { providers } = require("ethers");
const { ethers } = require('hardhat');
const {
    getBigNumber,
    advanceBlock,
    advanceBlockTo
    // advanceTimeStamp,
} = require('../scripts/shared/utilities.js');

const SB_PER_BLOCK = getBigNumber(1, 18); // 1 SB per block

describe('Insurance', function () {
    before(async function () {
        this.Insurance = await ethers.getContractFactory('Insurance');
        this.Rewarder = await ethers.getContractFactory('Rewarder');
        this.MockERC20 = await ethers.getContractFactory('MockERC20');
        this.signers = await ethers.getSigners();

        this.dev = this.signers[0];
        this.alice = this.signers[1];
        this.bob = this.signers[2];
    });

    beforeEach(async function () {
        this.unoToken = await this.MockERC20.deploy('Mock UNO', 'UNO');
        this.usdtToken = await this.MockERC20.deploy('Mock USDT', 'USDT');

        this.insurance = await this.Insurance.deploy(Math.floor(new Date().getTime() / 1000), this.usdtToken.address);
        this.rewarder = await this.Rewarder.deploy(this.unoToken.address, this.insurance.address);
        await this.insurance.setRewarder(this.rewarder.address);

        await this.usdtToken.transfer(this.alice.address, getBigNumber(1000000));
        await this.usdtToken.transfer(this.bob.address, getBigNumber(1000000));
        console.log("done")
    });

    describe('Test', function () {
        it('Test is started', function () { });
    });

    describe('ProductLength', function () {
        it('ProductLength should be increased', async function () {
            console.log("a")
            await this.insurance.add(0, getBigNumber(50 * 100));
            console.log("b")
            expect(await this.insurance.productLength()).to.be.equal(1);
        });

        it('Each Product can not be added twice', async function () {
            await this.insurance.add(0, getBigNumber(50 * 100));
            expect(await this.insurance.productLength()).to.be.equal(1);

            await expect(this.insurance.add(0, getBigNumber(50 * 100))).to.be.revertedWith(
                'Insurance: Product already exists'
            );
        });
    });

    describe('Set', function () {
        it('Should emit SetProduct', async function () {
            await this.insurance.add(0, getBigNumber(50 * 100));
            await expect(this.insurance.set(0, 60 * 100))
                .to.emit(this.insurance, 'LogSetProduct')
                .withArgs(0, 60 * 100);
        });

        it('Should revert if invalid product', async function () {
            await expect(this.insurance.set(2, 60 * 100)).to.be.revertedWith('Insurance: Product does not exist');
        });
    });

    describe('Pending UNO', function () {
        it('Pending UNO should be equal to expected amount', async function () {
            await this.insurance.add(0, getBigNumber(50 * 100));
            await this.usdtToken.connect(this.alice).approve(this.insurance.address, getBigNumber(1000000000000000));

            const log1 = await (
                await this.insurance.connect(this.alice).deposit(0, getBigNumber(1000), this.alice.address)
            ).wait();
            const block1 = await ethers.provider.getBlock(log1.blockHash);

            await advanceBlock();

            const log2 = await this.insurance.connect(this.alice).updateProduct(0);
            const block2 = await ethers.provider.getBlock(log2.blockHash);

            const expectedReward = getBigNumber(50 * 100) * (block2.number - block1.number);
            const pendingReward = await this.insurance.pendingRewards(0, this.alice.address);
            expect(expectedReward).to.be.equal(pendingReward);

            const productInfo = await this.insurance.productInfo(0);
            expect(productInfo.lastRewardBlock).to.be.equal(block2.number);
        });
    });

    describe('Deposit', function () {
        beforeEach(async function () {
            await this.insurance.add(0, getBigNumber(50 * 100));
            await this.usdtToken.approve(this.insurance.address, getBigNumber(1000000000000000));
        });

        it('Should deposit and update product info', async function () { });

        it('Should not allow to deposit in non-existent product', async function () {
            await expect(this.insurance.deposit(1, getBigNumber(1), this.dev.address)).to.be.revertedWith(
                'Insurance: Product does not exist'
            );
        });
    });

    describe('Withdraw', function () {
        beforeEach(async function () { });

        it('Withdraw some amount and harvest rewards', async function () {
            await this.insurance.add(0, getBigNumber(50 * 100));
            await this.usdtToken.connect(this.alice).approve(this.insurance.address, getBigNumber(1000000000000000));
            await this.unoToken.transfer(this.rewarder.address, getBigNumber(100000000));

            const depositLog = await (
                await this.insurance.connect(this.alice).deposit(0, getBigNumber(1000), this.alice.address)
            ).wait();

            const unoBalanceBefore = await this.unoToken.balanceOf(this.alice.address);

            await advanceBlockTo(depositLog.blockNumber + 3);

            const withdrawLog = await this.insurance.connect(this.alice).withdraw(0, getBigNumber(100));

            const expectedReward = getBigNumber(50 * 100) * (withdrawLog.blockNumber - depositLog.blockNumber); // Pending amount

            const unoBalanceAfter = await this.unoToken.balanceOf(this.alice.address);

            expect(expectedReward.add(unoBalanceBefore)).to.be.equal(unoBalanceAfter);
        });
    });
});