const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION ! shoutdown....');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const PORT = process.env.PORT || 3000;

//mongoose connect
const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(db, {
    // useNewUrlParser: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then((con) => {
    // console.log(con.connection);
    console.log('DB connection successfully!');
  })
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log('app running on port ' + PORT);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLE REJECTION ! shoutdown....');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
