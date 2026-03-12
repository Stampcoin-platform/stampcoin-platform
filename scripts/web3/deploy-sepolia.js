const hre = require("hardhat");

async function main() {
  const treasury = process.env.TREASURY_ADDRESS;
  if (!treasury) {
    throw new Error("TREASURY_ADDRESS is required in .env");
  }

  const mintFeeWei = process.env.STAMP_NFT_MINT_FEE_WEI || "10000000000000000"; // 0.01 ETH default

  console.log("Deploying contracts with:");
  console.log(`- treasury: ${treasury}`);
  console.log(`- mintFeeWei: ${mintFeeWei}`);

  const stcFactory = await hre.ethers.getContractFactory("StampCoinToken");
  const stc = await stcFactory.deploy(treasury);
  await stc.deployed();
  const stcAddress = stc.address;

  const nftFactory = await hre.ethers.getContractFactory("StampNFT");
  const nft = await nftFactory.deploy(treasury, mintFeeWei);
  await nft.deployed();
  const nftAddress = nft.address;

  console.log("Deployment completed:");
  console.log(`STC_ADDRESS=${stcAddress}`);
  console.log(`STC_NFT_ADDRESS=${nftAddress}`);

  console.log("Update .env with:");
  console.log(`STP_CONTRACT_ADDRESS=${stcAddress}`);
  console.log(`STC_NFT_CONTRACT_ADDRESS=${nftAddress}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
