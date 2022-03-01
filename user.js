const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING,{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Schema = mongoose.Schema;

const User = new Schema({
  username: {
      type: String,
      required: true
  },
  password: {
    type: String
}
});


User.plugin(passportLocalMongoose);

module.exports = mongoose.model('userdetail', User);