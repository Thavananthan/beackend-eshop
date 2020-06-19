const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');

const userRouter = require('./routes/userRouter');
const mainCategoryRouter = require('./routes/mainCategoryRouter');
const subCategory = require('./routes/subCategoryRouter');
const subclassification = require('./routes/subClassificationRouter');
const review = require('./routes/reviewRouter');
const products = require('./routes/productRouter');
const AppError = require('./utils/appError');
const golobalErrorController = require('./controllers/errorController');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.all((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.header(
      'Access-Control-Allow-Methods',
      'PUT',
      'POST',
      'PATCH',
      'DELETE',
      'GET'
    );
    return res.status(200).json({});
  }

  next();
});

//Global Middelware
// set security HTTP headers
app.use(helmet());
app.use(cors());

//Body parser, reading data from body into req.body
app.use(express.json());

//Data sanitization against NoSQL query Injection
app.use(mongoSanitize());

//Data sanitization againts XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp());

//Serving static files
app.use(express.static(`${__dirname}/public`));

app.use(compression());

//ROUTERS
app.use('/api/user', userRouter);
app.use('/api/category', mainCategoryRouter);
app.use('/api/subcategory', subCategory);
app.use('/api/subclassification', subclassification);
app.use('/api/products', products);
app.use('/api/review', review);

app.get('/', (req, res) => {
  res.status(200).json({ Message: 'Love you babe miss u!' });
});

app.all('*', (req, res, next) => {
  next(new AppError(`i can't find ${req.originalUrl} on this server`, 404));
});

app.use(golobalErrorController);

module.exports = app;
