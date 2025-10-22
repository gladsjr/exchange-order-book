const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Executando testes básicos dos contratos...\n");

    // Obter contas de teste
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    console.log("👤 User1:", user1.address);
    console.log("👤 User2:", user2.address);

    // 1. Deploy dos contratos
    console.log("\n🚀 Deploying contracts...");

    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    const mpe1 = await SimpleToken.deploy("MPE Token 1", "MPE1", 1000000);
    const mpe2 = await SimpleToken.deploy("MPE Token 2", "MPE2", 1000000);

    const OrderBookExchange = await ethers.getContractFactory("OrderBookExchange");
    const exchange = await OrderBookExchange.deploy(mpe1.address, mpe2.address);

    await mpe1.deployed();
    await mpe2.deployed();
    await exchange.deployed();

    console.log("✅ MPE1:", mpe1.address);
    console.log("✅ MPE2:", mpe2.address);
    console.log("✅ Exchange:", exchange.address);

    // 2. Verificar informações dos tokens
    console.log("\n📊 Token Information:");
    console.log("MPE1 - Name:", await mpe1.name(), "Symbol:", await mpe1.symbol(), "Decimals:", await mpe1.decimals());
    console.log("MPE2 - Name:", await mpe2.name(), "Symbol:", await mpe2.symbol(), "Decimals:", await mpe2.decimals());

    // 3. Distribuir tokens para usuários
    console.log("\n🎁 Distributing tokens...");
    await mpe1.transfer(user1.address, 100000);
    await mpe2.transfer(user1.address, 100000);
    await mpe1.transfer(user2.address, 100000);
    await mpe2.transfer(user2.address, 100000);

    console.log("User1 MPE1 balance:", (await mpe1.balanceOf(user1.address)).toString());
    console.log("User1 MPE2 balance:", (await mpe2.balanceOf(user1.address)).toString());
    console.log("User2 MPE1 balance:", (await mpe1.balanceOf(user2.address)).toString());
    console.log("User2 MPE2 balance:", (await mpe2.balanceOf(user2.address)).toString());

    // 4. Teste de criação de ordens
    console.log("\n📈 Testing order creation...");

    // User1 cria uma ordem de venda: vende 100 MPE1 por 200 MPE2
    await mpe1.connect(user1).approve(exchange.address, 100);
    await exchange.connect(user1).createSellOrder(100, 200);
    console.log("✅ User1 created sell order: 100 MPE1 for 200 MPE2");

    // User2 cria uma ordem de compra: compra 50 MPE1 por 100 MPE2  
    await mpe2.connect(user2).approve(exchange.address, 100);
    await exchange.connect(user2).createBuyOrder(50, 100);
    console.log("✅ User2 created buy order: 50 MPE1 for 100 MPE2");

    // 5. Verificar order book
    console.log("\n📚 Checking order book...");
    const buyOrders = await exchange.getActiveBuyOrders();
    const sellOrders = await exchange.getActiveSellOrders();

    console.log("Active buy orders:", buyOrders.length);
    console.log("Active sell orders:", sellOrders.length);

    // 6. Verificar saldos após matching
    console.log("\n💰 Final balances:");
    console.log("User1 MPE1:", (await mpe1.balanceOf(user1.address)).toString());
    console.log("User1 MPE2:", (await mpe2.balanceOf(user1.address)).toString());
    console.log("User2 MPE1:", (await mpe1.balanceOf(user2.address)).toString());
    console.log("User2 MPE2:", (await mpe2.balanceOf(user2.address)).toString());

    console.log("\n✅ Testes concluídos com sucesso!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erro nos testes:", error);
        process.exit(1);
    });