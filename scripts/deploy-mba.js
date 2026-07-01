const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploy dos tokens MBA1 e MBA2...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    console.log("💰 Saldo:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    const MBAToken = await ethers.getContractFactory("MBAToken");

    // 1 bilhão de tokens (as 18 casas decimais são aplicadas dentro do contrato)
    const initialSupply = 1_000_000_000n;

    console.log("🪙 Deploy do Token MBA1...");
    const mba1 = await MBAToken.deploy("MBA1", "MBA1", initialSupply);
    await mba1.waitForDeployment();
    const mba1Address = await mba1.getAddress();
    console.log("✅ MBA1 Token:", mba1Address);

    console.log("🪙 Deploy do Token MBA2...");
    const mba2 = await MBAToken.deploy("MBA2", "MBA2", initialSupply);
    await mba2.waitForDeployment();
    const mba2Address = await mba2.getAddress();
    console.log("✅ MBA2 Token:", mba2Address);

    // Gerar arquivo de configuração
    const network = await ethers.provider.getNetwork();
    const deploymentInfo = {
        network: hre.network.name,
        chainId: Number(network.chainId),
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            mba1Token: {
                address: mba1Address,
                name: "MBA1",
                symbol: "MBA1",
                decimals: 18,
                initialSupply: initialSupply.toString()
            },
            mba2Token: {
                address: mba2Address,
                name: "MBA2",
                symbol: "MBA2",
                decimals: 18,
                initialSupply: initialSupply.toString()
            }
        },
        abi: MBAToken.interface.format("json")
    };

    const configPath = path.join(__dirname, "..", "mba-deployment.json");
    fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Configuração salva em:", configPath);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOY CONCLUÍDO!");
    console.log("=".repeat(60));
    console.log("📍 Rede:", hre.network.name);
    console.log("🪙 MBA1:", mba1Address);
    console.log("🪙 MBA2:", mba2Address);
    console.log("=".repeat(60));

    if (hre.network.name === "sepolia") {
        console.log("\n🔗 Etherscan:");
        console.log(`   - MBA1: https://sepolia.etherscan.io/address/${mba1Address}`);
        console.log(`   - MBA2: https://sepolia.etherscan.io/address/${mba2Address}`);
        console.log("\n🔎 Para verificar o código no Etherscan:");
        console.log(`   npx hardhat verify --network sepolia ${mba1Address} "MBA1" "MBA1" 1000000000`);
        console.log(`   npx hardhat verify --network sepolia ${mba2Address} "MBA2" "MBA2" 1000000000`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deploy falhou:", error);
        process.exit(1);
    });
