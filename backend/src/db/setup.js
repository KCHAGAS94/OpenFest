import bcrypt from 'bcryptjs'
import pool from './pool.js'

// Cria as tabelas de usuários/configurações se não existirem e garante um admin inicial.
export async function prepararBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios_sistema (
      id                 SERIAL PRIMARY KEY,
      nome               VARCHAR(150)        NOT NULL,
      email              VARCHAR(255) UNIQUE NOT NULL,
      senha_hash         TEXT                NOT NULL,
      perm_caixa         BOOLEAN             NOT NULL DEFAULT FALSE,
      perm_produtos      BOOLEAN             NOT NULL DEFAULT FALSE,
      perm_gestao        BOOLEAN             NOT NULL DEFAULT FALSE,
      perm_configuracoes BOOLEAN             NOT NULL DEFAULT FALSE,
      created_at         TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS configuracoes_sistema (
      id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      nome_evento         VARCHAR(150) NOT NULL DEFAULT 'SwingSamba',
      mensagem_recibo     VARCHAR(255) NOT NULL DEFAULT 'Obrigado pela preferência!',
      imprimir_automatico BOOLEAN      NOT NULL DEFAULT TRUE,
      updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    INSERT INTO configuracoes_sistema (id) VALUES (1) ON CONFLICT DO NOTHING;
  `)

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios_sistema')
  if (rows[0].total > 0) return

  const email = process.env.ADMIN_EMAIL || 'admin@openfest.com'
  const senha = process.env.ADMIN_SENHA || 'Admin@123'
  await pool.query(
    `INSERT INTO usuarios_sistema
       (nome, email, senha_hash, perm_caixa, perm_produtos, perm_gestao, perm_configuracoes)
     VALUES ('Administrador', $1, $2, TRUE, TRUE, TRUE, TRUE)`,
    [email.toLowerCase(), await bcrypt.hash(senha, 10)]
  )
  console.log(`Usuário admin criado: ${email}`)
}
