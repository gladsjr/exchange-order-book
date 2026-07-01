const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Carregar configuração de distribuição (quais tokens e quantidades).
    // Cada token tem { enviar: bool, quantidade: string }. Só é distribuído
    // quando enviar === true E quantidade > 0.
    const configPath = path.join(__dirname, "..", "distribuicao-config.json");

    if (!fs.existsSync(configPath)) {
        console.error("❌ Arquivo distribuicao-config.json não encontrado!");
        console.error("📝 Crie o arquivo na raiz do projeto. Exemplo:");
        console.error('   {');
        console.error('     "eth":  { "enviar": true,  "quantidade": "0.01" },');
        console.error('     "mpe1": { "enviar": true,  "quantidade": "5" },');
        console.error('     "mpe2": { "enviar": false, "quantidade": "0" }');
        console.error('   }');
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Normaliza cada token: ativo só se "enviar" for true e a quantidade for > 0.
    const cfg = (token, padrao = "0") => {
        const c = config[token] || {};
        const quantidade = (c.quantidade ?? padrao).toString();
        const ativo = c.enviar === true && parseFloat(quantidade) > 0;
        return { ativo, quantidade };
    };

    const eth = cfg("eth");
    const mpe1 = cfg("mpe1");
    const mpe2 = cfg("mpe2");

    const amountEther = eth.quantidade;
    const amountMPE1 = mpe1.quantidade;
    const amountMPE2 = mpe2.quantidade;

    if (!eth.ativo && !mpe1.ativo && !mpe2.ativo) {
        console.error("❌ Nenhum token habilitado para envio no distribuicao-config.json!");
        console.error('📝 Marque "enviar": true e uma "quantidade" maior que 0 para ao menos um token.');
        process.exit(1);
    }

    console.log("🚀 Iniciando distribuição de tokens...\n");
    console.log("📦 Tokens e quantidades a distribuir por endereço:");
    console.log(`   💎 ETH:  ${eth.ativo  ? amountEther : "— (desativado)"}`);
    console.log(`   🪙 MPE1: ${mpe1.ativo ? amountMPE1  : "— (desativado)"}`);
    console.log(`   🪙 MPE2: ${mpe2.ativo ? amountMPE2  : "— (desativado)"}\n`);

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

    // Verificar se há saldo suficiente (apenas para os tokens habilitados)
    const totalMPE1Needed = BigInt(amountMPE1) * BigInt(addresses.length);
    const totalMPE2Needed = BigInt(amountMPE2) * BigInt(addresses.length);
    const totalEtherNeeded = ethers.parseEther(amountEther) * BigInt(addresses.length);

    if (mpe1.ativo && mpe1Balance < totalMPE1Needed) {
        console.error(`❌ Saldo insuficiente de MPE1! Necessário: ${totalMPE1Needed}, Disponível: ${mpe1Balance}`);
        process.exit(1);
    }

    if (mpe2.ativo && mpe2Balance < totalMPE2Needed) {
        console.error(`❌ Saldo insuficiente de MPE2! Necessário: ${totalMPE2Needed}, Disponível: ${mpe2Balance}`);
        process.exit(1);
    }

    if (eth.ativo && balance < totalEtherNeeded) {
        console.error(`❌ Saldo insuficiente de ETH! Necessário: ${ethers.formatEther(totalEtherNeeded)}, Disponível: ${ethers.formatEther(balance)}`);
        process.exit(1);
    }

    console.log("✅ Saldos suficientes para distribuição!\n");
    console.log("=".repeat(80));
    console.log("🎁 INICIANDO DISTRIBUIÇÃO");
    console.log("=".repeat(80) + "\n");

    let successCount = 0;
    let errorCount = 0;

    console.log("📤 Modo SEQUENCIAL: 1 transação por vez (compatível com conta delegada/EIP-7702)\n");
    const allResults = [];

    // Processar endereços e transações de forma sequencial.
    // Contas delegadas (EIP-7702) só aceitam 1 transação pendente por vez,
    // então cada envio espera a confirmação antes do próximo.
    for (let i = 0; i < addresses.length; i++) {
        const recipient = addresses[i];
        const recipientNum = i + 1;
        const totalNum = addresses.length;

        try {
            console.log(`\n[${recipientNum}/${totalNum}] 📤 Enviando para: ${recipient}`);

            // Enviar ETH
            if (eth.ativo) {
                const tx = await deployer.sendTransaction({
                    to: recipient,
                    value: ethers.parseEther(amountEther)
                });
                console.log(`[${recipientNum}/${totalNum}] 💎 ETH enviado! Hash: ${tx.hash}`);
                await tx.wait();
            }

            // Enviar MPE1
            if (mpe1.ativo) {
                const tx = await mpe1Token.transfer(recipient, amountMPE1);
                console.log(`[${recipientNum}/${totalNum}] 🪙 MPE1 enviado! Hash: ${tx.hash}`);
                await tx.wait();
            }

            // Enviar MPE2
            if (mpe2.ativo) {
                const tx = await mpe2Token.transfer(recipient, amountMPE2);
                console.log(`[${recipientNum}/${totalNum}] 🪙 MPE2 enviado! Hash: ${tx.hash}`);
                await tx.wait();
            }

            console.log(`[${recipientNum}/${totalNum}] ✅ Completo!`);
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
    console.log(`   💎 ETH: ${eth.ativo  ? parseFloat(amountEther) * successCount : "— (desativado)"}`);
    console.log(`   🪙 MPE1: ${mpe1.ativo ? parseInt(amountMPE1) * successCount  : "— (desativado)"}`);
    console.log(`   🪙 MPE2: ${mpe2.ativo ? parseInt(amountMPE2) * successCount  : "— (desativado)"}`);
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
