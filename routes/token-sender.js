var express = require('express');
var router = express.Router();
const Web3 = require('web3');
const formidable = require('formidable');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const config = require('../config/config.js');
const request = require('request');
const Tx = require('ethereumjs-tx');
const delay = require('delay');
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

var transactionRecords = [];

router.post('/', parseUserInput, setupNetwork, (req, res, next) => {
	console.log("getTransactionCount");
	web3.eth.getTransactionCount(res.locals.myAddress)
		.then((transactionCount) => {
			console.log("sendTokens");
			sendTokens(res.locals.myAddress, res.locals.myPrivateKey, {
					transactionCount,
					contract: res.locals.contract,
					contractAddress: res.locals.contractAddress,
					gasPrice: res.locals.gasPrice
				}, res.locals.csvInput)
				.catch((error) => { // if rejected, go to error handling route
					console.log("Caught error in .catch!!");
					req.errorMessage = error.message;
					next('route');
				})
		})
		.then(() => {
			console.log("writeToCSV");
			writeToCSV(res.locals.csvInput.length);
			setTimeout(() => {
				let redirectPrefix = res.locals.chainId === '0x03' ? 'ropsten.' : '';
				console.log("Redirecting...");
				res.redirect('https://' + redirectPrefix + 'etherscan.io/address/' + res.locals.myAddress);
			}, 5000)
		})
})

function sendTokens(myAddress, myPrivateKey, transactionInfo, csvInput) {
	var promises = [];
	for (let i = 0; i < csvInput.length; i++) {
		var element = csvInput[i];

		var toAddress = element.Address;
		var amount = element.Amount;
		var name = element.Name;

		var rawTransaction = buildRawTransaction(transactionInfo, toAddress, amount);
		var tx = new Tx(rawTransaction);

		tx.sign(myPrivateKey);
		var serializedTx = '0x' + tx.serialize().toString('hex');

		promises.push(sendToken(serializedTx, toAddress, amount, name))

		transactionInfo.transactionCount++;
	}

	return Promise.all(promises)
}

function sendToken(serializedTx, toAddress, amount, name) {
	console.log("Starting in sendToken");
	return new Promise((resolve, reject) => {
		web3.eth.sendSignedTransaction(serializedTx)
			.on('transactionHash', (hash) => {
				let transactionRecord = {
					Name: name,
					Address: toAddress,
					Amount: amount,
					TxHash: hash,
				}
				transactionRecords.push(transactionRecord);
				console.log(hash);
				resolve();
			})
			.on('error', (error) => {
				console.log("rejected");
				reject(error);
			})
	})
}

function buildRawTransaction(transactionInfo, toAddress, amount) {
	var data = transactionInfo.contract.methods.transfer(toAddress, amount).encodeABI();

	return {
		"nonce": transactionInfo.transactionCount,
		"gasPrice": Web3.utils.toHex(web3.utils.toWei(transactionInfo.gasPrice, "shannon")),
		"gasLimit": web3.utils.toHex(config.gasLimit),
		"to": transactionInfo.contractAddress,
		"value": web3.utils.toHex(0),
		"data": data,
	}
}

function parseUserInput(req, res, next) {
	console.log("parseUserInput");
	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		res.locals.myAddress = fields.fromAddress;
		res.locals.myPrivateKey = new Buffer(fields.fromPrivateKey, 'hex');
		res.locals.contractAddress = fields.contractAddress;
		res.locals.chainId = fields.chainId;
		res.locals.gasPrice = fields.gasPrice;
		res.locals.csvInput = parse(fs.readFileSync(files.destinations.path, 'utf-8'), {
			columns: true
		})
		next();
	})
}

function setupNetwork(req, res, next) {
	console.log("setupNetwork");
	var chainId = res.locals.chainId;
	let providerPrefix = chainId === '0x03' ? 'ropsten' : 'mainnet';
	let providerUrl = 'https://' + providerPrefix + '.infura.io/vCfQu4uCspVZEATQTcmJ';
	web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

	let etherscanPrefix = chainId === '0x03' ? '-ropsten' : '';
	let etherscanURL = 'https://api' + etherscanPrefix + '.etherscan.io/api?module=contract&action=getabi&address=' + res.locals.contractAddress + '&apikey=' + config.etherscanApiKey;
	request(etherscanURL, (error, response, data) => {
		if (JSON.parse(data).status === '0') {
			req.errorMessage = JSON.parse(data).result;
			next('route');
		} else {
			var abiArray = JSON.parse(JSON.parse(data).result);
			res.locals.contract = new web3.eth.Contract(abiArray, res.locals.contractAddress);
			next();
		}
	})
}

async function writeToCSV(inputLength) {
	while (transactionRecords.length !== inputLength) {
		await delay(2000);
	}
	csvWriter.writeRecords(transactionRecords)
		.then(() => {
			console.log("...Done");
		});
}

module.exports = router;
