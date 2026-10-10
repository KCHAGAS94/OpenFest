import pool from '../db/pool.js'

function configParaSaida(row) {
  return {
    nomeEvento: row.nome_evento,
    mensagemRecibo: row.mensagem_recibo,
    imprimirAutomatico: row.imprimir_automatico,
  }
}

export async function obterConfiguracoes(_req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM configuracoes_sistema WHERE id = 1')
    res.json(configParaSaida(rows[0]))
  } catch (err) {
    console.error('Erro ao carregar configurações:', err)
    res.status(500).json({ message: 'Erro ao carregar configurações.' })
  }
}

// Apaga só o que foi marcado (vendas, produtos, usuários), tudo numa transação.
// Usuários: mantém quem está zerando, para o sistema não ficar sem acesso.
export async function zerarDados(req, res) {
  const { vendas, produtos, usuarios } = req.body || {}
  if (!vendas && !produtos && !usuarios) {
    return res.status(400).json({ message: 'Marque o que deseja zerar.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // RESTART IDENTITY faz a numeração dos pedidos recomeçar do 1.
    if (vendas) await client.query('TRUNCATE itens_venda_sistema, vendas_sistema RESTART IDENTITY')
    if (produtos) await client.query('DELETE FROM produtos')
    if (usuarios) await client.query('DELETE FROM usuarios_sistema WHERE id <> $1', [req.user.id])
    await client.query('COMMIT')
    console.log(`[zerar] ${req.user.email} zerou:`, { vendas: !!vendas, produtos: !!produtos, usuarios: !!usuarios })
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Erro ao zerar dados:', err)
    res.status(500).json({ message: 'Erro ao zerar os dados.' })
  } finally {
    client.release()
  }
}

export async function salvarConfiguracoes(req, res) {
  const { nomeEvento, mensagemRecibo, imprimirAutomatico } = req.body

  try {
    const { rows } = await pool.query(
      `UPDATE configuracoes_sistema SET
         nome_evento = $1,
         mensagem_recibo = $2,
         imprimir_automatico = $3,
         updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [nomeEvento?.trim() || 'SwingSamba', mensagemRecibo?.trim() ?? '', !!imprimirAutomatico]
    )
    res.json(configParaSaida(rows[0]))
  } catch (err) {
    console.error('Erro ao salvar configurações:', err)
    res.status(500).json({ message: 'Erro ao salvar configurações.' })
  }
}
