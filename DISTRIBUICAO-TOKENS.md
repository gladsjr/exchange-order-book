# Script de Distribuição de Tokens

## 📦 Descrição

Script para distribuir ETH, MPE1 e MPE2 para múltiplos endereços de uma só vez.

## 📋 Pré-requisitos

1. Ter feito deploy dos contratos (local ou Sepolia)
2. Ter saldo suficiente de ETH, MPE1 e MPE2 na conta do distribuidor
3. Ter arquivo `recipient-addresses.txt` com os endereços destinatários

## 🚀 Como Usar

### 1. Criar lista de endereços

Edite o arquivo `recipient-addresses.txt` na raiz do projeto e adicione os endereços, um por linha:

```
0x1234567890123456789012345678901234567890
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
0x9876543210987654321098765432109876543210
```

**Dicas:**
- Linhas vazias são ignoradas
- Linhas começando com `#` são comentários (ignoradas)
- Endereços inválidos são automaticamente filtrados

### 2. Definir quais tokens enviar e em que quantidades

Quais dos três tokens (ETH, MPE1, MPE2) serão enviados — e em que quantidade — é
controlado pelo arquivo `distribuicao-config.json` na raiz do projeto:

```json
{
  "eth":  { "enviar": true,  "quantidade": "0.01" },
  "mpe1": { "enviar": true,  "quantidade": "5" },
  "mpe2": { "enviar": false, "quantidade": "0" }
}
```

**Como funciona:**
- Cada token tem dois campos: `enviar` (true/false) e `quantidade` (texto).
- Um token só é distribuído quando `enviar` é `true` **e** `quantidade` é maior que 0.
- Para enviar apenas alguns tokens, marque `enviar: false` (ou quantidade `"0"`) nos demais.
- A verificação de saldo é feita só para os tokens habilitados.
- Quantidades de ETH aceitam decimais (`"0.01"`); MPE1 e MPE2 são inteiros (decimais = 0).

**Exemplo — enviar só 10 MPE1, sem ETH e sem MPE2:**

```json
{
  "eth":  { "enviar": false, "quantidade": "0" },
  "mpe1": { "enviar": true,  "quantidade": "10" },
  "mpe2": { "enviar": false, "quantidade": "0" }
}
```

### 3. Executar o script

O comando é o mesmo de antes — o script lê o `distribuicao-config.json` automaticamente.

#### Rede Local (Hardhat):

```bash
npx hardhat run scripts/distribui-tokens.js --network localhost
```

#### Rede Sepolia:

```bash
npx hardhat run scripts/distribui-tokens.js --network sepolia
```

## 📊 Exemplo de Saída

```
🚀 Iniciando distribuição de tokens...

📦 Quantidades a distribuir por endereço:
   💎 ETH: 0.01
   🪙 MPE1: 5
   🪙 MPE2: 5

📋 Encontrados 3 endereços válidos para distribuição.

👤 Distribuidor: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Saldo do distribuidor: 9999.5 ETH

🔗 Contratos carregados:
   MPE1: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
   MPE2: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

✅ Saldos suficientes para distribuição!

================================================================================
🎁 INICIANDO DISTRIBUIÇÃO
================================================================================

[1/3] 📤 Enviando para: 0x1234567890123456789012345678901234567890
   💎 Enviando 0.01 ETH...
   ✅ ETH enviado! Hash: 0xabc...
   🪙 Enviando 5 MPE1...
   ✅ MPE1 enviado! Hash: 0xdef...
   🪙 Enviando 5 MPE2...
   ✅ MPE2 enviado! Hash: 0x123...
   🎉 Distribuição completa para 0x1234567890123456789012345678901234567890

[2/3] 📤 Enviando para: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
   ...

================================================================================
📊 RESUMO DA DISTRIBUIÇÃO
================================================================================
✅ Sucesso: 3 endereços
❌ Falhas: 0 endereços
📦 Total distribuído:
   💎 ETH: 0.03
   🪙 MPE1: 15
   🪙 MPE2: 15
================================================================================

💰 Saldos finais do distribuidor:
   ETH: 9999.2
   MPE1: 997000
   MPE2: 997000
```

## ⚠️ Observações Importantes

### Para Rede Local (Hardhat):
- Use a `PRIVATE_KEY` do Hardhat (já configurada no `.env`)
- O endereço padrão tem 10,000 ETH de teste
- Tokens são ilimitados (você é o owner e pode fazer mint)

### Para Rede Sepolia:
- **⚠️ CUIDADO!** Você está gastando ETH real (testnet)
- Use a `PRIVATE_KEY` da sua conta Sepolia (já configurada no `.env`)
- Certifique-se de ter saldo suficiente antes de executar
- Recomendado: use valores pequenos (ex: 0.01 ETH)

## 🔐 Segurança

- O script usa a `PRIVATE_KEY` do arquivo `.env`
- **NUNCA** compartilhe seu arquivo `.env`
- **NUNCA** faça commit do `.env` no Git
- Para Sepolia, use uma wallet de teste, não sua wallet principal

## 🆘 Solução de Problemas

### Erro: "Arquivo recipient-addresses.txt não encontrado"
**Solução:** Crie o arquivo na raiz do projeto com os endereços.

### Erro: "Arquivo distribuicao-config.json não encontrado"
**Solução:** Crie o arquivo na raiz do projeto definindo quais tokens enviar e as quantidades (veja a seção "Definir quais tokens enviar").

### Erro: "Nenhum token habilitado para envio"
**Solução:** No `distribuicao-config.json`, marque `"enviar": true` e uma `"quantidade"` maior que 0 para ao menos um token.

### Erro: "Nenhum endereço válido encontrado"
**Solução:** Verifique se os endereços estão no formato correto (0x...) e são válidos.

### Erro: "Saldo insuficiente"
**Solução:** Verifique seus saldos antes de executar. Para tokens, você pode fazer mint (se for owner).

### Erro: "Arquivo deployment.json não encontrado"
**Solução:** Execute o deploy primeiro: `npm run deploy:local` ou `npm run deploy`

## 📚 Casos de Uso

### Distribuir para estudantes (qualquer rede):
```bash
npx hardhat run scripts/distribui-tokens.js --network localhost
# ou
npx hardhat run scripts/distribui-tokens.js --network sepolia
```

Distribui, para cada endereço da lista, a combinação de tokens definida no
`distribuicao-config.json`.
