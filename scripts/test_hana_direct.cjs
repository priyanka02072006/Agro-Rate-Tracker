const hana = require('@sap/hana-client');
require('dotenv').config();

const conn = hana.createConnection();

const connParams = {
  serverNode: `${process.env.HANA_HOST}:${process.env.HANA_PORT}`,
  uid: process.env.HANA_USER,
  pwd: process.env.HANA_PASSWORD,
  currentSchema: process.env.HANA_SCHEMA,
  encrypt: true,
  sslValidateCertificate: false,
  sslCryptoProvider: 'openssl',
};

console.log('Attempting connection to SAP HANA Cloud...');
console.log('Host:', process.env.HANA_HOST);
console.log('Schema:', process.env.HANA_SCHEMA);
console.log('User:', process.env.HANA_USER?.substring(0, 10) + '...');

conn.connect(connParams, (err) => {
  if (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
  console.log('SUCCESS: Connected to SAP HANA Cloud database!');
  
  conn.exec('SELECT CURRENT_UTCTIMESTAMP, CURRENT_SCHEMA, VERSION FROM M_DATABASE', (err, rows) => {
    if (err) {
      console.error('Query failed:', err.message);
    } else {
      console.log('Database Info:', rows);
    }
    conn.disconnect();
  });
});
