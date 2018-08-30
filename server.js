const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.get('/', (req, res, next) => {
	res.redirect('static/html/main.html');
});
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

const wallet = require('./routes/wallet');
const send = require('./routes/transactions');

app.use('/wallet', wallet);

app.use('/send', send);

app.use('/', (err, req, res, next) => {
	console.log("Bad Request");
	console.error(err);
	res.status(400).send(err.message);
})


var port = 8080;
app.listen(port, () => console.log("Listening on port: " + port));
