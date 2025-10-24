// Configuração global
let provider = null;
let signer = null;
let contracts = {};
let deploymentInfo = {};
let userAddress = null;

// Função helper para formatar números com vírgula como separador decimal
function formatNumber(value, decimals = 4) {
    const num = typeof value === 'number' ? value : Number(value);
    return num.toFixed(decimals).replace('.', ',');
}

// Elementos DOM
const connectWalletBtn = document.getElementById('connect-wallet');
const disconnectWalletBtn = document.getElementById('disconnect-wallet');
const walletInfo = document.getElementById('wallet-info');
const walletAddress = document.getElementById('wallet-address');
const mpe1Balance = document.getElementById('mpe1-balance');
const mpe2Balance = document.getElementById('mpe2-balance');
const refreshBalancesBtn = document.getElementById('refresh-balances');
const createOrderBtn = document.getElementById('create-order');
const refreshOrderbookBtn = document.getElementById('refresh-orderbook');
const loadingOverlay = document.getElementById('loading-overlay');
const transactionLogs = document.getElementById('transaction-logs');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await loadDeploymentInfo();
    setupEventListeners();

    // Verificar se MetaMask já está conectado
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectWallet();
        }
    }
});

// Carregar informações de deployment
async function loadDeploymentInfo() {
    try {
        const response = await fetch('./deployment.json');
        deploymentInfo = await response.json();

        if (!deploymentInfo.contracts) {
            throw new Error('Informações de deployment não encontradas');
        }

        addLog('✅ Configuração carregada com sucesso', 'log-success');
    } catch (error) {
        addLog('❌ Erro ao carregar configuração: ' + error.message, 'log-error');
        addLog('📄 Execute o script de deploy primeiro: npm run deploy', 'log-info');
    }
}

// Setup de event listeners
function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
    refreshBalancesBtn.addEventListener('click', refreshBalances);
    createOrderBtn.addEventListener('click', createOrder);
    refreshOrderbookBtn.addEventListener('click', refreshOrderbook);

    // Calcular preço automaticamente
    document.getElementById('amount-mpe1').addEventListener('input', calculatePrice);
    document.getElementById('amount-mpe2').addEventListener('input', calculatePrice);

    // Detectar mudanças de conta no MetaMask
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

// Converte chainId decimal para hex string (0x...)
function toChainIdHex(chainIdDecimal) {
    return '0x' + Number(chainIdDecimal).toString(16);
}

// Garante que a carteira esteja na rede do deployment.json (auto switch / add)
async function ensureCorrectNetwork() {
    if (!window.ethereum || !deploymentInfo || !deploymentInfo.chainId) return;

    const targetChainIdDec = Number(deploymentInfo.chainId);
    const targetChainIdHex = toChainIdHex(targetChainIdDec);

    try {
        const currentChainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainIdHex?.toLowerCase() === targetChainIdHex.toLowerCase()) {
            return; // já está na rede correta
        }

        addLog(`ℹ️ Trocando rede para ${deploymentInfo.network} (chainId ${targetChainIdDec})...`, 'log-info');
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainIdHex }]
        });
    } catch (switchError) {
        // 4902 = chain não adicionada na carteira
        if (switchError && switchError.code === 4902) {
            let addParams;
            if (targetChainIdDec === 11155111) {
                addParams = {
                    chainId: '0xaa36a7',
                    chainName: 'Sepolia',
                    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                };
            } else if (targetChainIdDec === 1337) {
                addParams = {
                    chainId: '0x539',
                    chainName: 'Hardhat Local',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['http://127.0.0.1:8545'],
                    blockExplorerUrls: []
                };
            }

            if (addParams) {
                try {
                    addLog('➕ Adicionando rede à carteira...', 'log-info');
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [addParams]
                    });
                } catch (addErr) {
                    addLog('❌ Não foi possível adicionar a rede na MetaMask: ' + (addErr?.message || addErr), 'log-error');
                    throw addErr;
                }
            }
        } else {
            addLog('❌ Erro ao trocar de rede: ' + (switchError?.message || switchError), 'log-error');
            throw switchError;
        }
    }
}

// Conectar carteira
async function connectWallet() {
    try {
        if (!window.ethereum) {
            throw new Error('MetaMask não encontrado. Instale a extensão MetaMask.');
        }
        if (typeof window.ethers === 'undefined') {
            addLog('❌ ethers.js não carregou. Verifique sua conexão de internet e atualize a página (Ctrl+F5).', 'log-error');
            return;
        }

        // Solicitar acesso às contas
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Garantir rede correta (auto switch se necessário)
        await ensureCorrectNetwork();

        // Recriar provider/signer após possível troca de rede
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Inicializar contratos
        await initializeContracts();

        // Atualizar UI
        updateConnectionStatus(true);
        await refreshBalances();
        await refreshOrderbook();

        addLog(`🔗 Carteira conectada: ${userAddress}`, 'log-success');

    } catch (error) {
        addLog('❌ Erro ao conectar carteira: ' + error.message, 'log-error');
        console.error('Erro de conexão:', error);
    }
}

// Desconectar carteira
function disconnectWallet() {
    provider = null;
    signer = null;
    contracts = {};
    userAddress = null;

    updateConnectionStatus(false);
    clearBalances();
    clearOrderbook();

    addLog('🔌 Carteira desconectada', 'log-info');
}

// Inicializar contratos
async function initializeContracts() {
    if (!deploymentInfo.contracts || !deploymentInfo.abis) {
        throw new Error('Informações de deployment incompletas');
    }

    // Inicializar tokens
    contracts.mpe1Token = new ethers.Contract(
        deploymentInfo.contracts.mpe1Token.address,
        deploymentInfo.abis.SimpleToken,
        signer
    );

    contracts.mpe2Token = new ethers.Contract(
        deploymentInfo.contracts.mpe2Token.address,
        deploymentInfo.abis.SimpleToken,
        signer
    );

    // Inicializar exchange
    contracts.exchange = new ethers.Contract(
        deploymentInfo.contracts.exchange.address,
        deploymentInfo.abis.OrderBookExchange,
        signer
    );
}

// Atualizar status de conexão
function updateConnectionStatus(isConnected) {
    if (isConnected) {
        connectWalletBtn.style.display = 'none';
        walletInfo.style.display = 'flex';
        walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    } else {
        connectWalletBtn.style.display = 'block';
        walletInfo.style.display = 'none';
    }
}

// Atualizar saldos
async function refreshBalances() {
    if (!signer || !contracts.mpe1Token || !contracts.mpe2Token) return;

    try {
        const [balance1, balance2] = await Promise.all([
            contracts.mpe1Token.balanceOf(userAddress),
            contracts.mpe2Token.balanceOf(userAddress)
        ]);

        mpe1Balance.textContent = balance1.toString();
        mpe2Balance.textContent = balance2.toString();

    } catch (error) {
        addLog('❌ Erro ao atualizar saldos: ' + error.message, 'log-error');
    }
}

// Limpar saldos
function clearBalances() {
    mpe1Balance.textContent = '0';
    mpe2Balance.textContent = '0';
}

// Calcular preço
function calculatePrice() {
    const amountMpe1 = parseFloat(document.getElementById('amount-mpe1').value) || 0;
    const amountMpe2 = parseFloat(document.getElementById('amount-mpe2').value) || 0;

    const priceElement = document.getElementById('calculated-price');

    if (amountMpe1 > 0 && amountMpe2 > 0) {
        const price = amountMpe2 / amountMpe1;
        priceElement.textContent = formatNumber(price, 4);
    } else {
        priceElement.textContent = '-';
    }
}

// Criar oferta
async function createOrder() {
    if (!signer || !contracts.exchange) {
        addLog('❌ Conecte sua carteira primeiro', 'log-error');
        return;
    }

    try {
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const amountMpe1 = document.getElementById('amount-mpe1').value;
        const amountMpe2 = document.getElementById('amount-mpe2').value;

        if (!amountMpe1 || !amountMpe2 || amountMpe1 <= 0 || amountMpe2 <= 0) {
            throw new Error('Insira quantidades válidas');
        }

        showLoading(true);

        let tx;

        if (orderType === 'buy') {
            // Oferta de COMPRA = oferece MPE2 por MPE1 (createOfferB)
            // Verificar allowance para MPE2
            const allowance = await contracts.mpe2Token.allowance(userAddress, contracts.exchange.address);
            if (allowance.lt(amountMpe2)) {
                addLog('🔄 Aprovando MPE2 para a exchange...', 'log-info');
                const approveTx = await contracts.mpe2Token.approve(contracts.exchange.address, amountMpe2);
                await approveTx.wait();
                addLog('✅ MPE2 aprovado', 'log-success');
            }

            addLog('🔄 Criando oferta de compra (oferece MPE2 por MPE1)...', 'log-info');
            tx = await contracts.exchange.createOfferB(amountMpe2, amountMpe1);

        } else {
            // Oferta de VENDA = oferece MPE1 por MPE2 (createOfferA)
            // Verificar allowance para MPE1
            const allowance = await contracts.mpe1Token.allowance(userAddress, contracts.exchange.address);
            if (allowance.lt(amountMpe1)) {
                addLog('🔄 Aprovando MPE1 para a exchange...', 'log-info');
                const approveTx = await contracts.mpe1Token.approve(contracts.exchange.address, amountMpe1);
                await approveTx.wait();
                addLog('✅ MPE1 aprovado', 'log-success');
            }

            addLog('🔄 Criando oferta de venda (oferece MPE1 por MPE2)...', 'log-info');
            tx = await contracts.exchange.createOfferA(amountMpe1, amountMpe2);
        }

        const receipt = await tx.wait();
        addLog(`✅ Oferta criada! Hash: ${receipt.transactionHash}`, 'log-success');

        // Limpar formulário
        document.getElementById('amount-mpe1').value = '';
        document.getElementById('amount-mpe2').value = '';
        calculatePrice();

        // Atualizar dados
        await refreshBalances();
        await refreshOrderbook();

    } catch (error) {
        addLog('❌ Erro ao criar oferta: ' + error.message, 'log-error');
        console.error('Erro:', error);
    } finally {
        showLoading(false);
    }
}

// Cancelar oferta
async function cancelOffer(offerId) {
    if (!signer || !contracts.exchange) return;

    try {
        showLoading(true);
        addLog(`🔄 Cancelando oferta ${offerId}...`, 'log-info');

        const tx = await contracts.exchange.cancelOffer(offerId);
        const receipt = await tx.wait();

        addLog(`✅ Oferta ${offerId} cancelada! Hash: ${receipt.transactionHash}`, 'log-success');

        await refreshBalances();
        await refreshOrderbook();

    } catch (error) {
        addLog('❌ Erro ao cancelar oferta: ' + error.message, 'log-error');
        console.error('Erro:', error);
    } finally {
        showLoading(false);
    }
}

// Aceitar oferta
async function acceptOffer(offerId, isOfferA) {
    if (!signer || !contracts.exchange) return;

    try {
        showLoading(true);
        addLog(`🔄 Aceitando oferta ${offerId}...`, 'log-info');

        // Obter informações da oferta
        const offerData = await contracts.exchange.getOffer(offerId);

        // Converter array para objeto
        const offer = {
            id: offerData[0],
            creator: offerData[1],
            isOfferA: offerData[2],
            amountOffered: offerData[3],
            amountWanted: offerData[4],
            isActive: offerData[5]
        };

        // Aprovar o token necessário
        if (isOfferA) {
            // Oferta A: criador oferece MPE1, aceitador precisa ter MPE2
            const allowance = await contracts.mpe2Token.allowance(userAddress, contracts.exchange.address);
            if (allowance.lt(offer.amountWanted)) {
                addLog('🔄 Aprovando MPE2 para a exchange...', 'log-info');
                const approveTx = await contracts.mpe2Token.approve(contracts.exchange.address, offer.amountWanted);
                await approveTx.wait();
                addLog('✅ MPE2 aprovado', 'log-success');
            }
        } else {
            // Oferta B: criador oferece MPE2, aceitador precisa ter MPE1
            const allowance = await contracts.mpe1Token.allowance(userAddress, contracts.exchange.address);
            if (allowance.lt(offer.amountWanted)) {
                addLog('🔄 Aprovando MPE1 para a exchange...', 'log-info');
                const approveTx = await contracts.mpe1Token.approve(contracts.exchange.address, offer.amountWanted);
                await approveTx.wait();
                addLog('✅ MPE1 aprovado', 'log-success');
            }
        }

        const tx = await contracts.exchange.acceptOffer(offerId);
        const receipt = await tx.wait();

        addLog(`✅ Oferta ${offerId} aceita! Hash: ${receipt.transactionHash}`, 'log-success');

        await refreshBalances();
        await refreshOrderbook();

    } catch (error) {
        addLog('❌ Erro ao aceitar oferta: ' + error.message, 'log-error');
        console.error('Erro:', error);
    } finally {
        showLoading(false);
    }
}

// Atualizar order book (agora ofertas)
async function refreshOrderbook() {
    if (!signer || !contracts.exchange) return;

    try {
        const [offersAIds, offersBIds] = await Promise.all([
            contracts.exchange.getActiveOffersA(),
            contracts.exchange.getActiveOffersB()
        ]);

        await displayOffers('buy-orders', offersBIds, false); // Ofertas B = MPE2→MPE1 (compra de MPE1)
        await displayOffers('sell-orders', offersAIds, true); // Ofertas A = MPE1→MPE2 (venda de MPE1)

    } catch (error) {
        addLog('❌ Erro ao atualizar ofertas: ' + error.message, 'log-error');
    }
}

// Exibir ofertas
async function displayOffers(containerId, offerIds, isOfferA) {
    const container = document.getElementById(containerId);

    if (offerIds.length === 0) {
        container.innerHTML = `<div class="no-orders">Nenhuma oferta disponível</div>`;
        return;
    }

    let html = '';

    for (const offerId of offerIds) {
        try {
            const offerData = await contracts.exchange.getOffer(offerId);

            // O contrato retorna struct como array:
            // [0]: id, [1]: creator, [2]: isOfferA, [3]: amountOffered, [4]: amountWanted, [5]: isActive
            const offer = {
                id: offerData[0],
                creator: offerData[1],
                isOfferA: offerData[2],
                amountOffered: offerData[3],
                amountWanted: offerData[4],
                isActive: offerData[5]
            };

            // Verificar se a oferta está ativa
            if (!offer.isActive) {
                console.log('Oferta inativa:', offerId.toString());
                continue;
            }

            // Para ofertas A (MPE1→MPE2): preço = amountWanted(MPE2) / amountOffered(MPE1)
            // Para ofertas B (MPE2→MPE1): preço = amountOffered(MPE2) / amountWanted(MPE1)
            let mpe1Amount, mpe2Amount, price;

            if (isOfferA) {
                // Oferta A: vende MPE1 por MPE2
                mpe1Amount = offer.amountOffered;
                mpe2Amount = offer.amountWanted;
                price = formatNumber(Number(mpe2Amount) / Number(mpe1Amount), 4);
            } else {
                // Oferta B: vende MPE2 por MPE1 (compra MPE1)
                mpe1Amount = offer.amountWanted;
                mpe2Amount = offer.amountOffered;
                price = formatNumber(Number(mpe2Amount) / Number(mpe1Amount), 4);
            }

            const isOwner = offer.creator.toLowerCase() === userAddress.toLowerCase();

            html += `
                <div class="order-item">
                    <span>${mpe1Amount.toString()}</span>
                    <span>${mpe2Amount.toString()}</span>
                    <span>${price}</span>
                    <span>
                        ${isOwner ?
                    `<button class="cancel-btn" onclick="cancelOffer(${offerId})">Cancelar</button>` :
                    `<button class="accept-btn" onclick="acceptOffer(${offerId}, ${isOfferA})">Aceitar</button>`
                }
                    </span>
                </div>
            `;
        } catch (error) {
            console.error(`Erro ao carregar oferta ${offerId}:`, error);
        }
    }

    container.innerHTML = html;
}

// Limpar order book
function clearOrderbook() {
    document.getElementById('buy-orders').innerHTML = '<div class="no-orders">Nenhuma oferta disponível</div>';
    document.getElementById('sell-orders').innerHTML = '<div class="no-orders">Nenhuma oferta disponível</div>';
}

// Mostrar/ocultar loading
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Adicionar log
function addLog(message, className = '') {
    const logItem = document.createElement('div');
    logItem.className = `log-item ${className}`;
    logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    transactionLogs.insertBefore(logItem, transactionLogs.firstChild);

    // Manter apenas os últimos 50 logs
    while (transactionLogs.children.length > 50) {
        transactionLogs.removeChild(transactionLogs.lastChild);
    }
}

// Handlers de eventos do MetaMask
async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
        addLog('🔌 MetaMask desconectado', 'log-info');
    } else {
        await connectWallet();
    }
}

function handleChainChanged(chainId) {
    // Recarregar a página quando a rede muda
    window.location.reload();
}