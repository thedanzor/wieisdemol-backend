const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors')

// Mongo Stuff
const uri = ''

// Express Stuff
const app = express()

app.use(cors()) // For cors policies
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const port = 3030

// Get information from the database on how far we are
app.get('/status', function (routeRequest, routeResponse) {
  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(async err => {
    const database = client.db("wieisdemol")

    const general = database.collection("general");
    const bets = database.collection("bets");
    const players = database.collection("players");

    players.find().toArray((err, players) => {
      const filteredPlayers = []
      players.forEach(player => {
        filteredPlayers.push({
          name: player.name,
          points: player.points,
          mostSuspected: player.mostSuspected
        })
      })

      bets.find().toArray((err, bets) => {
        const currentBets = bets

        general.find().toArray((err, data) => {
          const generalData = data

          const response = {
            bets: currentBets,
            general: generalData,
            players: filteredPlayers
          }
      
          routeResponse.send(response)
          client.close();
        })
      })
    })
  });
})

// Get information from the database on how far we are
app.get('/bets', function (routeRequest, routeResponse) {
  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(async err => {
    const database = client.db("wieisdemol")
    const bets = database.collection("bets");

    bets.find().toArray((err, bets) => {
      const currentBets = bets

      routeResponse.send(currentBets)
      client.close();
    })
  })
})

// Login as a user
app.get('/login/:user', function (routeRequest, routeResponse) {
  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(async err => {
    const players = client.db("wieisdemol").collection("players");

    players.find({ username: routeRequest.params.user }).toArray((err, res) => {
      if (res && res[0] && res[0].name) {
        routeResponse.send(res[0])
      } else {
        routeResponse.send({ errorMessageUnique: 'user not found', ...err })
      }
    })
    client.close();
  });
})

app.post('/update/:user', function (routeRequest, routeResponse) {
  const { body } = routeRequest
  const { name, username, mostSuspected, setup } = body

  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(async err => {
    const players = client.db("wieisdemol").collection("players");
    
    players.updateOne(
      { username: routeRequest.params.user},
      { $set: { name, username, mostSuspected, setup }},
      { upsert: true }
    )

    routeResponse.send(body)
    client.close();
  })
})

app.post('/bets/:week/:user', function (routeRequest, routeResponse) {
  const { body } = routeRequest
  const { user, week } = routeRequest.params

  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(async err => {
    const players = client.db("wieisdemol").collection("bets");
    
    players.updateOne(
      { week: parseInt(week) },
      { $set: { [user]: body }},
      { upsert: true }
    )

    routeResponse.send(body)
    client.close();
  })
})

// Expose app informationm
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))