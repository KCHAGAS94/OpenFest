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
