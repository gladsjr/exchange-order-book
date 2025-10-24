const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Iniciando deploy da Exchange Descentralizada...\n");

    // Obter o deployer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    const SimpleToken = await ethers.getContractFactory("SimpleToken");

    // Endereços existentes na Sepolia (reutilizados por padrão)
    const EXISTING_MPE1_SEPOLIA = "0x0f13072e3AF610F35120316C49D0dd486fd9D32B";
    const EXISTING_MPE2_SEPOLIA = "0xBe3E8B1f67F31eF3aF0f1CfC100C5B1F66AE69Ce";

    let mpe1Token, mpe2Token;
    let mpe1Address, mpe2Address;

    // Na Sepolia, reutiliza tokens existentes (a menos que seja um reset completo)
    if (hre.network.name === "sepolia" && !process.env.RESET_TOKENS) {
        console.log("♻️  Reutilizando tokens existentes na Sepolia...");
        mpe1Address = EXISTING_MPE1_SEPOLIA;
        mpe2Address = EXISTING_MPE2_SEPOLIA;

        // Conecta aos contratos existentes
        mpe1Token = SimpleToken.attach(mpe1Address);
        mpe2Token = SimpleToken.attach(mpe2Address);

        console.log("✅ MPE1 Token (existente):", mpe1Address);
        console.log("✅ MPE2 Token (existente):", mpe2Address);
    } else {
        // Em outras redes ou se RESET_TOKENS=true, faz deploy completo
        console.log("🪙 Deploying Token MPE1...");
        mpe1Token = await SimpleToken.deploy(
            "MPE Token 1",     // nome
            "MPE1",            // símbolo  
            1000000            // supply inicial (1 milhão de tokens sem decimais)
        );
        await mpe1Token.waitForDeployment();
        mpe1Address = await mpe1Token.getAddress();
        console.log("✅ MPE1 Token deployed to:", mpe1Address);

        console.log("🪙 Deploying Token MPE2...");
        mpe2Token = await SimpleToken.deploy(
            "MPE Token 2",     // nome
            "MPE2",            // símbolo
            1000000            // supply inicial (1 milhão de tokens sem decimais)
        );
        await mpe2Token.waitForDeployment();
        mpe2Address = await mpe2Token.getAddress();
        console.log("✅ MPE2 Token deployed to:", mpe2Address);
    }

    // 3. Deploy da Exchange
    console.log("\n🏪 Deploying OrderBook Exchange...");
    const OrderBookExchange = await ethers.getContractFactory("OrderBookExchange");

    const exchange = await OrderBookExchange.deploy(
        mpe1Address,  // tokenA
        mpe2Address   // tokenB
    );
    await exchange.waitForDeployment();
    console.log("✅ OrderBook Exchange deployed to:", await exchange.getAddress());

    // 4. Distribuir alguns tokens para facilitar testes (apenas se fez deploy novo dos tokens)
    if (hre.network.name !== "sepolia" || process.env.RESET_TOKENS) {
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
                address: mpe1Address,
                name: "MPE Token 1",
                symbol: "MPE1",
                decimals: 0,
                initialSupply: 1000000
            },
            mpe2Token: {
                address: mpe2Address,
                name: "MPE Token 2",
                symbol: "MPE2",
                decimals: 0,
                initialSupply: 1000000
            },
            exchange: {
                address: await exchange.getAddress(),
                tokenA: mpe1Address,
                tokenB: mpe2Address
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
    console.log("🪙 MPE1 Token:", mpe1Address);
    console.log("🪙 MPE2 Token:", mpe2Address);
    console.log("🏪 Exchange:", await exchange.getAddress());
    console.log("📄 Config file:", configPath);
    console.log("=".repeat(60));

    // 7. Instruções para próximos passos
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Open frontend/index.html in a browser");
    if (hre.network.name === "localhost") {
        console.log("2. Connect MetaMask to localhost network (http://127.0.0.1:8545)");
    } else {
        console.log("2. Connect MetaMask to Sepolia network");
    }
    console.log("3. Import token addresses in MetaMask:");
    console.log(`   - MPE1: ${mpe1Address}`);
    console.log(`   - MPE2: ${mpe2Address}`);
    console.log("4. Start trading on the exchange!");

    if (hre.network.name === "sepolia") {
        console.log("\n🔗 View on Etherscan:");
        console.log(`   - MPE1: https://sepolia.etherscan.io/address/${mpe1Address}`);
        console.log(`   - MPE2: https://sepolia.etherscan.io/address/${mpe2Address}`);
        console.log(`   - Exchange: https://sepolia.etherscan.io/address/${await exchange.getAddress()}`);

        if (!process.env.RESET_TOKENS) {
            console.log("\n♻️  Para fazer deploy completo (novos tokens), use:");
            console.log("   RESET_TOKENS=true npm run deploy");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });