import crypto from 'crypto';
import pool from '../db/pool.js';

export async function listarConfiguracoes(_req, res) {
  try {
    const { rows } = await pool.query('SELECT chave, valor, tipo FROM configuracoes');
    const mapa = {};
    for (const row of rows) mapa[row.chave] = row.valor;
    res.json(mapa);
  } catch (err) {
    console.error('Erro ao listar configurações:', err);
    res.status(500).json({ message: 'Erro ao listar configurações.' });
  }
}

export async function salvarConfiguracoes(req, res) {
  const entradas = Object.entries(req.body || {});
  try {
    for (const [chave, valor] of entradas) {
      await pool.query(
        `INSERT INTO configuracoes (id, chave, valor, tipo, "updatedAt")
         VALUES ($1, $2, $3, 'number', NOW())
         ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, "updatedAt" = NOW()`,
        [crypto.randomUUID(), chave, String(valor)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.status(500).json({ message: 'Erro ao salvar configurações.' });
  }
}
