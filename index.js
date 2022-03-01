const express = require('express');
const session = require('express-session');
const { uniqueNamesGenerator, starWars } = require('unique-names-generator');
const MongoStore = require('connect-mongo');
const { MongoClient, ServerApiVersion } = require('mongodb');


// enrionment vairbale
const MONGO_DB_CONNECTION_STRING = process.env.MONGO_DB_CONNECTION_STRING;

const app = express();// Get maximum character from ENVs else return 5 character

const MAX_STAR_WARS_CHARACTERS = process.env.MAX_STAR_WARS_CHARACTERS || 5;

const config = {
  dictionaries: [starWars]
}// Get the character name array

const getStarWarsCharacters = () => {
 const characterNames = [];for (let i = 1; i <= MAX_STAR_WARS_CHARACTERS; i += 1) {
  characterNames.push(uniqueNamesGenerator(config));
 }
 return characterNames;
};

const mongoClient = new MongoClient(MONGO_DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const storeClient = new MongoClient(MONGO_DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.use(session({
  secret: 'Very Easy Secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({clientPromise: storeClient.connect()})
}));

app.get('/', (req, res) => {
  if(!req.session.names){
  req.session.names = getStarWarsCharacters();
  }
 res.json(req.session.names);
});

// function(err, results) {
//   res.send(results);
// }

app.get('/get-session-data', (req, res) => {
  return mongoClient.connect().then(client => {
    client.db().collection('sessions').find({}).toArray((err, results) => {
      res.json(results)
    }
    );
  });
});

app.get('/delete-session', (req, res) => {
  req.session.destroy();
 res.send("done");
});

app.listen(3000, () => {
 console.log('Server started on port 3000');
});
