# OpenFest Mobile

App React Native (Expo) para vender diretamente pelo celular, sem depender do app do Mercado Pago. Consome a **mesma API e banco de dados** do `backend/` usado pelo `frontend/` desktop.

## Como funciona na prática

- O `backend/` (Node + Postgres) continua rodando no PC que está com a impressora térmica conectada via USB.
- O celular (Expo Go ou app instalado) se conecta ao backend pela rede Wi-Fi local do evento.
- Depois que o pagamento é aprovado, o app chama `POST /api/print` no backend, que manda o cupom pra impressora via USB — por isso o PC precisa ficar ligado durante o evento.

## Setup

1. Descubra o IP local do PC que roda o backend (Windows: `ipconfig`, procure "Endereço IPv4").
2. Copie `.env.example` para `.env` e ajuste:
   ```
   EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
   ```
3. Garanta que o celular e o PC estão na **mesma rede Wi-Fi**.
4. Rode:
   ```
   npm install
   npm run start
   ```
5. Abra no Expo Go (lendo o QR code) ou `npm run android` / `npm run ios`.

## Estrutura

```
src/
  api/client.js        # instância axios apontando pro backend + token JWT
  context/AuthContext.js
  screens/
    LoginScreen.js
    VendasScreen.js     # catálogo, carrinho, pagamento (Pix/Cartão/Dinheiro) e impressão
```
