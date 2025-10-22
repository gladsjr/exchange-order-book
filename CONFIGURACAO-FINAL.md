# 🔧 Configuração Completa - Local e Sepolia

## ✅ **Configuração Concluída!**

Agora o projeto funciona perfeitamente tanto com **Hardhat local** quanto com **Sepolia**, usando sempre a `PRIVATE_KEY` do arquivo `.env`.

---

## 📋 **Scripts Disponíveis**

```bash
# Rede Local (Hardhat)
npm run node          # Iniciar blockchain local
npm run deploy:local  # Deploy na rede local
npm run test:local    # Testes na rede local

# Sepolia (Testnet)
npm run deploy        # Deploy na Sepolia
npm run test         # Testes unitários

# Utilitários
npm run compile      # Compilar contratos
npm run serve        # Servidor web para interface
```

---

## 🚀 **Setup para Rede Local**

### 1. Configurar `.env`:
```bash
# Usar uma das chaves do Hardhat ou sua própria
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 2. Executar deploy:
```bash
npm run node          # Terminal 1 - Manter rodando
npm run deploy:local  # Terminal 2 - Deploy
npm run serve         # Terminal 3 - Interface web
```

### 3. Configurar MetaMask:
- **Rede**: `Hardhat Local`
- **RPC URL**: `http://127.0.0.1:8545`  
- **Chain ID**: `1337`
- **Símbolo**: `ETH`

---

## 🌐 **Setup para Sepolia**

### 1. Configurar `.env`:
```bash
# Sua chave privada real
PRIVATE_KEY=sua_chave_privada_real_sem_0x
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/sua_chave_infura
ETHERSCAN_API_KEY=sua_chave_etherscan
```

### 2. Executar deploy:
```bash
npm run deploy       # Deploy na Sepolia
npm run serve        # Interface web
```

### 3. MetaMask já configurado para Sepolia

---

## 📊 **Comparação de Configurações**

| Aspecto | **Local (Hardhat)** | **Sepolia** |
|---------|---------------------|-------------|
| **Comando Deploy** | `npm run deploy:local` | `npm run deploy` |
| **Rede no MetaMask** | `Hardhat Local` | `Sepolia` |
| **RPC URL** | `http://127.0.0.1:8545` | Infura/Alchemy |
| **Chain ID** | `1337` | `11155111` |
| **Velocidade** | ⚡ Instantâneo | ~15 segundos |
| **Custo** | 🆓 Gratuito | 💰 ETH de teste |
| **PRIVATE_KEY** | ✅ Usada em ambos | ✅ Usada em ambos |

---

## 🔑 **Importante sobre PRIVATE_KEY**

### ✅ **Para Local (Hardhat)**:
- Pode usar as chaves públicas do Hardhat
- Exemplo: `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Seguro** - apenas para desenvolvimento

### ⚠️ **Para Sepolia**:
- Use sua **chave privada real** do MetaMask
- **NUNCA** compartilhe esta chave
- **NUNCA** faça commit da chave no Git

---

## 🎯 **Fluxo de Trabalho Recomendado**

### 👨‍💻 **Desenvolvimento:**
1. ✅ Use `npm run deploy:local` para desenvolvimento rápido
2. ✅ Teste todas as funcionalidades localmente  
3. ✅ Debug e otimize código
4. ✅ Quando pronto → deploy na Sepolia

### 🎓 **Para Aulas:**
1. ✅ **Demonstração**: Use Sepolia (público, permanente)
2. ✅ **Prática dos alunos**: Use local (rápido, gratuito)
3. ✅ **Apresentações finais**: Use Sepolia (profissional)

---

## 🛠️ **Troubleshooting**

### ❌ **"Chain ID mismatch"**:
- ✅ Verificar Chain ID no MetaMask
- ✅ Local: `1337` | Sepolia: `11155111`

### ❌ **"Cannot connect to localhost"**:
- ✅ Verificar se `npm run node` está rodando
- ✅ Confirmar URL: `http://127.0.0.1:8545`

### ❌ **"Insufficient funds"**:
- ✅ Local: Usar conta do Hardhat (tem 10.000 ETH)
- ✅ Sepolia: Obter ETH de teste em faucets

### ❌ **"Invalid private key"**:
- ✅ Verificar formato (sem prefixo `0x`)
- ✅ Verificar arquivo `.env` existe e está carregado

---

## ✅ **Tudo Pronto!**

Agora você pode alternar facilmente entre desenvolvimento local e deploy público, sempre usando a mesma estrutura de comandos e configurações! 🎉

**Para começar agora:**
```bash
npm run node          # Em um terminal
npm run deploy:local  # Em outro terminal  
npm run serve         # Em um terceiro terminal
```

Depois configure o MetaMask e comece a negociar! 🚀