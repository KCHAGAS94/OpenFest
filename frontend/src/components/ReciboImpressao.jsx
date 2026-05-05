import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ReciboImpressao({ evento, itens, total, data, onAfterPrint }) {
  useEffect(() => {
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
              size: 58mm auto;
              margin: 0 !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: #000000 !important;
              width: 58mm;
            }

            #root {
              display: none !important;
            }

            .print-container {
              display: block !important;
              width: 58mm;
              /* Ajuste fino do deslocamento para a esquerda */
              margin-left: -5mm !important; 
              padding: 0 !important;
            }

            .item-recibo {
              page-break-inside: avoid;
              text-align: center;
              padding: 4mm 0mm 8mm 0mm; 
              border-bottom: 0.5pt dashed #000;
              /* Aumentamos a largura para garantir que o texto centralizado não suma */
              width: 60mm; 
              box-sizing: border-box;
            }

            .bold-extreme {
              font-weight: 900 !important;
              color: #000000 !important;
              display: block;
              width: 100%;
            }

            /* Garante visibilidade total dos textos menores */
            .texto-detalhe {
              display: block !important;
              width: 100% !important;
              color: #000000 !important;
              font-weight: bold !important;
            }
          }

          @media screen {
            .print-container { display: none; }
          }
        `}
      </style>

      {itens?.map((item, idx) => 
        Array.from({ length: item.quantidade }).map((_, unidadeIdx) => (
          <div key={`${item.id}-${idx}-${unidadeIdx}`} className="item-recibo">
            {/* 1. Nome do Evento */}
            <span className="bold-extreme" style={{ fontSize: '14px', textTransform: 'uppercase' }}>
              {evento}
            </span>

            {/* 2. Recibo de Pagamento - RETORNADO */}
            <span className="texto-detalhe" style={{ fontSize: '10px', marginBottom: '5px' }}>
              Recibo de Pagamento
            </span>
            
            {/* 3. Nome do Produto */}
            <span className="bold-extreme" style={{ fontSize: '20px', margin: '8px 0 2px 0', lineHeight: '1.1' }}>
              {item.nome.toUpperCase()}
            </span>
            
            {/* 4. Preço */}
            <span className="bold-extreme" style={{ fontSize: '22px', marginBottom: '10px' }}>
              R$ {Number(item.preco).toFixed(2).replace('.', ',')}
            </span>
            
            {/* 5. Data e Hora - RETORNADO */}
            <div className="texto-detalhe" style={{ fontSize: '10px', marginTop: '5px' }}>
              <span>{new Date(data).toLocaleString('pt-BR')}</span>
            </div>

            {/* 6. Agradecimento - RETORNADO */}
            <div className="texto-detalhe" style={{ fontSize: '11px', marginTop: '5px' }}>
              <span>Obrigado pela preferência!</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return createPortal(printContent, document.body);
}