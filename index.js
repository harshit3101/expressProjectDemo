const express = require('express');
const session = require('express-session');
const { uniqueNamesGenerator, starWars } = require('unique-names-generator');
const MongoStore = require('connect-mongo');
const { MongoClient, ServerApiVersion } = require('mongodb');
const user = require('./user');
const bodyParser = require('body-parser');
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');


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
  store: MongoStore.create({clientPromise: storeClient.connect()}),
  cookie: { maxAge: 60* 60 * 1000 } // 1 hour
}));

// Configure More Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(user.createStrategy());

// To use with sessions
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.get('/', (req, res) => {
 res.json({msg: "HomePage"});
});

app.get('/getNames', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  if(!req.session.names){
  req.session.names = getStarWarsCharacters();
  }
 res.json(req.session.names);
});


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

app.get('/updateLocation', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  let latitude = req.query.latitude;
  let longitude = req.query.longitude;

  if(latitude && longitude){
    let user = req.user;

    user.location.latitude = latitude;
    user.location.longitude = longitude;

    user.save().then(
      res => {console.log(res)},
      err => {console.log(err)}
    );

    res.status(200).json({user:req.user})
  }else{
    res.send("Please provide latitude and longitude as query params");
  }
});


app.get('/register-user', (req, res) => {
  let userName = req.query.userName;
  let password = req.query.password;
  let latitude = req.query.latitude;
  let longitude = req.query.longitude;

  if(userName && password && latitude && longitude){
      user.register({ username: userName, location: {latitude: latitude , longitude: longitude}, active: false }, password, (err, result)=> {
        if(err){
          res.status(200).json({msg:err});
        }else{
          res.status(200).json({msg:"user registered in DataBase"});
        }
      });
     
  }else{
    res.send("Please provide userName and password and latitude and longitude as query params");
  }
});

app.get('/get-users-data', (req, res) => {
  return mongoClient.connect().then(client => {
    client.db().collection('userdetails').find({}).toArray((err, results) => {
      res.json(results)
    }
    );
  });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/' }),  function(req, res) {
	console.log(req.user)
	res.send('successfully logged in');
});

app.listen(3000, () => {
 console.log('Server started on port 3000');
});
