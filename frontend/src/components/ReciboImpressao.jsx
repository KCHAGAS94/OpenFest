import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ReciboImpressao({ evento, itens, total, data, onAfterPrint }) {
  useEffect(() => {
    // Chama a impressão do navegador logo que o componente renderiza
    window.print();

    // Quando a janela de impressão for fechada, conclui a venda no Caixa
    const handleAfterPrint = () => {
      if (onAfterPrint) onAfterPrint();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onAfterPrint]);

  // Altura base (cabeçalho, total, rodapé) de 40mm + 3mm por produto (10x menor que os 30mm)
  const baseHeight = 40;
  const pageHeight = baseHeight + (itens?.length || 1) * 3;

  const printContent = (
    <div className="print-container text-black bg-white">
      <style>
        {`
          @media print {
            @page {
              size: 57.5mm ${pageHeight}mm;
              margin: 0;
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
              background: white;
              margin: 0 !important;
            }
            /* Oculta o layout principal do React e mostra apenas o Portal do Recibo */
            #root {
              display: none !important;
            }
            .print-container {
              display: block !important;
              width: 57.5mm;
              font-family: monospace; 
              font-size: 12px;
              padding: 2mm; /* Respiro para a tinta não encostar na borda */
            }
          }
          @media screen {
            .print-container {
              display: none;
            }
          }
        `}
      </style>

      {/* ─── Layout do Recibo ─── */}
      <div className="text-center mb-2">
        <h1 className="font-bold text-base uppercase leading-tight">{evento}</h1>
        <p className="text-[10px] mt-1">Recibo de Pagamento</p>
      </div>

      <div className="border-t border-b border-black border-dashed py-2 my-2 space-y-1">
        {itens && itens.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <span className="truncate pr-2">{item.quantidade}x {item.nome}</span>
            <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between font-bold text-sm mt-2">
        <span>TOTAL</span>
        <span>R$ {Number(total).toFixed(2)}</span>
      </div>

      <div className="text-center text-[10px] mt-4">
        <p>{new Date(data).toLocaleString('pt-BR')}</p>
        <p className="mt-2">Obrigado pela preferência!</p>
      </div>
      
      {/* Avanço do papel e o ponto para a serrilha */}
      <div style={{ height: '5mm' }} />
    </div>
  );

  // Joga o HTML do recibo diretamente no corpo (body) do site, evitando que o layout do #root atrapalhe a impressão
  return createPortal(printContent, document.body);
}
