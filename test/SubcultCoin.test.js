import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
const SUPPLY = ethers.parseUnits("1000000000", 18);

describe("SubcultCoin", () => {
  it("has the right name, symbol and decimals", async () => {
    const token = await ethers.deployContract("SubcultCoin", [SUPPLY]);
    expect(await token.name()).to.equal("SUBCULT");
    expect(await token.symbol()).to.equal("SUBCULT");
    expect(await token.decimals()).to.equal(18n);
  });

  it("gives the whole supply to the deployer", async () => {
    const [deployer] = await ethers.getSigners();
    const token = await ethers.deployContract("SubcultCoin", [SUPPLY]);
    expect(await token.totalSupply()).to.equal(SUPPLY);
    expect(await token.balanceOf(deployer.address)).to.equal(SUPPLY);
  });

  it("transfers and cannot mint more", async () => {
    const [, other] = await ethers.getSigners();
    const token = await ethers.deployContract("SubcultCoin", [SUPPLY]);
    await token.transfer(other.address, 5n);
    expect(await token.balanceOf(other.address)).to.equal(5n);
    expect(token.interface.getFunction("mint")).to.equal(null);
  });
});
