const { ethers } = require("hardhat");

async function main() {
    const addrs = {
        MBA1: "0xde27C48EF877B5b1d43d20d6624BC1A3b1D756D3",
        MBA2: "0x636Fe02aD6bD98F2507C7110A600c09C7E888176"
    };
    const MBAToken = await ethers.getContractFactory("MBAToken");
    for (const [label, addr] of Object.entries(addrs)) {
        const t = MBAToken.attach(addr);
        const [name, symbol, decimals, supply] = await Promise.all([
            t.name(), t.symbol(), t.decimals(), t.totalSupply()
        ]);
        console.log(`${label} @ ${addr}`);
        console.log(`  nome=${name} símbolo=${symbol} decimais=${decimals}`);
        console.log(`  totalSupply=${supply} (${ethers.formatUnits(supply, decimals)} tokens)`);
    }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
