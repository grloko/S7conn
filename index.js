const dateFormat = require('dateformat')
const config = require('./config.json')
const nodes7 = require('nodes7')
const Datastore = require('nedb')
const fs = require('fs')

var db = new Datastore({ filename: './db', autoload: true })
const conn = new nodes7()

conn.initiateConnection(
  //pega as configurações no arquivo 'config.json'
  {
    port: config.clp.port,
    host: config.clp.host,
    rack: config.clp.rack,
    slot: config.clp.slot
  },
  (err) => {
    if (err) console.log(err)
    else {
      //caso a conexão seja bem estabelecida, começa a leitura das variáveis
      conn.setTranslationCB((tag) => {
        return config.variables[tag]
      })
      conn.addItems(Object.keys(config.variables))
      setInterval(() => {
        conn.readAllItems(valuesRead)
      }, 15000)
    }
  }
)

function valuesRead(err, values) {
  if (err) {
    console.log('Error reading values!')
    process.exit()
  } else {
    console.log('Values read from CLP.')
    let today = Date.now()
    let message = Object.assign(
      { date: dateFormat(today, 'mm/dd/yyyy-HH:MM:ss'), sent: false },
      values
    )
    db.insert(message, (err, doc) => {
      if (err) console.log(err.message)
      console.log(
        'Valores inseridos no banco de dados:\n    ' + JSON.stringify(doc)
      )
    })
    //send(message)
  }
}
