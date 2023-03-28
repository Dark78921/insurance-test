const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurance", function() {
    async function deploy3MonthsInsuranceFixture () {
        const THREE_MONTHS_IN_SEC = 3 * 30 * 24 * 3600;
        const DEPOSIT_AMOUNT = 500000 * 10 ** 18;
        
        const depositAmount = DEPOSIT_AMOUNT;
        const insuranceTime = THREE_MONTHS_IN_SEC;
        
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const USDT = await ethers.getContractFactory("testUSDT");
        const usdt = await USDT.deploy();

        const UNO = await ethers.getContractFactory("testUNO");
        const uno = await UNO.deploy();
        
        const Insurance = await ethers.getContractFactory("Insurance");
        const insurance = await Insurance.deploy(usdt.address, uno.address);
        
        await uno.mintUNO(insurance.address, ethers.utils.parseEther("10000000"));
        await uno.approve(insurance.address, ethers.utils.parseEther("10000000"));
        await usdt.mintUSDT(ethers.utils.parseEther("50000000"));
        await usdt.approve(insurance.address, ethers.utils.parseEther("50000000"));

        return { insurance, usdt, uno, insuranceTime, depositAmount, owner, otherAccount };
    }

    describe("Deployment", function() {
        it("Should set the right owner", async function () {
            const { insurance, owner } = await loadFixture(deploy3MonthsInsuranceFixture);
            expect(await insurance.owner()).to.equal(owner.address);
        });
    });

    describe("Deposit", function() {
        it("Shouldn't fail if all condition is satisfied and Deposit events is emitted", async function() {
            const { insurance } = await loadFixture(deploy3MonthsInsuranceFixture);
            await expect(insurance.deposit(0)).not.to.be.reverted;
        });
        it("Should revert with the right error if already deposited and Deposit events is emitted", async function() {
            const {insurance, owner} = await loadFixture(deploy3MonthsInsuranceFixture);
            await expect(insurance.deposit(0)).to.emit(insurance, "Deposit").withArgs(owner.address, 0);
            await expect(insurance.deposit(0)).to.be.revertedWith("Already deposited!");
        });
        it("Should revert with the right error if product ID is not valid", async function() {
            const {insurance} = await loadFixture(deploy3MonthsInsuranceFixture);
            await expect(insurance.deposit(256)).to.be.revertedWith("Invalid product id");
        });
        it("StartInsurance event should emit and should revert with the right error if insurance is already started", async function() {
            const {insurance} = await loadFixture(deploy3MonthsInsuranceFixture);
            for (let i = 0; i < 140; i++) {
                await insurance.deposit(i);
            }
            await expect(insurance.deposit(140)).to.emit(insurance, "StartInsurance");
            await expect(insurance.deposit(141)).to.be.revertedWith("Insurance is already started!");
        });
    });

    describe("Withdraw", function() {
        it("Should revert with the right error if no deposited", async function() {
            const {insurance} = await loadFixture(deploy3MonthsInsuranceFixture);
            await expect(insurance.withdraw(0)).to.be.revertedWith("You have no any deposited amount for this product")
        });
        it("Should rever with the right error if withdraw twice", async function() {
            const {insurance, insuranceTime, owner} = await loadFixture(deploy3MonthsInsuranceFixture);
            for (let i = 0; i < 141; i++) {
                await insurance.deposit(i);
            }
            await time.increaseTo((await time.latest()) + insuranceTime);
            await expect(insurance.withdraw(0)).not.be.reverted;
            await expect(insurance.withdraw(0)).to.be.revertedWith("You have no any deposited amount for this product");
        })
        it("Should revert with the right error if insurance is not started", async function() {
            const {insurance} = await loadFixture(deploy3MonthsInsuranceFixture);
            await insurance.deposit(0);
            await expect(insurance.withdraw(0)).to.be.revertedWith("Insurance is not started yet")
        });
        it("Should revert with the right error if insurance is not ended", async function() {
            const {insurance} = await loadFixture(deploy3MonthsInsuranceFixture);
            for (let i = 0; i < 141; i++) {
                await insurance.deposit(i);
            }
            await expect(insurance.withdraw(0)).to.be.revertedWith("Still insurance period");
        });
        it("Shouldn't revert if insurance is ended and Withdraw even emited", async function() {
            const {insurance, insuranceTime, owner} = await loadFixture(deploy3MonthsInsuranceFixture);
            for (let i = 0; i < 141; i++) {
                await insurance.deposit(i);
            }
            await time.increaseTo((await time.latest()) + insuranceTime);
            await expect(insurance.withdraw(0)).not.be.reverted;
            await expect(insurance.withdraw(1)).to.emit(insurance, "Withdraw").withArgs(owner.address, 1, ethers.utils.parseEther("200"));
        });
    })
})