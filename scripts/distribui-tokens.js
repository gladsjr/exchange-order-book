const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Valores fixos para distribuição
    const amountEther = "0.01";  // 0.01 ETH por endereço
    const amountMPE1 = "5";      // 5 MPE1 por endereço
    const amountMPE2 = "5";      // 5 MPE2 por endereço

    console.log("🚀 Iniciando distribuição de tokens...\n");
    console.log("📦 Quantidades a distribuir por endereço:");
    console.log(`   💎 ETH: ${amountEther}`);
    console.log(`   🪙 MPE1: ${amountMPE1}`);
    console.log(`   🪙 MPE2: ${amountMPE2}\n`);

    // Carregar endereços do arquivo
    const addressesFilePath = path.join(__dirname, "..", "recipient-addresses.txt");

    if (!fs.existsSync(addressesFilePath)) {
        console.error("❌ Arquivo recipient-addresses.txt não encontrado!");
        console.error("📝 Crie o arquivo na raiz do projeto com um endereço por linha.");
        process.exit(1);
    }

    const fileContent = fs.readFileSync(addressesFilePath, "utf-8");
    const addresses = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .filter(line => ethers.isAddress(line));

    if (addresses.length === 0) {
        console.error("❌ Nenhum endereço válido encontrado no arquivo!");
        console.error("📝 Adicione endereços válidos ao arquivo recipient-addresses.txt");
        process.exit(1);
    }

    console.log(`📋 Encontrados ${addresses.length} endereços válidos para distribuição.\n`);

    // Obter o deployer (conta que vai distribuir)
    const [deployer] = await ethers.getSigners();
    console.log("👤 Distribuidor:", deployer.address);

    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Saldo do distribuidor:", ethers.formatEther(balance), "ETH\n");

    // Carregar informações de deployment
    const deploymentPath = path.join(__dirname, "..", "frontend", "deployment.json");

    if (!fs.existsSync(deploymentPath)) {
        console.error("❌ Arquivo deployment.json não encontrado!");
        console.error("📝 Execute o deploy primeiro: npm run deploy ou npm run deploy:local");
        process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

    // Conectar aos contratos de tokens
    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    const mpe1Token = SimpleToken.attach(deploymentInfo.contracts.mpe1Token.address);
    const mpe2Token = SimpleToken.attach(deploymentInfo.contracts.mpe2Token.address);

    console.log("🔗 Contratos carregados:");
    console.log(`   MPE1: ${deploymentInfo.contracts.mpe1Token.address}`);
    console.log(`   MPE2: ${deploymentInfo.contracts.mpe2Token.address}\n`);

    // Verificar saldos de tokens do distribuidor
    const mpe1Balance = await mpe1Token.balanceOf(deployer.address);
    const mpe2Balance = await mpe2Token.balanceOf(deployer.address);

    console.log("🏦 Saldos de tokens do distribuidor:");
    console.log(`   MPE1: ${mpe1Balance.toString()}`);
    console.log(`   MPE2: ${mpe2Balance.toString()}\n`);

    // Verificar se há saldo suficiente
    const totalMPE1Needed = BigInt(amountMPE1) * BigInt(addresses.length);
    const totalMPE2Needed = BigInt(amountMPE2) * BigInt(addresses.length);
    const totalEtherNeeded = ethers.parseEther(amountEther) * BigInt(addresses.length);

    if (mpe1Balance < totalMPE1Needed) {
        console.error(`❌ Saldo insuficiente de MPE1! Necessário: ${totalMPE1Needed}, Disponível: ${mpe1Balance}`);
        process.exit(1);
    }

    if (mpe2Balance < totalMPE2Needed) {
        console.error(`❌ Saldo insuficiente de MPE2! Necessário: ${totalMPE2Needed}, Disponível: ${mpe2Balance}`);
        process.exit(1);
    }

    if (balance < totalEtherNeeded) {
        console.error(`❌ Saldo insuficiente de ETH! Necessário: ${ethers.formatEther(totalEtherNeeded)}, Disponível: ${ethers.formatEther(balance)}`);
        process.exit(1);
    }

    console.log("✅ Saldos suficientes para distribuição!\n");
    console.log("=".repeat(80));
    console.log("🎁 INICIANDO DISTRIBUIÇÃO");
    console.log("=".repeat(80) + "\n");

    let successCount = 0;
    let errorCount = 0;

    console.log("⚡ Modo OTIMIZADO: 3 transações em paralelo por endereço\n"); const allResults = [];

    // Processar endereços sequencialmente (necessário por causa do nonce)
    // Mas enviar as 3 transações de cada endereço em paralelo
    for (let i = 0; i < addresses.length; i++) {
        const recipient = addresses[i];
        const recipientNum = i + 1;
        const totalNum = addresses.length;

        try {
            console.log(`\n[${recipientNum}/${totalNum}] 📤 Enviando para: ${recipient}`);

            // Pegar nonce base atual
            let currentNonce = await deployer.getNonce();
            const startNonce = currentNonce;

            // Preparar as 3 transações com nonces sequenciais
            const txPromises = [];

            // Enviar ETH
            if (parseFloat(amountEther) > 0) {
                const ethTxPromise = deployer.sendTransaction({
                    to: recipient,
                    value: ethers.parseEther(amountEther),
                    nonce: currentNonce++
                }).then(tx => {
                    console.log(`[${recipientNum}/${totalNum}] 💎 ETH enviado! Hash: ${tx.hash}`);
                    return tx.wait();
                });
                txPromises.push(ethTxPromise);
            }

            // Enviar MPE1
            if (parseInt(amountMPE1) > 0) {
                const mpe1TxPromise = mpe1Token.transfer(recipient, amountMPE1, {
                    nonce: currentNonce++
                }).then(tx => {
                    console.log(`[${recipientNum}/${totalNum}] 🪙 MPE1 enviado! Hash: ${tx.hash}`);
                    return tx.wait();
                });
                txPromises.push(mpe1TxPromise);
            }

            // Enviar MPE2
            if (parseInt(amountMPE2) > 0) {
                const mpe2TxPromise = mpe2Token.transfer(recipient, amountMPE2, {
                    nonce: currentNonce++
                }).then(tx => {
                    console.log(`[${recipientNum}/${totalNum}] 🪙 MPE2 enviado! Hash: ${tx.hash}`);
                    return tx.wait();
                });
                txPromises.push(mpe2TxPromise);
            }

            // Aguardar confirmação das 3 transações em paralelo
            await Promise.all(txPromises);

            console.log(`[${recipientNum}/${totalNum}] ✅ Completo! (nonces ${startNonce}-${currentNonce - 1})`);
            allResults.push({ success: true, recipient });

        } catch (error) {
            console.error(`[${recipientNum}/${totalNum}] ❌ Erro: ${error.message}`);
            allResults.push({ success: false, recipient, error: error.message });
        }

        // Pequeno delay para evitar rate limit (opcional, só se necessário)
        if (i < addresses.length - 1 && addresses.length > 10) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s
        }
    }

    // Contar sucessos e falhas
    successCount = allResults.filter(r => r.success).length;
    errorCount = allResults.filter(r => !r.success).length;

    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMO DA DISTRIBUIÇÃO");
    console.log("=".repeat(80));
    console.log(`✅ Sucesso: ${successCount} endereços`);
    console.log(`❌ Falhas: ${errorCount} endereços`);
    console.log(`📦 Total distribuído:`);
    console.log(`   💎 ETH: ${parseFloat(amountEther) * successCount}`);
    console.log(`   🪙 MPE1: ${parseInt(amountMPE1) * successCount}`);
    console.log(`   🪙 MPE2: ${parseInt(amountMPE2) * successCount}`);
    console.log("=".repeat(80));

    // Mostrar falhas, se houver
    if (errorCount > 0) {
        console.log("\n⚠️  Endereços com falha:");
        allResults.filter(r => !r.success).forEach(r => {
            console.log(`   ❌ ${r.recipient}: ${r.error}`);
        });
    }

    // Mostrar saldos finais
    const finalBalance = await deployer.provider.getBalance(deployer.address);
    const finalMPE1Balance = await mpe1Token.balanceOf(deployer.address);
    const finalMPE2Balance = await mpe2Token.balanceOf(deployer.address);

    console.log("\n💰 Saldos finais do distribuidor:");
    console.log(`   ETH: ${ethers.formatEther(finalBalance)}`);
    console.log(`   MPE1: ${finalMPE1Balance.toString()}`);
    console.log(`   MPE2: ${finalMPE2Balance.toString()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Erro durante a distribuição:", error);
        process.exit(1);
    });
