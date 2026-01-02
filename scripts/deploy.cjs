const hre = require("hardhat");

async function main() {
    const baseImageURI = "https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/";

    console.log("Deploying BaseAuraV2 contract...");
    console.log("Base Image URI:", baseImageURI);

    const BaseAuraV2 = await hre.ethers.getContractFactory("BaseAuraV2");
    const baseAura = await BaseAuraV2.deploy(baseImageURI);

    await baseAura.waitForDeployment();

    const contractAddress = await baseAura.getAddress();
    console.log("\n✅ BaseAuraV2 deployed to:", contractAddress);
    console.log("\n📋 Next steps:");
    console.log("1. Copy this address to src/App.jsx CONTRACT_ADDRESS");
    console.log("2. Verify contract: npx hardhat verify --network baseSepolia", contractAddress, `"${baseImageURI}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
