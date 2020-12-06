const EscPosEncoder = require('esc-pos-encoder');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
const { execFile } = require('child_process');

const app = express();

const opener = () => {
  const encoder = new EscPosEncoder();
  const code = encoder
    .initialize()
    .codepage('windows1251')
    .raw([0x1B, 0x70, 0x30, 0x37, 0x79])
    .encode();

  const path = `opener.bin`;
  fs.writeFile(path, code, () => {
    execFile('print', [path]);
  });
}

const printer = (data) => {
  const line = Array(40).fill('-').join('');
  const encoder = new EscPosEncoder();
  const { transactionData: t, transactionItems: i } = data;
  encoder
    .initialize()
    .codepage('windows1251')
    .raw([0x1B, 0x70, 0x30, 0x37, 0x79])
    .align('center')
    .bold(true)
    .text('Los Manggalenos Store')
    .newline()
    .bold(false)
    .text('Brgy. Manggalang I,')
    .newline()
    .text('Sariaya, Quezon')
    .newline()
    .align('left')
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
  const filename = `${t.transactionNumber}`.split('-').join('').padStart(12, '0');
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
    .bold(true)
    .text('Net Total:          ')
    .text(parseFloat(`${t.netTotal}`).toFixed(2).padStart(20, ' '))
    .newline()
    .bold(false)
    .text('Cash Tendered:      ')
    .text(parseFloat(`${t.amountTendered}`).toFixed(2).padStart(20, ' '))
    .newline()
    .bold(true)
    .text('Change Due:         ')
    .text(parseFloat(`${t.tenderChange}`).toFixed(2).padStart(20, ' '))
    .newline()
    .newline()
    .newline()
    .align('center')
    .bold(false)
    .text('THIS IS NOT AN OFFICIAL RECEIPT')
    .newline()
    .text('Thank you for shopping with us!')
    .newline()
    .text(moment().format('MMMM DD, YYYY hh:mm:ss A'))
    .newline()
    .newline()
    .barcode(filename, 'ean13', 60)
    .newline()
    .newline()
    .newline()
    .newline()
    .newline()
    .newline()
    .newline()
    .newline();

  const result = encoder.encode();

  const path = `${filename}.bin`;
  fs.writeFile(path, result, () => {
    execFile('print', [path]);
  });
}

app.use(bodyParser.json());

app.post('/', async (req, res) => {
  printer(req.body);
  res.json({ success: true });
});


app.get('/open', async (req, res) => {
  opener();
  res.json({ success: true });
});

app.listen(3000);
