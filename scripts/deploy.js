const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Iniciando deploy da Exchange Descentralizada...\n");

    // Obter o deployer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    // 1. Deploy do Token MPE1
    console.log("🪙 Deploying Token MPE1...");
    const SimpleToken = await ethers.getContractFactory("SimpleToken");

    const mpe1Token = await SimpleToken.deploy(
        "MPE Token 1",     // nome
        "MPE1",            // símbolo  
        1000000            // supply inicial (1 milhão de tokens sem decimais)
    );
    await mpe1Token.waitForDeployment();
    console.log("✅ MPE1 Token deployed to:", await mpe1Token.getAddress());

    // 2. Deploy do Token MPE2
    console.log("🪙 Deploying Token MPE2...");
    const mpe2Token = await SimpleToken.deploy(
        "MPE Token 2",     // nome
        "MPE2",            // símbolo
        1000000            // supply inicial (1 milhão de tokens sem decimais)
    );
    await mpe2Token.waitForDeployment();
    console.log("✅ MPE2 Token deployed to:", await mpe2Token.getAddress());

    // 3. Deploy da Exchange
    console.log("🏪 Deploying OrderBook Exchange...");
    const OrderBookExchange = await ethers.getContractFactory("OrderBookExchange");

    const exchange = await OrderBookExchange.deploy(
        await mpe1Token.getAddress(),  // tokenA
        await mpe2Token.getAddress()   // tokenB
    );
    await exchange.waitForDeployment();
    console.log("✅ OrderBook Exchange deployed to:", await exchange.getAddress());

    // 4. Distribuir alguns tokens para facilitar testes
    console.log("\n🎁 Distributing tokens for testing...");

    // Transferir 100,000 de cada token para uma carteira de teste (se disponível)
    const testAmount = 100000;

    // Se há mais de uma conta, usa a segunda como conta de teste
    const accounts = await ethers.getSigners();
    if (accounts.length > 1) {
        const testAccount = accounts[1];
        console.log("📤 Transferring tokens to test account:", testAccount.address);

        await mpe1Token.transfer(testAccount.address, testAmount);
        await mpe2Token.transfer(testAccount.address, testAmount);

        console.log(`✅ Transferred ${testAmount} MPE1 and ${testAmount} MPE2 to test account`);
    }

    // 5. Gerar arquivo de configuração para o frontend
    const network = await ethers.provider.getNetwork();
    const deploymentInfo = {
        network: hre.network.name,
        chainId: Number(network.chainId),
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            mpe1Token: {
                address: await mpe1Token.getAddress(),
                name: "MPE Token 1",
                symbol: "MPE1",
                decimals: 0,
                initialSupply: 1000000
            },
            mpe2Token: {
                address: await mpe2Token.getAddress(),
                name: "MPE Token 2",
                symbol: "MPE2",
                decimals: 0,
                initialSupply: 1000000
            },
            exchange: {
                address: await exchange.getAddress(),
                tokenA: await mpe1Token.getAddress(),
                tokenB: await mpe2Token.getAddress()
            }
        },
        abis: {
            SimpleToken: SimpleToken.interface.format("json"),
            OrderBookExchange: OrderBookExchange.interface.format("json")
        }
    };

    // Criar diretório frontend se não existir
    const frontendDir = path.join(__dirname, "..", "frontend");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    // Salvar arquivo de configuração
    const configPath = path.join(frontendDir, "deployment.json");
    fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📄 Deployment info saved to:", configPath);

    // 6. Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("📍 Network:", hre.network.name);
    console.log("🪙 MPE1 Token:", await mpe1Token.getAddress());
    console.log("🪙 MPE2 Token:", await mpe2Token.getAddress());
    console.log("🏪 Exchange:", await exchange.getAddress());
    console.log("📄 Config file:", configPath);
    console.log("=".repeat(60));

    // 7. Instruções para próximos passos
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Open frontend/index.html in a browser");
    console.log("2. Connect MetaMask to Sepolia network");
    console.log("3. Import token addresses in MetaMask:");
    console.log(`   - MPE1: ${await mpe1Token.getAddress()}`);
    console.log(`   - MPE2: ${await mpe2Token.getAddress()}`);
    console.log("4. Start trading on the exchange!");

    if (hre.network.name === "sepolia") {
        console.log("\n🔗 View on Etherscan:");
        console.log(`   - MPE1: https://sepolia.etherscan.io/address/${await mpe1Token.getAddress()}`);
        console.log(`   - MPE2: https://sepolia.etherscan.io/address/${await mpe2Token.getAddress()}`);
        console.log(`   - Exchange: https://sepolia.etherscan.io/address/${await exchange.getAddress()}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });