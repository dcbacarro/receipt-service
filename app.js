const EscPosEncoder = require('esc-pos-encoder');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const moment = require('moment');
const { execFile } = require('child_process');

const app = express();

const executor = (path) => new Promise((resolve, reject) => {
  execFile('print', [path], { windowsHide: true }, (err, stdout, stderr) => {
    console.log(stdout);

    if (stdout.indexOf('PRN') !== -1) reject();
    else resolve();
  });
});

const retry = (path) => new Promise((resolve) => {
  executor(path)
    .then(() => {
      resolve();
    })
    .catch((e) => {
      retry(path);
    })
});

const opener = () => {
  const text = String.fromCharCode(0x1B, 0x70, 0x30, 0x37, 0x79);

  const path = `opener.txt`;
  fs.writeFile(path, text, () => {
    retry(path);
  });
}

const printer = (data, reprint = false) => {
  const line = Array(40).fill('-').join('');
  const { transactionData: t, transactionItems: i } = data;

  let text = '';
  if (!reprint) text += String.fromCharCode(0x1B, 0x70, 0x30, 0x37, 0x79);

  text += '\n         Los Manggalenos Store\n';
  text += '          Brgy. Manggalang I,\n';
  text += '            Sariaya, Quezon\n';
  text += line + '\n';
  text += `Receipt No.: ${t.transactionNumber}\n`;
  text += `Cashier: ${t.cashier}\n`;
  text += `Customer: ${t.customer === 'DEFAULT CUSTOMER' ? 'Walk In' : t.customer}\n`;
  text += line + '\n';

  i.forEach((item) => {
    const qp = `${item.qty} X ${parseFloat(`${item.unit_price}`).toFixed(2)}`.padEnd(20, ' ');
    const t = parseFloat(`${item.total_price}`).toFixed(2).padStart(20, ' ');

    text += item.description + '\n';
    text += `${qp}${t}\n`;
  });

  text += line + '\n';
  text += 'Sub-total:          ';
  text += parseFloat(`${t.totalAmount}`).toFixed(2).padStart(20, ' ');
  text += '\nLess Discount:      ';
  text += parseFloat(`${t.totalAmount}`).toFixed(2).padStart(20, ' ');
  text += '\nNet Total:          ';
  text += parseFloat(`${t.netTotal}`).toFixed(2).padStart(20, ' ');
  text += '\nCash Tendered:      ';
  text += parseFloat(`${t.amountTendered}`).toFixed(2).padStart(20, ' ');
  text += '\nChange Due:         ';
  text += parseFloat(`${t.tenderChange}`).toFixed(2).padStart(20, ' ');

  text += '\n\n     THIS IS NOT AN OFFICIAL RECEIPT\n';
  text += '     Thank you for shopping with us!\n';
  text += '        ' + moment().format('MMM DD, YYYY hh:mm:ss A');
  text += '\n\n\n\n\n\n\n\n\n'

  const filename = `${t.transactionNumber}`.split('-').join('').padStart(12, '0');

  const path = `${filename}.txt`;
  fs.writeFile(path, text, () => {
    retry(path);
  });
}

app.use(bodyParser.json());

app.post('/', async (req, res) => {
  printer(req.body);
  res.json({ success: true });
});

app.post('/reprint', async (req, res) => {
  printer(req.body, true);
  res.json({ success: true });
});


app.get('/open', async (req, res) => {
  opener();
  res.json({ success: true });
});

app.listen(3000);
