// نشر العقد على شبكة اختبارية (مثال: mumbai)
const hre = require("hardhat");

async function main() {
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy("StampcoinNFT", "STP");
  await nft.deployed();
  console.log("MyNFT deployed to:", nft.address);
  // اطبع عنوان العقد ليضعه في .env أو تستخدمه لاحقاً
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });