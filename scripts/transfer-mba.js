const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Transfere MBA1 e MBA2 para todos os endereços de recipient-addresses.txt.
// Quantidade por endereço (em tokens inteiros, após as casas decimais):
// variável de ambiente AMOUNT (padrão 1000).
// Ex.: AMOUNT=500 npx hardhat run scripts/transfer-mba.js --network sepolia
async function main() {
    const AMOUNT = process.env.AMOUNT || "1000";

    // --- Endereços destinatários ---
    const addressesFilePath = path.join(__dirname, "..", "recipient-addresses.txt");
    if (!fs.existsSync(addressesFilePath)) {
        console.error("❌ Arquivo recipient-addresses.txt não encontrado!");
        process.exit(1);
    }
    const recipients = fs.readFileSync(addressesFilePath, "utf-8")
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("#"))
        .filter(l => ethers.isAddress(l));

    if (recipients.length === 0) {
        console.error("❌ Nenhum endereço válido em recipient-addresses.txt");
        process.exit(1);
    }

    // --- Contratos ---
    const deploymentPath = path.join(__dirname, "..", "mba-deployment.json");
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    const MBAToken = await ethers.getContractFactory("MBAToken");
    const tokens = [
        { label: "MBA1", contract: MBAToken.attach(deployment.contracts.mba1Token.address), address: deployment.contracts.mba1Token.address },
        { label: "MBA2", contract: MBAToken.attach(deployment.contracts.mba2Token.address), address: deployment.contracts.mba2Token.address },
    ];

    const [sender] = await ethers.getSigners();
    console.log("📝 Remetente:", sender.address);
    console.log(`📋 ${recipients.length} destinatário(s)`);
    console.log(`🔢 Quantidade por endereço: ${AMOUNT} de cada token\n`);

    for (const t of tokens) {
        const decimals = await t.contract.decimals();
        const amount = ethers.parseUnits(AMOUNT, decimals);
        const total = amount * BigInt(recipients.length);
        const balance = await t.contract.balanceOf(sender.address);

        console.log(`🪙 ${t.label} (${t.address}) — ${Number(decimals)} decimais`);
        console.log(`   Saldo: ${ethers.formatUnits(balance, decimals)} | Necessário: ${ethers.formatUnits(total, decimals)}`);
        if (balance < total) {
            console.error(`   ❌ Saldo insuficiente de ${t.label}. Abortando.`);
            process.exit(1);
        }

        for (let i = 0; i < recipients.length; i++) {
            const to = recipients[i];
            const tx = await t.contract.transfer(to, amount);
            console.log(`   [${i + 1}/${recipients.length}] ${to} -> tx ${tx.hash}`);
            await tx.wait();
        }
        console.log(`   ✅ ${t.label} concluído.\n`);
    }

    console.log("🎉 Todas as transferências de MBA1/MBA2 concluídas!");
}

main().then(() => process.exit(0)).catch((e) => { console.error("❌ Falha:", e); process.exit(1); });
