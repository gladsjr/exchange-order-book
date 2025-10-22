# 🎓 Guia para Estudantes - Exchange Descentralizada MPE

## 📖 Visão Geral

Esta exchange implementa conceitos fundamentais de DeFi:
- **Tokens ERC-20**: Ativos digitais padronizados
- **Order Book**: Sistema de ordens limitadas
- **Smart Contracts**: Lógica automatizada na blockchain
- **DApp Frontend**: Interface descentralizada

## 🛠️ Setup Completo

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) v16+
- [MetaMask](https://metamask.io/) instalado no navegador
- Conta na Sepolia com ETH de teste ([faucet](https://sepoliafaucet.com/))

### 2. Instalação
```bash
# Clonar/baixar o projeto
cd exchange-order-book

# Instalar dependências  
npm install

# Copiar arquivo de configuração
cp .env.example .env
```

### 3. Configurar .env
```bash
# Abrir .env e configurar:
PRIVATE_KEY=sua_chave_privada_metamask
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/sua_chave_infura
ETHERSCAN_API_KEY=sua_chave_etherscan
```

**⚠️ IMPORTANTE**: Nunca compartilhe sua chave privada real!

## 🚀 Deploy dos Contratos

### Deploy na Sepolia
```bash
npm run deploy
```

Este comando irá:
1. ✅ Implantar MPE1 Token (1 milhão de tokens)
2. ✅ Implantar MPE2 Token (1 milhão de tokens)  
3. ✅ Implantar Exchange configurada para esses tokens
4. ✅ Gerar `frontend/deployment.json` com endereços
5. ✅ Exibir links do Etherscan

### Teste Local (Opcional)
```bash
# Para testar sem gastar ETH real
npm run test:local
```

## 🌐 Usando a Interface Web

### 1. Abrir a Interface
- Abrir `frontend/index.html` no navegador
- Ou usar um servidor local: `python -m http.server 8000`

### 2. Conectar MetaMask
- Certificar que está na rede Sepolia
- Clicar em "Conectar MetaMask"
- Aprovar conexão

### 3. Adicionar Tokens no MetaMask
- Abrir MetaMask → "Importar Tokens"
- Usar endereços do MPE1 e MPE2 (do terminal após deploy)
- Agora você verá seus saldos de tokens

### 4. Criar Primeira Ordem
- **Ordem de Venda**: "Vender 100 MPE1 por 200 MPE2"
  - Tipo: Venda
  - Quantidade MPE1: 100
  - Quantidade MPE2: 200
  - Preço: 2.0 MPE2 por MPE1
  
- **Ordem de Compra**: "Comprar 50 MPE1 com 150 MPE2"
  - Tipo: Compra  
  - Quantidade MPE1: 50
  - Quantidade MPE2: 150
  - Preço: 3.0 MPE2 por MPE1

## 🧪 Experimentos Didáticos

### Experimento 1: Matching de Ordens
1. Criar ordem de venda: 100 MPE1 por 200 MPE2 (preço = 2.0)
2. Criar ordem de compra: 50 MPE1 por 150 MPE2 (preço = 3.0)
3. **Resultado**: Match parcial - 50 MPE1 negociados por 100 MPE2

### Experimento 2: Order Book Dinâmico
1. Criar várias ordens com preços diferentes
2. Observar como se organizam no order book
3. Ver como novas ordens fazem match automaticamente

### Experimento 3: Cancelamento
1. Criar ordem
2. Cancelar antes do match
3. Verificar que tokens são devolvidos

## 🔍 Conceitos Técnicos

### Smart Contracts

#### SimpleToken.sol
```solidity
// Características principais:
- ERC-20 padrão
- Sem decimais (números inteiros)
- Funções mint/burn para owner
- Supply inicial configurável
```

#### OrderBookExchange.sol
```solidity
// Funcionalidades:
- Ordens limitadas (não de mercado)
- Matching automático por preço
- Proteção contra reentrância
- Cancelamento de ordens próprias
```

### Algoritmo de Matching
1. **Nova ordem de compra**: Procura ordens de venda compatíveis
2. **Compatibilidade**: `preço_compra >= preço_venda`
3. **Execução**: Menor quantidade entre as ordens
4. **Preço**: Sempre o da ordem mais antiga (FIFO)

### Segurança
- **ReentrancyGuard**: Previne ataques de reentrância
- **Allowances**: Usuário deve aprovar tokens antes
- **Validações**: Verificação de saldos e quantidades

## 📚 Exercícios Propostos

### Nível Básico
1. **Deploy Local**: Execute o deploy na rede local do Hardhat
2. **Primeira Transação**: Crie sua primeira ordem na interface
3. **Match Manual**: Crie duas ordens que fazem match entre si

### Nível Intermediário
1. **Análise de Gas**: Compare custos de diferentes tipos de transação
2. **Order Book Analysis**: Analise como diferentes preços afetam o matching
3. **Token Economics**: Calcule slippage em diferentes cenários

### Nível Avançado
1. **Modificar Contratos**: Adicione taxa de transação (0.1%)
2. **Ordens de Mercado**: Implemente ordens que executam ao preço atual
3. **Histórico**: Adicione evento de trade executado

## 🚨 Limitações e Melhorias

### Limitações Atuais
- ❌ Apenas ordens limitadas
- ❌ Sem agregação de liquidez
- ❌ Sem taxas de transação
- ❌ Interface básica

### Possíveis Melhorias
- ✅ Ordens de mercado
- ✅ Sistema de taxas
- ✅ Agregação de preços
- ✅ Gráficos de preço
- ✅ API para bots de trading

## 🔗 Recursos Adicionais

### Documentação
- [Ethereum.org](https://ethereum.org/developers/)
- [OpenZeppelin](https://docs.openzeppelin.com/)
- [Hardhat](https://hardhat.org/docs)

### Ferramentas
- [Etherscan](https://sepolia.etherscan.io/) - Explorador da blockchain
- [Remix](https://remix.ethereum.org/) - IDE online para Solidity
- [MetaMask](https://metamask.io/) - Carteira digital

### Conceitos Avançados
- **AMM (Automated Market Makers)**: Uniswap, SushiSwap
- **Yield Farming**: Staking para recompensas
- **Flash Loans**: Empréstimos instantâneos
- **MEV**: Valor extraível por mineradores

## ❓ FAQ

**Q: Posso usar tokens reais?**
A: Este é um projeto didático. Para produção, seria necessária auditoria completa.

**Q: Como obter ETH de teste?**
A: Use faucets como [sepoliafaucet.com](https://sepoliafaucet.com/)

**Q: Contratos são verificados?**
A: Sim, o script pode verificar automaticamente no Etherscan.

**Q: Posso modificar os contratos?**
A: Sim! É encorajado para aprendizado. Faça deploy em nova versão.

## 🎯 Objetivos de Aprendizado

Ao final deste projeto, você deve entender:

1. ✅ Como funcionam tokens ERC-20
2. ✅ Conceito de order books vs AMMs
3. ✅ Desenvolvimento de smart contracts seguros
4. ✅ Integração frontend com blockchain
5. ✅ Economia de tokens e DeFi
6. ✅ Ferramentas do ecossistema Ethereum

## 📞 Suporte

Para dúvidas técnicas:
1. Verifique logs no console do navegador
2. Confirme configuração da rede no MetaMask
3. Verifique saldo de ETH para gas
4. Consulte documentação dos erros

**Boa sorte e bons estudos! 🚀**