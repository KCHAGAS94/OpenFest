import crypto from 'crypto';
import pool from '../db/pool.js';

export async function criarVenda(req, res) {
  const { itens, total, tipoPagamento, observacao } = req.body;
  const vendedorId = req.user.id;

  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ message: 'A venda precisa ter ao menos um item.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: proximoIdRows } = await client.query(
      'SELECT COALESCE(MAX("idPedido"), 0) + 1 AS proximo FROM vendas'
    );
    const idPedido = proximoIdRows[0].proximo;
    const vendaId = crypto.randomUUID();

    await client.query(
      `INSERT INTO vendas (id, "idPedido", total, "tipoPagamento", observacao, "vendedorId", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [vendaId, idPedido, total, tipoPagamento, observacao || null, vendedorId]
    );

    for (const item of itens) {
      await client.query(
        `INSERT INTO itens_venda (id, "vendaId", "produtoId", quantidade, "precoUnit", subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), vendaId, item.produtoId, item.quantidade, item.precoUnit, item.precoUnit * item.quantidade]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: vendaId, idPedido });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', err);
    res.status(500).json({ message: 'Erro ao registrar venda.' });
  } finally {
    client.release();
  }
}

export async function listarVendas(req, res) {
  const { hoje } = req.query;
  try {
    const filtro = hoje === 'true' ? `WHERE v.data >= CURRENT_DATE AND v.data < CURRENT_DATE + INTERVAL '1 day'` : '';
    const { rows: vendas } = await pool.query(
      `SELECT v.id, v."idPedido", v.data, v.total, v."tipoPagamento", v.observacao, v."vendedorId", u.nome AS "vendedorNome"
       FROM vendas v
       JOIN usuarios u ON u.id = v."vendedorId"
       ${filtro}
       ORDER BY v.data DESC`
    );

    if (vendas.length === 0) return res.json([]);

    const { rows: itens } = await pool.query(
      `SELECT iv.*, p.nome AS "produtoNome"
       FROM itens_venda iv
       JOIN produtos p ON p.id = iv."produtoId"
       WHERE iv."vendaId" = ANY($1)`,
      [vendas.map((v) => v.id)]
    );

    const vendasComItens = vendas.map((venda) => ({
      ...venda,
      itens: itens.filter((item) => item.vendaId === venda.id),
    }));

    res.json(vendasComItens);
  } catch (err) {
    console.error('Erro ao listar vendas:', err);
    res.status(500).json({ message: 'Erro ao listar vendas.' });
  }
}
