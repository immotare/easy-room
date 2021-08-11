const Pool = require("pg")

module.exports = class DB { 
  constructor (databaseUrl)  {
    this.client = new Pool.Client ({
      connectionString: databaseUrl,
      ssl: true
    });
  }

  connect () {
    this.client.connect();
  }

  query (sqlQuery) {
    this.client.query(sqlQuery);
  }
}