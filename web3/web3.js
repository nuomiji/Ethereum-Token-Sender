const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const config = require('../config/config.js');
const request = require('request');

var web3;

function sendATx(txInfo, buildTx) {
	// console.log("sendATx: txCount:", txInfo.txCount);
	// console.log("sendATx: toAddress", txInfo.toAddress);
	return new Promise((resolve, reject) => {
		var rawTx = buildTx(txInfo);
		var tx = new Tx(rawTx);

		try {
			tx.sign(txInfo.myPrivateKey);
		} catch (e) {
			reject(e);
			return;
		}

		var serializedTx = '0x' + tx.serialize().toString('hex');

		let transactionRecord = {
			Name: txInfo.name,
			Address: txInfo.toAddress,
			Amount: txInfo.amount
		}

		web3.eth.sendSignedTransaction(serializedTx)
			.on('transactionHash', (hash) => {
				console.log(hash);
				transactionRecord.hash = hash;
				resolve(transactionRecord);
			})
			.on('error', (error) => {
				console.log("rejected");
				reject(error);
			})
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
					TxHash: hash,
				}
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
				next(new Error(req.errorMessage));
			} else {
				var abiArray = JSON.parse(JSON.parse(data).result);
				res.locals.contract = new web3.eth.Contract(abiArray, res.locals.contractAddress);
				next();
			}
		})
	},

	sendTxs: function(txInfo, buildTx) {
		return new Promise((resolve, reject) => {
			web3.eth.getTransactionCount(txInfo.myAddress)
				.then((transactionCount) => {
					txInfo.txCount = transactionCount;
					var promises = [];
					for (let i = 0; i < txInfo.csvInput.length; i++) {
						var element = txInfo.csvInput[i];

						txInfo.toAddress = element.Address;
						txInfo.amount = element.Amount;
						txInfo.name = element.Name;

						promises.push(sendATx(txInfo, buildTx));

						txInfo.txCount = txInfo.txCount + 1;
					}

					Promise.all(promises)
						.then((transactionRecords) => {
							resolve(transactionRecords);
						}, (reason) => {
							reject(reason);
						})
				})
		})
	},

	sendTx: function(txInfo, buildTx) {
		return new Promise((resolve, reject) => {
			web3.eth.getTransactionCount(txInfo.myAddress)
				.then((transactionCount) => {
					console.log("sendTx: transactionCount:", transactionCount);
					txInfo.txCount = transactionCount;
					sendATx(txInfo, buildTx)
						.then((transactionRecord) => {
							resolve(transactionRecord);
						}, (reason) => {
							reject(reason);
						})
				})
		})
	},

	buildTokenTx: function(txInfo) {
		var data = txInfo.contract.methods.transfer(txInfo.toAddress, txInfo.amount).encodeABI();

		return {
			"nonce": txInfo.txCount,
			"gasPrice": Web3.utils.toHex(Web3.utils.toWei(txInfo.gasPrice, "shannon")),
			"gasLimit": Web3.utils.toHex(config.gasLimit),
			"to": txInfo.contractAddress,
			"value": Web3.utils.toHex(0),
			"data": data,
		}
	},

	buildRawTokenTx: function(txInfo) {

		return function(nonce, toAddress, amount) {
			var data = txInfo.contract.methods.transfer(toAddress, amount).encodeABI();

			return {
				"nonce": nonce,
				"gasPrice": Web3.utils.toHex(Web3.utils.toWei(txInfo.gasPrice, "shannon")),
				"gasLimit": Web3.utils.toHex(config.gasLimit),
				"to": txInfo.contractAddress,
				"value": Web3.utils.toHex(0),
				"data": data,
			}
		}
	},

	buildEthTx: function(txInfo) {
		return {
			"nonce": txInfo.txCount,
			"gasPrice": Web3.utils.toHex(Web3.utils.toWei(txInfo.gasPrice, "shannon")),
			"gasLimit": Web3.utils.toHex(config.gasLimit),
			"to": txInfo.toAddress,
			"value": Web3.utils.toHex(txInfo.amount)
		}
	},

	buildRawEthTx: function(txInfo) {

		return function(nonce, toAddress, amount) {
			return {
				"nonce": nonce,
				"gasPrice": Web3.utils.toHex(Web3.utils.toWei(txInfo.gasPrice, "shannon")),
				"gasLimit": Web3.utils.toHex(config.gasLimit),
				"to": toAddress,
				"value": Web3.utils.toHex(amount)
			}
		}
	}
}
