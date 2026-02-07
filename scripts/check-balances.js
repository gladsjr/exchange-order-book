require('dotenv').config();
const { ethers } = require('hardhat');
const deploymentData = require('../frontend/deployment.json');

async function main() {
    console.log('🔍 Verificando saldos de tokens na rede Sepolia...\n');

    // Configurar provider
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

    // Endereços dos tokens
    const mpe1Address = deploymentData.contracts.mpe1Token.address;
    const mpe2Address = deploymentData.contracts.mpe2Token.address;

    // ABI simplificado do token
    const tokenABI = [
        "function balanceOf(address account) view returns (uint256)",
        "function symbol() view returns (string)"
    ];

    // Conectar aos contratos
    const mpe1Token = new ethers.Contract(mpe1Address, tokenABI, provider);
    const mpe2Token = new ethers.Contract(mpe2Address, tokenABI, provider);

    // Endereços que receberam MPE1
    const mpe1Recipients = [
        '0x3B2d68c9f56Ecc7809c90530A42183052F48CEf2',
        '0xe83E42c3D03D1936C2b8814809E4b837dc4990f0',
        '0xE9D71C4660FB13ad625d8fCB65e00C659E11eeb0',
        '0x00c332EF1033f20c32c5adDc74dDA2c133BaA10C'
    ];

    // Endereços que receberam MPE2
    const mpe2Recipients = [
        '0xc586cbdD2fa9fC7499A4B3872B0862FB45Db2422',
        '0x96f9672599272C43865338214a276b0D5E217971',
        '0x1D43Bdb2Ad5667DC9923E0845C4E7E1636F20Ea1',
        '0x00660aC0820453f1dDafE25f26a25F1CD7718a02'
    ];

    // Verificar saldos MPE1
    console.log('💎 SALDOS DE MPE1:');
    console.log('═'.repeat(70));
    for (const address of mpe1Recipients) {
        const balance = await mpe1Token.balanceOf(address);
        console.log(`${address}: ${balance.toString()} MPE1`);
    }

    console.log('\n💎 SALDOS DE MPE2:');
    console.log('═'.repeat(70));
    for (const address of mpe2Recipients) {
        const balance = await mpe2Token.balanceOf(address);
        console.log(`${address}: ${balance.toString()} MPE2`);
    }

    console.log('\n✅ Verificação concluída!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
