const config = require('./config/config.js');
var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const formidable = require('formidable');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const delay = require('delay');
const request = require('request');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
	path: './outputs/transactions.csv',
	header: [{
			id: 'Name',
			title: 'Name'
		},
		{
			id: 'Address',
			title: 'Address'
		},
		{
			id: 'Amount',
			title: 'Amount'
		},
		{
			id: 'TxHash',
			title: 'TxHash'
		},

	]
});

const Tx = require('ethereumjs-tx');
const Web3 = require('web3');

var transactionRecords = [];
var web3;

// app.use() specifies the middleware in handling a request
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.post('/send', (req, res, next) => {
	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {

		if (!fields.fromAddress || !fields.fromPrivateKey || files.destinations.size === 0) {
			console.log("Invalid user input");
		} else {
			var myAddress = fields.fromAddress;
			var myPrivateKey = new Buffer(fields.fromPrivateKey, 'hex');
			var contractAddress = fields.contractAddress;
			var chainId = fields.chainId;
			let etherscanPrefix = chainId === '0x03' ? '-ropsten' : '';
			let providerPrefix = chainId === '0x03' ? 'ropsten' : 'mainnet';
			let providerUrl = 'https://' + providerPrefix + '.infura.io/vCfQu4uCspVZEATQTcmJ';
			web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
			let etherscanURL = 'https://api' + etherscanPrefix + '.etherscan.io/api?module=contract&action=getabi&address=' + contractAddress + '&apikey=' + config.etherscanApiKey;
			// console.log(etherscanURL);

			input = parse(fs.readFileSync(files.destinations.path, 'utf-8'), {
				columns: true
			});
			request(etherscanURL, (error, response, data) => {
				try {
					var abiArray = JSON.parse(JSON.parse(data).result);
					// console.log(abiArray);

					var contract = new web3.eth.Contract(abiArray, contractAddress);

					web3.eth.getTransactionCount(myAddress)
						.then((transactionCount) => {

							sendTokens(myAddress, myPrivateKey, input, transactionCount, contract, contractAddress)
								.catch((error) => {
									console.log("Caught error in main!!");
									next('route');
								})
								.then(() => {
									writeToCSV(input);
								})
						});

					setTimeout(() => {
						let redirectPrefix = chainId === '0x03' ? 'ropsten.' : '';
						res.redirect('https://' + redirectPrefix + 'etherscan.io/address/' + myAddress);
					}, 5000);
				} catch (e) {
					// console.error(e);
					console.log("There's an error!");
					console.log(e);
					next('route');
				}
			});
		}
	});
});


app.post('/send', (req, res) => {
	console.log("Bad Request");
	res.sendStatus(400);
})

app.get('/wallet/keypair', (req, res) => {
	var newAccount = web3.eth.accounts.create();
	var keyPair = {
		address: newAccount.address,
		privateKey: newAccount.privateKey,
	}
	res.send(keyPair);
});

app.post('/wallet/keystore', (req, res) => {
	// console.log(req.body.password);
	var newAccount = web3.eth.accounts.create();
	var keystore = newAccount.encrypt(req.body.password);
	var wallet = {
		address: newAccount.address,
		privateKey: newAccount.privateKey,
		keystore: keystore,
	}
	// console.log(wallet);
	res.send(wallet);
})


var port = 8080;
app.listen(port, () => console.log("Listening on port: " + port));


function sendTokens(myAddress, myPrivateKey, input, transactionCount, contract, contractAddress) {
	return new Promise((resolve, reject) => {

		for (let i = 0; i < input.length; i++) {
			var element = input[i];

			var toAddress = element.Address;
			var amount = element.Amount;
			var name = element.Name;

			var rawTransaction = buildRawTransaction(transactionCount, toAddress, amount, contract, contractAddress);
			var tx = new Tx(rawTransaction);

			tx.sign(myPrivateKey);
			var serializedTx = '0x' + tx.serialize().toString('hex');

			sendToken(serializedTx, toAddress, amount, name)
				.catch((error) => {
					console.log('Caught error in sendTokens!!!!');
					reject(error);
				})

			transactionCount++;
		}
		console.log("sendTokens resolved");
		resolve();
	})
}

function sendToken(serializedTx, toAddress, amount, name) {
	return new Promise((resolve, reject) => {
		web3.eth.sendSignedTransaction(serializedTx)
			.on('transactionHash', (hash) => {
				let transactionRecord = {
					Name: name,
					Address: toAddress,
					Amount: amount,
					TxHash: hash
				}

				transactionRecords.push(transactionRecord);
				console.log(hash);
				resolve();
			})
			.on('error', (error) => {
				console.log('Insufficient funds or invalid private key!');
				reject(error);
			})

	})
}

function buildRawTransaction(nonce, toAddress, amount, contract, contractAddress) {
	var data = contract.methods.transfer(toAddress, amount).encodeABI();

	return {
		"nonce": nonce,
		"gasPrice": Web3.utils.toHex(web3.utils.toWei(config.gasPrice, "shannon")),
		"gasLimit": web3.utils.toHex(config.gasLimit),
		"to": contractAddress,
		"value": web3.utils.toHex(0),
		"data": data,
	}
}

async function writeToCSV(input) {
	while (transactionRecords.length !== input.length) {
		await delay(2000);
	}
	csvWriter.writeRecords(transactionRecords)
		.then(() => {
			console.log("...Done");
		});
}
