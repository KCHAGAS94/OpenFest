# OpenFest

Sistema de gerenciamento de eventos.

## Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express
- **Banco de dados:** PostgreSQL

## Estrutura

```
OpenFest/
├── frontend/   # React + Vite + Tailwind
└── backend/    # Node.js + Express + PostgreSQL
```

## Como rodar

### 1. Configuração Inicial

```bash
# Passo 1: Crie e popule o banco de dados
psql -U postgres -f backend/src/db/init.sql

# Passo 2: Configure as variáveis de ambiente do backend
# (navegue até a pasta 'backend' para fazer a cópia)
cp .env.example .env   # edite com suas credenciais
# Passo 3: Instale todas as dependências do projeto
npm run setup
```

Acesse `http://localhost:5173` — a tela de login será exibida.

### Credenciais padrão (admin)

| Campo | Valor |
|-------|-------|
| E-mail | admin@openfest.com |
| Senha | Admin@123 |
