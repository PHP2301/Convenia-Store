// import.js – Node.js script to import Firebase export JSON files into PostgreSQL
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';
import _ from 'lodash';

dotenv.config();

const client = new Client();
await client.connect();

// Helper: load JSON file (expects an array of objects)
const loadJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ---------- 1️⃣ Import Users ----------
async function importUsers(filePath) {
  const users = loadJSON(filePath);
  const query = `
    INSERT INTO users(uid, email, fullname, fido_credential_id, has_fido)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (uid) DO UPDATE SET
      email = EXCLUDED.email,
      fullname = EXCLUDED.fullname,
      fido_credential_id = EXCLUDED.fido_credential_id,
      has_fido = EXCLUDED.has_fido;
  `;
  for (const u of users) {
    await client.query(query, [
      u.uid,
      u.email,
      u.fullname || null,
      u.fido_credential_id || null,
      !!u.has_fido
    ]);
  }
  console.log(`✅ Imported ${users.length} users`);
}

// ---------- 2️⃣ Import Orders (and order_items) ----------
async function importOrders(filePath) {
  const orders = loadJSON(filePath);
  const orderQry = `
    INSERT INTO orders(order_id, user_id, total)
    VALUES ($1, $2, $3)
    ON CONFLICT (order_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      total   = EXCLUDED.total;
  `;
  const itemQry = `
    INSERT INTO order_items(order_id, product_id, quantity, price)
    VALUES ($1, $2, $3, $4);
  `;
  for (const o of orders) {
    await client.query(orderQry, [o.orderId, o.userId, o.total]);
    if (Array.isArray(o.items)) {
      for (const it of o.items) {
        await client.query(itemQry, [
          o.orderId,
          it.productId,
          it.quantity,
          it.price
        ]);
      }
    }
  }
  console.log(`✅ Imported ${orders.length} orders`);
}

// ---------- Main execution ----------
(async () => {
  try {
    // Replace the filenames below with the actual exported JSON file names.
    await importUsers(path.resolve('data/users_circlek.json'));
    // If you have an orders export file, uncomment the line below and provide the filename.
    // await importOrders(path.resolve('data/orders.json'));
  } catch (e) {
    console.error('❌ Import error:', e);
  } finally {
    await client.end();
  }
})();
