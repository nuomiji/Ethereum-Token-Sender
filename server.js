const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.get('/', (req, res, next) => {
	res.redirect('http://localhost:8080/static/sendToken.html');
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
const tokenSender = require('./routes/token-sender');
const etherSender = require('./routes/ether-sender');

app.use('/wallet', wallet);

app.use('/send-token', tokenSender);

app.use('/send-ether', etherSender);

app.use('/', (req, res) => {
	console.log("Bad Request");
	console.log(req.errorMessage);
	res.status(400).send(req.errorMessage);
})


var port = 8080;
app.listen(port, () => console.log("Listening on port: " + port));
