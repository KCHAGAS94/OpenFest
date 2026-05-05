import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ReciboImpressao({ evento, itens, total, data, onAfterPrint }) {
  useEffect(() => {
    // Pequeno delay para garantir que o DOM foi renderizado antes de imprimir
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    const handleAfterPrint = () => {
      if (onAfterPrint) onAfterPrint();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onAfterPrint]);

  const printContent = (
    <div className="print-container">
      <style>
        {`
          @media print {
            @page {
              size: 58mm auto; /* Define largura fixa e altura automática */
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white;
            }
            #root {
              display: none !important;
            }
            .print-container {
              display: block !important;
              width: 58mm;
              padding: 2mm;
              font-family: 'Courier New', Courier, monospace;
            }
            .item-recibo {
              page-break-inside: avoid; /* Evita que um item seja cortado no meio */
              border-bottom: 1px dashed #000; /* Linha opcional para separar visualmente na hora de cortar */
              padding-bottom: 10mm;
              padding-top: 5mm;
              text-align: center;
            }
            .item-recibo:last-child {
              border-bottom: none;
            }
          }
          @media screen {
            .print-container {
              display: none;
            }
          }
        `}
      </style>

      {/* Mapeamento dos itens: gera um bloco completo para cada unidade vendida */}
      {itens?.map((item, idx) => 
        Array.from({ length: item.quantidade }).map((_, unidadeIdx) => (
          <div key={`${item.id}-${idx}-${unidadeIdx}`} className="item-recibo">
            <h1 style={{ fontSize: '14px', margin: '0', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {evento}
            </h1>
            <p style={{ fontSize: '10px', margin: '2px 0' }}>Recibo de Pagamento</p>
            
            <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '15px 0 5px 0', lineHeight: '1.1' }}>
              {item.nome.toUpperCase()}
            </div>
            
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
              R$ {Number(item.preco).toFixed(2).replace('.', ',')}
            </div>
            
            <div style={{ fontSize: '10px', marginTop: '10px' }}>
              <p style={{ margin: '0' }}>{new Date(data).toLocaleString('pt-BR')}</p>
              <p style={{ margin: '5px 0 0 0' }}>Obrigado pela preferência!</p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return createPortal(printContent, document.body);
}