# Exchange Descentralizada Didática - MPE

Este é um projeto didático que implementa uma exchange descentralizada simples com order book para demonstrar conceitos de DeFi na blockchain Ethereum.

## 📋 Componentes do Projeto

### Smart Contracts
- **SimpleToken.sol**: Token ERC-20 configurável sem casas decimais
- **OrderBookExchange.sol**: Exchange com order book simplificado

### Frontend
- **index.html**: Interface web responsiva
- **styles.css**: Estilização moderna e responsiva  
- **app.js**: Integração com MetaMask e contratos

### Scripts
- **deploy.js**: Deploy automatizado dos contratos

## 🚀 Como Usar

### 1. Instalação
```bash
npm install
```

### 2. Configuração
1. Copie `.env.example` para `.env`
2. Configure suas chaves no arquivo `.env`:
   - `PRIVATE_KEY`: Sua chave privada
   - `SEPOLIA_RPC_URL`: URL do nó Sepolia (Infura/Alchemy)
   - `ETHERSCAN_API_KEY`: Para verificação de contratos

### 3. Deploy na Sepolia
```bash
npm run deploy
```

O script irá:
- Implantar dois tokens (MPE1 e MPE2) 
- Implantar a exchange configurada para esses tokens
- Gerar arquivo `frontend/deployment.json` com os endereços

### 4. Usar a Interface
1. Abra `frontend/index.html` no navegador
2. Conecte o MetaMask à rede Sepolia
3. Importe os tokens MPE1 e MPE2 no MetaMask
4. Comece a negociar!

## 🎯 Funcionalidades

### Tokens (MPE1 e MPE2)
- ✅ ERC-20 padrão sem decimais (para simplicidade)
- ✅ Supply inicial de 1.000.000 tokens cada
- ✅ Funções de mint/burn para o owner

### Exchange
- ✅ Order book com ordens de compra e venda
- ✅ Matching automático de ordens
- ✅ Cancelamento de ordens próprias
- ✅ Proteção contra reentrância
- ✅ Interface web completa

### Interface Web
- ✅ Conexão com MetaMask
- ✅ Visualização de saldos
- ✅ Criação de ordens (compra/venda)
- ✅ Visualização do order book
- ✅ Cancelamento de ordens
- ✅ Log de transações
- ✅ Design responsivo

## 📚 Conceitos Didáticos Demonstrados

1. **Tokens ERC-20**:
   - Padrão de tokens fungíveis
   - Allowances e transferências
   - Mint e burn de tokens

2. **DeFi e Order Books**:
   - Ordens limitadas (limit orders)
   - Matching de ordens
   - Gerenciamento de liquidez

3. **Segurança**:
   - Proteção contra reentrância
   - Verificações de saldo e allowance
   - Validação de entrada

4. **Frontend DApp**:
   - Integração com MetaMask
   - Assinatura de transações
   - Interação com contratos

## 🔧 Comandos Úteis

```bash
# Compilar contratos
npm run compile

# Deploy na Sepolia
npm run deploy

# Executar testes (se implementados)
npm run test
```

## 📝 Endereços dos Contratos

Após o deploy, os endereços serão salvos em `frontend/deployment.json` e exibidos no terminal.

## ⚠️ Importante

Este é um projeto **APENAS DIDÁTICO**. Não use em produção sem:
- Auditoria de segurança completa
- Testes extensivos
- Implementação de funcionalidades avançadas
- Otimizações de gas

## 🎓 Para Estudantes

### Exercícios Sugeridos:
1. Modifique o contrato para adicionar taxas de transação
2. Implemente ordens de mercado além das ordens limitadas
3. Adicione histórico de transações na interface
4. Crie um sistema de recompensas para market makers
5. Implemente um token de governança para a exchange

### Conceitos para Estudar:
- Automated Market Makers (AMM)
- Liquidity Pools
- Yield Farming
- Flash Loans
- MEV (Maximal Extractable Value)

## 📄 Licença

MIT License - Use livremente para fins educacionais!