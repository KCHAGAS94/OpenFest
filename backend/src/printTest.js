
import { printer as ThermalPrinter, types as PrinterTypes } from "node-thermal-printer";

// ATENÇÃO: Troque pelo nome exato da sua impressora conforme aparece no Windows

const defaultPrinterName = "KP-IM607"; // Altere se necessário


let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON, // A maioria das térmicas usa EPSON
  interface: `printer:${defaultPrinterName}`,
  options: {
    timeout: 5000
  }
});


async function printReceipt() {
  printer.alignCenter();
  printer.println("OPENFEST");
  printer.println("Recibo de Pagamento");
  printer.drawLine();
  printer.alignLeft();
  printer.println("2x CARNE VACA      R$ 0.20");
  printer.drawLine();
  printer.bold(true);
  printer.println("TOTAL         R$ 0.20");
  printer.bold(false);
  printer.drawLine();
  printer.alignCenter();
  printer.println("30/04/2026, 06:49:03");
  printer.println("");
  printer.println("Obrigado pela preferência!");
  printer.cut();

  try {
    let execute = await printer.execute();
    console.log("Impressão enviada!", execute);
  } catch (error) {
    console.error("Erro ao imprimir:", error);
  }
}

printReceipt();
