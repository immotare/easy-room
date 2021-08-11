require('dotenv').config();
const DB = require('../modules/pgs_db')

const db = new DB(process.env.DATABASE_URL);
db.connect();

