'use strict'

const dateFormat = require('dateformat')
const nodes7 = require('nodes7')
const config = require('./config.json')
const Datastore = require('nedb')

var db = new Datastore({ filename: './db', autoload: true })

const conn = new nodes7()

const connInitiate = () => {
  conn.initiateConnection(
    //pega as configurações no arquivo 'config.json'
    {
      port: config.clp.port,
      host: config.clp.host,
      rack: config.clp.rack,
      slot: config.clp.slot
    },
    connected
  )
}

const connected = (err) => {
  if (err) {
    console.error(err)
    conn.dropConnection(() => setTimeout(connInitiate, 30000))
  } else {
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

const valuesRead = (err, values) => {
  if (err) {
    console.error('Error reading values!')
    process.exit()
  } else {
    console.info('Values read from CLP.')
    let today = Date.now()
    let message = Object.assign(
      { date: dateFormat(today, 'mm/dd/yyyy-HH:MM:ss'), sent: false },
      values
    )
    db.insert(message, (err, doc) => {
      if (err) console.log(err.message)
      else {
        console.log(
          'Valores inseridos no banco de dados:\n    ' + JSON.stringify(doc)
        )
      }
    })
  }
}

function checkSentStatus() {
  db.findOne({ sent: false }, (err, doc) => {
    if (err) console.log(err.message)
    else if (doc) {
      console.log('Dado pendente: \n    ' + JSON.stringify(doc))
      //enviarDado(()=>{EXECUTAR COMANDO ABAIXO})
      db.update({ _id: doc._id }, { $set: { sent: true } }, {}, (err) => {
        if (err) console.log(err.message)
        else {
          console.log('Dado enviado.')
        }
        setTimeout(checkSentStatus(), 3000)
      })
      ///////////////////////////////////////////////////////////////////////////////////////////
    } else {
      console.log('Nenhum dado pendente!')
    }
  })
}

connInitiate()
checkSentStatus()
