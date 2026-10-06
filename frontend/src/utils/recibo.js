
import { apiFetch } from './configuracoes'

// Monta os dados do cupom a partir dos itens vendidos. Combos saem como as
// unidades que contêm (ex.: combo de 5 por R$ 35 vira 5 cupons de R$ 7).
export function montarRecibo({ itens, config, data, pagamento }) {
  const itensRecibo = itens.map(item => {
    const preco = Number(item.preco);
    const qtd = Number(item.quantidade);
    const unidadesCombo = item.tipo === 'combo' ? (Number(item.unidadesCombo) || 1) : 1;
    const precoUnitario = isNaN(preco) ? 0 : preco / unidadesCombo;
    return {
      nome: item.nome,
      quantidade: isNaN(qtd) ? 0 : qtd * unidadesCombo,
      preco: precoUnitario,
      total: (isNaN(preco) || isNaN(qtd)) ? 0 : preco * qtd
    };
  });
  const total = itensRecibo.reduce((acc, item) => acc + item.total, 0);
  return {
    evento: config.nomeEvento,
    mensagem: config.mensagemRecibo,
    itens: itensRecibo,
    total,
    data: (data ? new Date(data) : new Date()).toLocaleString('pt-BR'),
    pagamento,
  };
}

// Manda o cupom para a fila; a estação de impressão (PC) imprime.
export function enviarParaFila(recibo) {
  return apiFetch('/api/impressao', { method: 'POST', body: { recibo } });
}
