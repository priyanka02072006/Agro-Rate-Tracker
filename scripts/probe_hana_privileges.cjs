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

conn.connect(connParams, async (err) => {
  if (err) {
    console.error('Conn error:', err);
    process.exit(1);
  }

  function query(sql) {
    return new Promise((resolve) => {
      conn.exec(sql, (err, rows) => {
        if (err) resolve({ error: err.message });
        else resolve({ rows });
      });
    });
  }

  console.log('--- Current User & Schema ---');
  console.log(await query('SELECT CURRENT_USER, CURRENT_SCHEMA FROM DUMMY'));

  console.log('--- Granted Privileges for User ---');
  console.log(await query(`SELECT PRIVILEGE, OBJECT_TYPE, SCHEMA_NAME FROM SYS.GRANTED_PRIVILEGES WHERE GRANTEE = CURRENT_USER`));

  console.log('--- Granted Roles for User ---');
  console.log(await query(`SELECT ROLE_NAME FROM SYS.GRANTED_ROLES WHERE GRANTEE = CURRENT_USER`));

  console.log('--- Accessible Schemas ---');
  console.log(await query(`SELECT SCHEMA_NAME, SCHEMA_OWNER FROM SYS.SCHEMAS WHERE SCHEMA_NAME LIKE '%07083DD5224243A8B73B330781FE33B6%' OR SCHEMA_OWNER = CURRENT_USER`));

  // Try creating a table in the user's default schema (without explicit schema qualification or in CURRENT_SCHEMA)
  console.log('--- Try Creating a simple table in CURRENT_USER schema ---');
  console.log(await query('CREATE LOCAL TEMPORARY TABLE #TEMP_AGRO (ID INT)'));
  console.log(await query('CREATE COLUMN TABLE "TEST_AGRO" (ID INT PRIMARY KEY)'));

  conn.disconnect();
});
