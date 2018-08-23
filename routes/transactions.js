var express = require('express');
var router = express.Router();
const Web3 = require('web3');
const formidable = require('formidable');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const config = require('../config/config.js');
const delay = require('delay');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const web3 = require('../web3/web3.js');

router.use('/', parseUserInput, web3.setupNetwork);

router.post('/token', web3.getContract, (req, res, next) => {
	console.log("sendTokens");
	web3.sendTxs(res.locals.myAddress,
			res.locals.myPrivateKey,
			res.locals.csvInput,
			buildRawTransaction(res.locals.contract, res.locals.contractAddress, res.locals.gasPrice))
		.then((transactionRecords) => {
			writeToCSV(transactionRecords, "token");
			next();
		}, (reason) => { // if rejected, go to error handling route
			console.log("Caught error in .catch!!");
			req.errorMessage = reason.message;
			next('route');
		})
}, redirect)

router.post('/ether', (req, res, next) => {
	console.log("sendEthers");
	web3.sendTxs(res.locals.myAddress,
			res.locals.myPrivateKey,
			res.locals.csvInput,
			buildRawEtherTransaction(res.locals.gasPrice))
		.then((transactionRecords) => {
			writeToCSV(transactionRecords, "ether");
			next();
		}, (reason) => { // if rejected, go to error handling route
			console.log("Caught error in .catch!!");
			req.errorMessage = reason.message;
			next('route');
		})
}, redirect)

function buildRawTransaction(contract, contractAddress, gasPrice) {

	return function(nonce, toAddress, amount) {
		var data = contract.methods.transfer(toAddress, amount).encodeABI();

		return {
			"nonce": nonce,
			"gasPrice": Web3.utils.toHex(Web3.utils.toWei(gasPrice, "shannon")),
			"gasLimit": Web3.utils.toHex(config.gasLimit),
			"to": contractAddress,
			"value": Web3.utils.toHex(0),
			"data": data,
		}
	}
}

function buildRawEtherTransaction(gasPrice) {

	return function(nonce, toAddress, amount) {
		return {
			"nonce": nonce,
			"gasPrice": Web3.utils.toHex(Web3.utils.toWei(gasPrice, "shannon")),
			"gasLimit": Web3.utils.toHex(config.gasLimit),
			"to": toAddress,
			"value": Web3.utils.toHex(amount)
		}
	}
}

function parseUserInput(req, res, next) {
	console.log("parseUserInput");
	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		res.locals.myAddress = fields.fromAddress;
		res.locals.myPrivateKey = new Buffer(fields.fromPrivateKey, 'hex');
		res.locals.contractAddress = fields.contractAddress;
		if (typeof fields.chainId !== 'undefined') {
			res.locals.chainId = fields.chainId;
		}
		res.locals.gasPrice = fields.gasPrice;
		res.locals.csvInput = parse(fs.readFileSync(files.destinations.path, 'utf-8'), {
			columns: true
		})
		next();
	})
}

function writeToCSV(transactionRecords, txType) {

	var csvWriter = createCsvWriter({
		path: './outputs/transactions-' + txType + '.csv',
		header: [{ id: 'Name', title: 'Name' }, { id: 'Address', title: 'Address' }, { id: 'Amount', title: 'Amount' }, { id: 'TxHash', title: 'TxHash' }, ]
	});

	console.log("writeToCSV");
	csvWriter.writeRecords(transactionRecords)
		.then(() => {
			console.log("...Done");
		});
}

function redirect(req, res) {
	setTimeout(() => {
		let redirectPrefix = res.locals.chainId === '0x03' ? 'ropsten.' : '';
		console.log("Redirecting...");
		res.redirect('https://' + redirectPrefix + 'etherscan.io/address/' + res.locals.myAddress);
	}, 3000)
}

module.exports = router;
