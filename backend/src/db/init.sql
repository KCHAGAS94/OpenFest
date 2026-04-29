-- Script de inicialização do banco de dados OpenFest
-- Execute no PostgreSQL: psql -U postgres -f init.sql

CREATE DATABASE openfest;

\c openfest;

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150)        NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT              NOT NULL,
  role        VARCHAR(20)         NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Usuário admin padrão (senha: Admin@123)
-- Hash gerado com bcrypt, custo 10
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@openfest.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON CONFLICT DO NOTHING;

-- Tabela de produtos com estoque
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0
);
