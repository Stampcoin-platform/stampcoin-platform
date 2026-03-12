const fs = require("fs");
const path = require("path");

function writeAbi(contractName) {
  const artifactPath = path.join(__dirname, "..", "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  const outPath = path.join(__dirname, "..", "..", "public", "abi", `${contractName}.abi.json`);
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}. Run 'npm run web3:compile' first.`);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(outPath, JSON.stringify(artifact.abi, null, 2), "utf8");
  console.log(`Exported ABI: ${outPath}`);
}

function main() {
  writeAbi("StampCoinToken");
  writeAbi("StampNFT");
}

main();
