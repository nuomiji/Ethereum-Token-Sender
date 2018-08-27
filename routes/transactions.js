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
router.use("/batch", parseUserInputBatch, web3.setupNetwork);

router.use('/single', parseUserInputSingle, web3.setupNetwork);

router.post('/single/token', web3.getContract, (req, res, next) => {
	res.locals.isTokenTx = true;
	console.log("SendTokenSingle");
	// console.log("/single/token: res.locals:", res.locals);
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


// ether transfer transactions
router.post('/ether', (req, res, next) => {
	res.locals.isTokenTx = false;
	console.log("sendEthers");
	web3.sendTxs(res.locals,
			web3.buildRawEthTx(res.locals))
		.then((transactionRecords) => {
			res.locals.transactionRecords = transactionRecords;
			next();
		}, (reason) => { // if rejected, go to error handling route
			next(reason);
		})
})

router.use(writeToCSV, redirect);

function parseUserInputBatch(req, res, next) {
	console.log("parseUserInputBatch");
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

function parseUserInputSingle(req, res, next) {
	console.log("parseUserInputSingle");
	res.locals.myAddress = req.body.fromAddress;
	res.locals.myPrivateKey = new Buffer(req.body.fromPrivateKey, 'hex');
	res.locals.contractAddress = req.body.contractAddress;
	res.locals.chainId = req.body.chainId;
	res.locals.gasPrice = req.body.gasPrice;
	res.locals.toAddress = req.body.toAddress;
	res.locals.amount = req.body.amount;
	res.locals.name = req.body.name;
	next();
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
