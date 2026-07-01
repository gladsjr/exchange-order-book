const { ethers } = require("hardhat");

async function main() {
    const recipients = [
        "0x56e9e6566454Ccc369cD5606C32eB2CdAd0e09AC",
        "0x6F17DA82C51df2dE224CA858F02847486f00F106"
    ];

    const amount = ethers.parseEther("0.01");

    const [sender] = await ethers.getSigners();
    console.log("📝 Remetente:", sender.address);
    console.log("💰 Saldo inicial:", ethers.formatEther(await sender.provider.getBalance(sender.address)), "ETH");
    console.log(`📤 Enviando 0.01 ETH para ${recipients.length} carteiras (total: ${ethers.formatEther(amount * BigInt(recipients.length))} ETH)\n`);

    for (const to of recipients) {
        const tx = await sender.sendTransaction({ to, value: amount });
        console.log(`⏳ ${to} -> tx ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ ${to} confirmada no bloco ${receipt.blockNumber}`);
    }

    console.log("\n💰 Saldo final:", ethers.formatEther(await sender.provider.getBalance(sender.address)), "ETH");
    console.log("🎉 Todas as transferências concluídas!");
}

main().then(() => process.exit(0)).catch((e) => { console.error("❌ Falha:", e); process.exit(1); });
