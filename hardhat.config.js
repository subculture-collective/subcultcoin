import { defineConfig, configVariable } from "hardhat/config";
import toolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [toolbox],
  solidity: "0.8.28",
  networks: {
    sepolia: {
      type: "http",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_KEY")],
    },
    baseSepolia: {
      type: "http",
      url: "https://sepolia.base.org",
      accounts: [configVariable("DEPLOYER_KEY")],
    },
    base: {
      type: "http",
      url: "https://mainnet.base.org",
      accounts: [configVariable("DEPLOYER_KEY")],
    },
  },
});
