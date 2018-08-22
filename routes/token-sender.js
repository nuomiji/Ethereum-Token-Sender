var express = require('express');
var router = express.Router();
const Web3 = require('web3');
const formidable = require('formidable');
const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const config = require('../config/config.js');
const delay = require('delay');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
	path: './outputs/transactions-token.csv',
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
const web3 = require('../web3/web3.js');

var transactionRecords = [];

router.post('/', parseUserInput, (req, res, next) => {
	console.log("sendTokens");
	web3.sendTokens(res.locals.myAddress, res.locals.myPrivateKey, {
				chainId: res.locals.chainId,
				contract: res.locals.contract,
				contractAddress: res.locals.contractAddress,
				gasPrice: res.locals.gasPrice
			}, res.locals.csvInput,
			buildRawTransaction)
		.then((transactionRecords) => {
			writeToCSV(transactionRecords);
			setTimeout(() => {
				let redirectPrefix = res.locals.chainId === '0x03' ? 'ropsten.' : '';
				console.log("Redirecting...");
				res.redirect('https://' + redirectPrefix + 'etherscan.io/address/' + res.locals.myAddress);
			}, 5000)
		}, (reason) => { // if rejected, go to error handling route
			console.log("Caught error in .catch!!");
			req.errorMessage = reason.message;
			next('route');
		})
})

function buildRawTransaction(transactionInfo, toAddress, amount) {
	var data = transactionInfo.contract.methods.transfer(toAddress, amount).encodeABI();

	return {
		"nonce": transactionInfo.transactionCount,
		"gasPrice": Web3.utils.toHex(Web3.utils.toWei(transactionInfo.gasPrice, "shannon")),
		"gasLimit": Web3.utils.toHex(config.gasLimit),
		"to": transactionInfo.contractAddress,
		"value": Web3.utils.toHex(0),
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





async function writeToCSV(transactionRecords) {
	console.log("writeToCSV");
	csvWriter.writeRecords(transactionRecords)
		.then(() => {
			console.log("...Done");
		});
}

module.exports = router;
