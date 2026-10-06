import crypto from 'crypto'
import pool from '../db/pool.js'

async function emTransacao(executar) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const resultado = await executar(client)
    await client.query('COMMIT')
    return resultado
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function inserirVenda(client, { data, total, tipoPagamento, vendedorId, vendedorNome, itens }) {
  const { rows } = await client.query(
    `INSERT INTO vendas_sistema (data, total, tipo_pagamento, vendedor_id, vendedor_nome)
     VALUES (COALESCE($1, NOW()), $2, $3, $4, $5)
     RETURNING id`,
    [data, total, tipoPagamento, vendedorId, vendedorNome]
  )
  for (const item of itens) {
    await client.query(
      `INSERT INTO itens_venda_sistema (venda_id, produto_id, nome, preco, quantidade, tipo, unidades_combo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rows[0].id, item.produtoId, item.nome, item.preco, item.quantidade, item.tipo || 'unidade', item.unidadesCombo || null]
    )
  }
  return rows[0].id
}

// Registra a venda com preços do banco e baixa o estoque (bloqueia o produto ao zerar).
export async function registrarVenda(req, res) {
  const { itens, tipoPagamento } = req.body
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ message: 'A venda precisa ter ao menos um item.' })
  }

  try {
    const id = await emTransacao(async (client) => {
      const itensVenda = []
      for (const { id: produtoId, quantidade } of itens) {
        const qtd = Number.parseInt(quantidade, 10)
        if (!(qtd > 0)) {
          const erro = new Error('Quantidade inválida na venda.')
          erro.status = 400
          throw erro
        }
        const { rows } = await client.query(
          `UPDATE produtos SET
             estoque = estoque - $2,
             bloqueado = bloqueado OR estoque - $2 <= 0,
             "updatedAt" = NOW()
           WHERE id = $1
           RETURNING *`,
          [produtoId, qtd]
        )
        if (!rows[0]) {
          const erro = new Error('Produto da venda não encontrado.')
          erro.status = 400
          throw erro
        }
        const p = rows[0]
        itensVenda.push({ produtoId, nome: p.nome, preco: Number(p.preco), quantidade: qtd, tipo: p.tipo, unidadesCombo: p.unidadesCombo })
      }

      const { rows: usuario } = await client.query('SELECT nome FROM usuarios_sistema WHERE id = $1', [req.user.id])
      return inserirVenda(client, {
        data: null,
        total: itensVenda.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
        tipoPagamento: tipoPagamento || 'Dinheiro',
        vendedorId: req.user.id,
        vendedorNome: usuario[0]?.nome || 'Sistema',
        itens: itensVenda,
      })
    })
    res.status(201).json({ id })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error('Erro ao registrar venda:', err)
    res.status(500).json({ message: 'Erro ao registrar venda.' })
  }
}

export async function listarVendas(_req, res) {
  try {
    const { rows: vendas } = await pool.query('SELECT * FROM vendas_sistema ORDER BY data, id')
    const { rows: itens } = await pool.query('SELECT * FROM itens_venda_sistema ORDER BY id')

    const itensPorVenda = {}
    for (const item of itens) {
      (itensPorVenda[item.venda_id] ||= []).push({
        id: item.produto_id,
        nome: item.nome,
        preco: Number(item.preco),
        quantidade: item.quantidade,
        tipo: item.tipo,
        unidadesCombo: item.unidades_combo ?? undefined,
      })
    }

    res.json(vendas.map((v) => ({
      id: v.id,
      data: v.data,
      total: Number(v.total),
      tipoPagamento: v.tipo_pagamento,
      vendedor: v.vendedor_nome,
      itens: itensPorVenda[v.id] || [],
    })))
  } catch (err) {
    console.error('Erro ao listar vendas:', err)
    res.status(500).json({ message: 'Erro ao listar vendas.' })
  }
}

// Importa produtos e vendas que estavam salvos no localStorage de um navegador.
// Produtos com o mesmo nome de um já existente no banco não são duplicados.
export async function importarDadosLocais(req, res) {
  const produtos = Array.isArray(req.body.produtos) ? req.body.produtos : []
  const vendas = Array.isArray(req.body.vendas) ? req.body.vendas : []

  try {
    const resumo = await emTransacao(async (client) => {
      const { rows: existentes } = await client.query('SELECT id, nome FROM produtos')
      const idPorNome = new Map(existentes.map((p) => [p.nome.trim().toLowerCase(), p.id]))
      const idNovoPorAntigo = new Map()
      let produtosImportados = 0

      for (const p of produtos) {
        const nome = String(p.nome || '').trim()
        if (!nome) continue
        let id = idPorNome.get(nome.toLowerCase())
        if (!id) {
          id = crypto.randomUUID()
          const tipo = p.tipo === 'combo' ? 'combo' : 'unidade'
          await client.query(
            `INSERT INTO produtos (id, nome, preco, estoque, bloqueado, tipo, "unidadesCombo", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [id, nome, Number(p.preco) || 0, Number.parseInt(p.estoque, 10) || 0, !!p.bloqueado, tipo,
              tipo === 'combo' ? Number.parseInt(p.unidadesCombo, 10) || 1 : null]
          )
          idPorNome.set(nome.toLowerCase(), id)
          produtosImportados++
        }
        idNovoPorAntigo.set(String(p.id), id)
      }

      let vendasImportadas = 0
      for (const v of vendas) {
        const itens = (Array.isArray(v.itens) ? v.itens : []).map((item) => ({
          produtoId: idNovoPorAntigo.get(String(item.id)) || idPorNome.get(String(item.nome || '').trim().toLowerCase()) || null,
          nome: String(item.nome || 'Produto'),
          preco: Number(item.preco) || 0,
          quantidade: Number.parseInt(item.quantidade, 10) || 0,
          tipo: item.tipo,
          unidadesCombo: item.unidadesCombo,
        }))
        if (itens.length === 0) continue
        const data = new Date(v.data)
        await inserirVenda(client, {
          data: Number.isNaN(data.getTime()) ? null : data,
          total: Number(v.total) || itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
          tipoPagamento: v.tipoPagamento || 'Dinheiro',
          vendedorId: null,
          vendedorNome: v.vendedor || 'Sistema',
          itens,
        })
        vendasImportadas++
      }

      return { produtosImportados, vendasImportadas }
    })
    res.json(resumo)
  } catch (err) {
    console.error('Erro ao importar dados locais:', err)
    res.status(500).json({ message: 'Erro ao importar os dados.' })
  }
}
