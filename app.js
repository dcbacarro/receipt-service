const EscPosEncoder = require('esc-pos-encoder');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');

const app = express();

const printer = (data) => {
  const line = Array(40).fill('-').join('');
  const encoder = new EscPosEncoder();
  const { transactionData: t, tansactionItems: i } = data;
  encoder
    .initialize()
    .codepage('windows1251')
    .raw([0x1b, 0x70, 0x00, 0x19, 0xfa])
    .align('center')
    .bold(true)
    .text('Los Manggalenos Store')
    .newline()
    .bold(false)
    .text('Brgy. Manggalang I,')
    .newline()
    .text('Sariaya, Quezon')
    .newline()
    .text(line)
    .newline()
    .text(`Receipt No.: ${t.transactionNumber}`)
    .newline()
    .text(`Cashier: ${t.cashier}`)
    .newline()
    .text(`Customer: ${t.customer === 'DEFAULT CUSTOMER' ? 'Walk In' : t.customer}`)
    .newline()
    .text(line)
    .newline();

  i.forEach((item) => {
    const qp = `${item.qty} X ${parseFloat(`${item.unit_price}`).toFixed(2)}`.padEnd(20, ' ');
    const t = parseFloat(`${item.total_price}`).toFixed(2).padStart(20, ' ');

    encoder
      .text(item.description, 40)
      .newline()
      .text(qp)
      .text(t)
      .newline();
  });

  encoder
    .text(line)
    .newline()
    .text('Sub-total:          ')
    .text(parseFloat(`${t.totalAmount}`).toFixed(2).padStart(20, ' '))
    .newline()
    .text('Less Discount:      ')
    .text(parseFloat(`${t.totalAmount}`).toFixed(2).padStart(20, ' '))
    .newline()
    .newline()
    .text('Net Total:          ')
    .newline()
    .text(parseFloat(`${t.netTotal}`).toFixed(2).padStart(20, ' '))
    .newline()
    .text('Cash Tendered:      ')
    .newline()
    .text(parseFloat(`${t.amountTendered}`).toFixed(2).padStart(20, ' '))
    .newline()
    .text('Change Due:         ')
    .newline()
    .text(parseFloat(`${t.tenderChange}`).toFixed(2).padStart(20, ' '))
    .newline()
    .newline()
    .newline()
    .align('center')
    .text('Thank you for shopping with us!')
    .newline()
    .text(moment().format('MMMM DD, YYYY HH:mm:ss'))
    .newline()
    .newline()
    .barcode(`${t.transactionNumber}`.split('-').join('').padStart(12, '0'), 'ean13', 60)
    .newline()
    .newline();

  const result = encoder.encode();

  fs.writeFile('./receipt.bin', result, () => {});
}

app.use(bodyParser.json());

app.post('/', async (req, res) => {
  printer();
  res.json({ success: true });
});

app.listen(3000);
