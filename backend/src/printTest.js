
import { printer as ThermalPrinter, types as PrinterTypes } from "node-thermal-printer";

// ATENÇÃO: Troque pelo nome exato da sua impressora conforme aparece no Windows

const defaultPrinterName = "KP-IM607-2"; // Nome exato da impressora no Windows


export async function printReceipt({ evento = "OPENFEST", itens = [], total = 0, data = "", pagamento = "", observacao = "" }) {
  let printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `printer:${defaultPrinterName}`,
    options: { timeout: 5000 }
  });
  printer.alignCenter();
  printer.println(evento);
  printer.println("Recibo de Pagamento");
  printer.drawLine();
  printer.alignCenter();
  itens.forEach(item => {
    printer.println(`${item.quantidade}x ${item.nome}  R$ ${Number(item.total).toFixed(2)}`);
  });
  printer.drawLine();
  printer.bold(true);
  printer.alignCenter();
  printer.println(`TOTAL  R$ ${Number(total).toFixed(2)}`);
  printer.bold(false);
  if (pagamento) {
    printer.alignCenter();
    printer.println(`Pagamento: ${pagamento}`);
  }
  if (observacao) {
    printer.alignCenter();
    printer.println(observacao);
  }
  printer.drawLine();
  printer.alignCenter();
  printer.println(data);
  printer.println("");
  printer.println("Obrigado pela preferência!");
  printer.cut();
  try {
    let execute = await printer.execute();
    console.log("Impressão enviada!", execute);
    return true;
  } catch (error) {
    console.error("Erro ao imprimir:", error);
    throw error;
  }
}
