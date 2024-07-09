const path = require('path');
const dotenv = require('dotenv').config();
const express = require('express');
var cors = require('cors');
const app = express();
const db =require('./dbconnect');
const route = require('./routes');
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(
    express.urlencoded({
      extended: true,
    }),
);
db.connect();
app.use(cors({
    origin:'*'
}));
app.use(express.static('public'));
route(app);
const node_port = process.env.PORT;
app.listen(node_port, () => {
    console.log(`Server Started at ${node_port}`)
})