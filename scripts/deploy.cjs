const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function upsertEnvVar(envPath, key, value) {
    let envText = "";
    if (fs.existsSync(envPath)) {
        envText = fs.readFileSync(envPath, "utf8");
    }

    const line = `${key}=${value}`;
    const regex = new RegExp(`^${key}=.*$`, "m");

    if (regex.test(envText)) {
        envText = envText.replace(regex, line);
    } else {
        const separator = envText.endsWith("\n") || envText.length === 0 ? "" : "\n";
        envText = `${envText}${separator}${line}\n`;
    }

    fs.writeFileSync(envPath, envText);
}

async function main() {
    const baseImageURI = "https://esolvhnpvfoavgycrwgy.supabase.co/storage/v1/object/public/base-aura/images/";

    console.log("Deploying BaseAuraV2 contract...");
    console.log("Base Image URI:", baseImageURI);

    const BaseAuraV2 = await hre.ethers.getContractFactory("BaseAuraV2");

    // Deploy with explicit gas limit to avoid estimation issues
    const baseAura = await BaseAuraV2.deploy(baseImageURI, {
        gasLimit: 3000000n,
    });

    await baseAura.waitForDeployment();

    const contractAddress = await baseAura.getAddress();
    console.log("\n✅ BaseAuraV2 deployed to:", contractAddress);

    const envPath = path.join(__dirname, "..", ".env");
    upsertEnvVar(envPath, "CONTRACT_ADDRESS", contractAddress);
    upsertEnvVar(envPath, "VITE_CONTRACT_ADDRESS", contractAddress);
    console.log(`\n📝 Updated ${envPath} with CONTRACT_ADDRESS and VITE_CONTRACT_ADDRESS`);

    console.log("\n📋 Next steps:");
    console.log("1. Restart your dev server so Vite picks up the new VITE_CONTRACT_ADDRESS");
    console.log("2. Verify contract: npx hardhat verify --network baseMainnet", contractAddress, `"${baseImageURI}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
