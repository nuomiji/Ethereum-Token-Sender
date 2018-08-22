const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const config = require('../config/config.js');
const request = require('request');

var transactionRecords = [];
var web3;

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
				resolve(transactionRecord);
			})
			.on('error', (error) => {
				console.log("rejected");
				reject(error);
			})
	})
}

module.exports = {

	setupNetwork: function(req, res, next) {
		console.log("setupNetwork");
		let providerPrefix = res.locals.chainId === '0x03' ? 'ropsten' : 'mainnet';
		let providerUrl = 'https://' + providerPrefix + '.infura.io/vCfQu4uCspVZEATQTcmJ';
		web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
		next();
	},

	getContract: function(req, res, next) {
		console.log("getContract");

		let etherscanPrefix = res.locals.chainId === '0x03' ? '-ropsten' : '';
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
	},

	sendTokens: function(myAddress, myPrivateKey, transactionInfo, csvInput, buildRawTransaction) {
		return new Promise((resolve, reject) => {
			web3.eth.getTransactionCount(myAddress)
				.then((transactionCount) => {
					console.log("transactionCount:", transactionCount);
					transactionInfo.transactionCount = transactionCount;
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

					Promise.all(promises)
						.then((transactionRecords) => {
							resolve(transactionRecords);
						}, (reason) => {
							reject(reason);
						})
				})

		})
	}
}
