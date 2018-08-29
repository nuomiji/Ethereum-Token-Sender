const express = require('express');
const router = express.Router();
const Web3 = require('web3');
const formidable = require('formidable');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const delay = require('delay');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const config = require('../config/config.js');
const web3 = require('../web3/web3.js');

// parse user input from form and setup Web3 instance in the correct chain
router.use(parseUserInput, web3.setupNetwork, web3.setupAccount);

// router.use('/single', parseUserInputSingle, web3.setupNetwork);

router.post('/single/token', web3.getContract, (req, res, next) => {
	res.locals.isTokenTx = true;
	console.log("SendTokenSingle");
	web3.sendTx(res.locals,
			web3.buildTokenTx)
		.then((transactionRecord) => {
			res.locals.transactionRecords = [transactionRecord];
			next();
		}, (reason) => {
			console.log("error!");
			console.log(reason);
			next(reason);
		})
})

router.post('/batch/token', web3.getContract, (req, res, next) => {
	res.locals.isTokenTx = true;
	console.log("SendTokensBatch");
	web3.sendTxs(res.locals,
			web3.buildTokenTx)
		.then((transactionRecords) => {
			res.locals.transactionRecords = transactionRecords;
			next();
		}, (reason) => {
			console.log(reason);
			next(reason);
		})
})

router.post('/batch/ether', (req, res, next) => {
	res.locals.isTokenTx = false;
	console.log("SendEthersBatch");
	web3.sendTxs(res.locals,
			web3.buildEthTx)
		.then((transactionRecords) => {
			res.locals.transactionRecords = transactionRecords;
			next();
		}, (reason) => {
			console.log(reason);
			next(reason);
		})
})

router.post('/single/ether', (req, res, next) => {
	res.locals.isTokenTx = false;
	console.log("SendEtherSingle");
	web3.sendTx(res.locals,
			web3.buildEthTx)
		.then((transactionRecord) => {
			res.locals.transactionRecords = [transactionRecord];
			next();
		}, (reason) => {
			console.log(reason);
			next(reason);
		})
})

router.use(writeToCSV, redirect);

function parseUserInput(req, res, next) {
	var form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		res.locals.contractAddress = fields.contractAddress;
		res.locals.chainId = fields.chainId;
		res.locals.gasPrice = fields.gasPrice;
		res.locals.loginMethod = fields.loginMethod;
		console.log("Login Method:", res.locals.loginMethod);
		switch (fields.loginMethod) {
			case "keystore":
				res.locals.password = fields.password;
				res.locals.keystore = JSON.parse(fs.readFileSync(files.keystore.path, 'utf-8'));
				break;
			case "private key":
				res.locals.privateKey = fields.privateKey;
				break;
			default:
				console.error("Invalid login method!");
		}
		if (files.destinations) {
			res.locals.csvInput = parse(fs.readFileSync(files.destinations.path, 'utf-8'), {
				columns: true
			})
		} else {
			res.locals.name = fields.name;
			res.locals.toAddress = fields.toAddress;
			res.locals.amount = fields.amount;
		}
		next();
	})
}

function writeToCSV(req, res, next) {
	var txType = res.locals.isTokenTx ? 'token' : 'ether';
	var csvWriter = createCsvWriter({
		path: './outputs/transactions-' + txType + '.csv',
		header: [{
			id: 'Name',
			title: 'Name'
		}, {
			id: 'Address',
			title: 'Address'
		}, {
			id: 'Amount',
			title: 'Amount'
		}, {
			id: 'TxHash',
			title: 'TxHash'
		}, ]
	});

	console.log("writeToCSV");
	csvWriter.writeRecords(res.locals.transactionRecords)
		.then(() => {
			console.log("...Done");
		});

	next();
}

function redirect(req, res) {
	setTimeout(() => {
		let redirectPrefix = res.locals.chainId === '0x03' ? 'ropsten.' : '';
		console.log("Redirecting...");
		res.redirect('https://' + redirectPrefix + 'etherscan.io/address/' + res.locals.myAddress);
	}, 2000)
}

module.exports = router;
