require('dotenv').config();
const { ethers } = require('hardhat');
const deploymentData = require('../frontend/deployment.json');

async function main() {
    console.log('🚀 Iniciando transferências de tokens na rede Sepolia...\n');

    // Configurar provider e wallet
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(`📝 Endereço do remetente: ${wallet.address}`);
    console.log(`🌐 Rede: ${deploymentData.network}\n`);

    // Endereços dos tokens
    const mpe1Address = deploymentData.contracts.mpe1Token.address;
    const mpe2Address = deploymentData.contracts.mpe2Token.address;

    // ABI simplificado do token
    const tokenABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
    ];

    // Conectar aos contratos
    const mpe1Token = new ethers.Contract(mpe1Address, tokenABI, wallet);
    const mpe2Token = new ethers.Contract(mpe2Address, tokenABI, wallet);

    // Verificar saldos iniciais
    const mpe1Balance = await mpe1Token.balanceOf(wallet.address);
    const mpe2Balance = await mpe2Token.balanceOf(wallet.address);

    console.log(`💰 Saldo MPE1: ${mpe1Balance.toString()}`);
    console.log(`💰 Saldo MPE2: ${mpe2Balance.toString()}\n`);

    // Destinatários MPE1
    const mpe1Recipients = [
        '0x3B2d68c9f56Ecc7809c90530A42183052F48CEf2',
        '0xe83E42c3D03D1936C2b8814809E4b837dc4990f0',
        '0xE9D71C4660FB13ad625d8fCB65e00C659E11eeb0',
        '0x00c332EF1033f20c32c5adDc74dDA2c133BaA10C'
    ];

    // Destinatários MPE2
    const mpe2Recipients = [
        '0xc586cbdD2fa9fC7499A4B3872B0862FB45Db2422',
        '0x96f9672599272C43865338214a276b0D5E217971',
        '0x1D43Bdb2Ad5667DC9923E0845C4E7E1636F20Ea1',
        '0x00660aC0820453f1dDafE25f26a25F1CD7718a02'
    ];

    const amountToTransfer = 100; // 100 tokens (sem decimais)

    // Transferir MPE1
    console.log('📤 Transferindo MPE1...');
    for (const recipient of mpe1Recipients) {
        try {
            const tx = await mpe1Token.transfer(recipient, amountToTransfer);
            console.log(`   ✓ Enviando 100 MPE1 para ${recipient}`);
            console.log(`     TX: ${tx.hash}`);
            await tx.wait();
            console.log(`     ✓ Confirmado!\n`);
        } catch (error) {
            console.error(`   ✗ Erro ao transferir para ${recipient}:`, error.message);
        }
    }

    // Transferir MPE2
    console.log('📤 Transferindo MPE2...');
    for (const recipient of mpe2Recipients) {
        try {
            const tx = await mpe2Token.transfer(recipient, amountToTransfer);
            console.log(`   ✓ Enviando 100 MPE2 para ${recipient}`);
            console.log(`     TX: ${tx.hash}`);
            await tx.wait();
            console.log(`     ✓ Confirmado!\n`);
        } catch (error) {
            console.error(`   ✗ Erro ao transferir para ${recipient}:`, error.message);
        }
    }

    // Verificar saldos finais
    const mpe1BalanceFinal = await mpe1Token.balanceOf(wallet.address);
    const mpe2BalanceFinal = await mpe2Token.balanceOf(wallet.address);

    console.log('✅ Transferências concluídas!');
    console.log(`\n💰 Saldo final MPE1: ${mpe1BalanceFinal.toString()}`);
    console.log(`💰 Saldo final MPE2: ${mpe2BalanceFinal.toString()}`);
    console.log(`\n📊 Total transferido:`);
    console.log(`   MPE1: ${mpe1Recipients.length * amountToTransfer} tokens`);
    console.log(`   MPE2: ${mpe2Recipients.length * amountToTransfer} tokens`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
