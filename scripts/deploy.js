import { network } from "hardhat";

const SUPPLY_TOKENS = process.env.SUPPLY ?? "1000000000";
const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();
console.log("Deployer:", deployer.address);
console.log("Balance :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

const token = await ethers.deployContract("SubcultCoin", [ethers.parseUnits(SUPPLY_TOKENS, 18)]);
await token.waitForDeployment();
console.log("SUBCULT deployed at:", await token.getAddress());
