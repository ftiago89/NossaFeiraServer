const mongoose = require('mongoose');

let connection = null;

async function db() {
  if (connection === null) {
    connection = mongoose
      .connect(process.env.DB, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      })
      .then(() => console.log('connected to MongoDB!'));

    await connection;
  }

  return connection;
}

module.exports = db;
