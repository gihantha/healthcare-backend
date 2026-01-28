const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Auth, Patient, Visit, Doctor, Pharmacy routes
app.use('/auth', require('./controllers/authController'));
app.use('/patient', require('./controllers/patientController'));
app.use('/visit', require('./controllers/visitController'));
app.use('/doctor', require('./controllers/doctorController'));
app.use('/pharmacy', require('./controllers/pharmacyController'));

// Swagger docs
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, () => console.log('Server running on port 3000'));
