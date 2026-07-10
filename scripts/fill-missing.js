const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Preenche os tokens ERC-20 que faltam aos endereços pendentes do Trabalho 2.
//
// Situação verificada on-chain em 09/07/2026:
//   0x92ba9776c15df95AdC429d2F9FF67886cBEf5Dd1  -> falta MPE1 e MPE2
//   0x067457F7CB87471612b652fc578F3D78a71F8ceF  -> falta MPE1, MPE2, MBA1 e MBA2
//   (ambos já possuem o NFT; os demais 13 endereços estão completos.)
//
// O script:
//   - envia só o que falta, para cada endereço;
//   - PULA automaticamente o token se o destinatário já tiver saldo > 0
//     (idempotente: pode rodar de novo sem enviar em dobro);
//   - checa o saldo do remetente antes de cada envio.
//
// Quantidades (ajustáveis por variável de ambiente):
//   MPE_AMOUNT (padrão 100)   MBA_AMOUNT (padrão 10000)
//
// Uso:
//   npx hardhat run scripts/fill-missing.js --network sepolia
//   MPE_AMOUNT=150 MBA_AMOUNT=10000 npx hardhat run scripts/fill-missing.js --network sepolia
// ---------------------------------------------------------------------------

const MPE_AMOUNT = process.env.MPE_AMOUNT || "100";
const MBA_AMOUNT = process.env.MBA_AMOUNT || "10000";

const PLAN = [
    { address: "0x92ba9776c15df95AdC429d2F9FF67886cBEf5Dd1", tokens: ["MPE1", "MPE2"] },
    { address: "0x067457F7CB87471612b652fc578F3D78a71F8ceF", tokens: ["MPE1", "MPE2", "MBA1", "MBA2"] },
];

async function main() {
    const mpeDep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "frontend", "deployment.json"), "utf-8"));
    const mbaDep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "mba-deployment.json"), "utf-8"));

    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    const MBAToken = await ethers.getContractFactory("MBAToken");

    const tokens = {
        MPE1: { contract: SimpleToken.attach(mpeDep.contracts.mpe1Token.address), amount: MPE_AMOUNT, address: mpeDep.contracts.mpe1Token.address },
        MPE2: { contract: SimpleToken.attach(mpeDep.contracts.mpe2Token.address), amount: MPE_AMOUNT, address: mpeDep.contracts.mpe2Token.address },
        MBA1: { contract: MBAToken.attach(mbaDep.contracts.mba1Token.address), amount: MBA_AMOUNT, address: mbaDep.contracts.mba1Token.address },
        MBA2: { contract: MBAToken.attach(mbaDep.contracts.mba2Token.address), amount: MBA_AMOUNT, address: mbaDep.contracts.mba2Token.address },
    };

    const [sender] = await ethers.getSigners();
    console.log("📝 Remetente:", sender.address);
    console.log(`🔢 Quantidades: MPE = ${MPE_AMOUNT} | MBA = ${MBA_AMOUNT} por endereço\n`);

    let sent = 0, skipped = 0, failed = 0;

    for (const target of PLAN) {
        console.log(`👤 ${target.address}`);
        for (const label of target.tokens) {
            const t = tokens[label];
            const decimals = await t.contract.decimals();
            const amount = ethers.parseUnits(t.amount, decimals);

            // idempotência: não reenvia se já houver saldo
            const current = await t.contract.balanceOf(target.address);
            if (current > 0n) {
                console.log(`   ⏭️  ${label}: já possui ${ethers.formatUnits(current, decimals)} — pulando.`);
                skipped++;
                continue;
            }

            const bal = await t.contract.balanceOf(sender.address);
            if (bal < amount) {
                console.error(`   ❌ ${label}: saldo insuficiente no remetente (${ethers.formatUnits(bal, decimals)} < ${t.amount}).`);
                failed++;
                continue;
            }

            const tx = await t.contract.transfer(target.address, amount);
            console.log(`   📤 ${label}: ${t.amount} -> tx ${tx.hash}`);
            await tx.wait();
            console.log(`   ✅ ${label} confirmado.`);
            sent++;
        }
        console.log("");
    }

    console.log("================ RESUMO ================");
    console.log(`✅ Enviados: ${sent}  |  ⏭️  Pulados: ${skipped}  |  ❌ Falhas: ${failed}`);
    if (failed === 0) console.log("🎉 Preenchimento concluído.");
}

main().then(() => process.exit(0)).catch((e) => { console.error("❌ Falha:", e); process.exit(1); });
