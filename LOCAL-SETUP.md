# 🏠 Rodando Localmente com Hardhat

## ✅ Sim! É totalmente possível rodar localmente

Você pode usar a **rede local do Hardhat** em vez da Sepolia para desenvolvimento e testes. Isso oferece várias vantagens:

- ⚡ **Transações instantâneas** (sem esperar confirmações)
- 💰 **ETH gratuito** (contas com 10.000 ETH cada)
- 🔄 **Reset fácil** (reiniciar a rede limpa o estado)
- 🚫 **Sem custos de gas** reais

## 🚀 Setup Local Completo

### 1. Iniciar a Rede Local
```bash
# Terminal 1 - Manter rodando
npx hardhat node
```

Isso iniciará um servidor JSON-RPC em `http://127.0.0.1:8545/` com 20 contas pré-financiadas.

### 2. Deploy dos Contratos
```bash
# Terminal 2 - Em outra janela
npx hardhat run scripts/deploy.js --network hardhat
```

### 3. Configurar MetaMask para Rede Local

#### Adicionar Rede Local no MetaMask:
1. Abrir MetaMask
2. Clicar na rede atual (topo)
3. **"Adicionar rede"** → **"Adicionar uma rede manualmente"**
4. Preencher:
   - **Nome da rede**: `Hardhat Local`
   - **Nova URL do RPC**: `http://127.0.0.1:8545`
   - **ID da chain**: `1337`
   - **Símbolo da moeda**: `ETH`
   - **URL do explorador de blocos**: (deixar vazio)

#### Importar Conta de Teste:
Use uma das contas fornecidas pelo Hardhat:

**Conta #0** (Deployer):
- **Endereço**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Chave Privada**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Conta #1** (Teste):
- **Endereço**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Chave Privada**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

1. MetaMask → **"Importar conta"**
2. Colar a chave privada
3. Confirmar

### 4. Importar Tokens no MetaMask

Após o deploy, use os endereços exibidos no terminal:

- **MPE1**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **MPE2**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

1. MetaMask → **"Importar tokens"**
2. Colar endereço do token
3. Repetir para ambos os tokens

### 5. Usar a Interface Web

1. Abrir `frontend/index.html` no navegador
2. Conectar MetaMask (já na rede local)
3. Começar a negociar!

## 🔄 Comandos Úteis

```bash
# Reiniciar rede local (limpa todo o estado)
# Ctrl+C no terminal do node, depois:
npx hardhat node

# Deploy novamente após reiniciar
npx hardhat run scripts/deploy.js --network hardhat

# Executar teste local básico
npx hardhat run scripts/test-local.js --network hardhat

# Compilar contratos
npx hardhat compile
```

## 🎯 Vantagens do Desenvolvimento Local

### ⚡ Velocidade
- Transações processadas instantaneamente
- Sem esperar confirmações de bloco
- Feedback imediato durante desenvolvimento

### 💰 Custo Zero
- ETH ilimitado para testes
- Sem preocupação com gas fees
- Pode fazer quantas transações quiser

### 🔧 Debugging
- Logs detalhados do Hardhat
- Stack traces completos em erros
- Console.log funciona nos contratos

### 🧪 Testes Isolados
- Estado limpo a cada reinicialização
- Ambiente controlado
- Reproduzibilidade perfeita

## 🔍 Diferenças da Sepolia

| Aspecto | Local (Hardhat) | Sepolia |
|---------|-----------------|---------|
| **Velocidade** | Instantâneo | ~15 segundos/bloco |
| **Custo** | Gratuito | ETH de teste (limitado) |
| **Persistência** | Temporário | Permanente |
| **Acesso Público** | Só você | Qualquer um |
| **Debugging** | Completo | Limitado |

## 📋 Workflow Recomendado

### Para Desenvolvimento:
1. ✅ Use **Hardhat local** para desenvolvimento rápido
2. ✅ Teste todas as funcionalidades localmente
3. ✅ Debug e otimize o código
4. ✅ Quando estiver pronto, deploy na Sepolia

### Para Demonstração:
1. ✅ Use **Sepolia** para demos públicas
2. ✅ Compartilhe links do Etherscan
3. ✅ Permita que alunos interajam remotamente

## 🛡️ Segurança

⚠️ **IMPORTANTE**: As chaves privadas do Hardhat são **públicas e conhecidas**. 

- ✅ Usar apenas para desenvolvimento local
- ❌ **NUNCA** enviar ETH real para essas contas
- ❌ **NUNCA** usar essas chaves em mainnet

## 🔧 Troubleshooting

### MetaMask não conecta:
- Verificar se `npx hardhat node` está rodando
- Confirmar URL: `http://127.0.0.1:8545`
- Chain ID: `31337`

### Reset do estado:
```bash
# Para e reinicia o nó
Ctrl+C
npx hardhat node

# Deploy novamente
npx hardhat run scripts/deploy.js --network hardhat
```

### Tokens não aparecem:
- Verificar endereços no `deployment.json`
- Confirmar que está na rede Hardhat Local
- Re-importar tokens se necessário

## 🎓 Para Seus Alunos

```bash
# Setup completo para aluno
npm install
npx hardhat node          # Terminal 1
npx hardhat run scripts/deploy.js --network hardhat  # Terminal 2
```

Depois:
1. Configurar MetaMask (rede local + conta de teste)
2. Importar tokens MPE1 e MPE2
3. Abrir `frontend/index.html`
4. Começar a negociar!

Agora seus alunos podem experimentar **sem custos** e com **feedback instantâneo**! 🎉