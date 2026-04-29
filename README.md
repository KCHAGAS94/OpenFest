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

### 1. Banco de dados

```bash
psql -U postgres -f backend/src/db/init.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edite com suas credenciais
npm run dev            # porta 3000
```

### 3. Frontend

```bash
cd frontend
npm run dev            # porta 5173
```

Acesse `http://localhost:5173` — a tela de login será exibida.

### Credenciais padrão (admin)

| Campo | Valor |
|-------|-------|
| E-mail | admin@openfest.com |
| Senha | Admin@123 |
