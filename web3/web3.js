const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const config = require('../config/config.js');
const request = require('request');

var web3;

function sendTxHelper(txInfo, buildTx) {
	return new Promise((resolve, reject) => {
		let transactionRecord = {
			Name: txInfo.name,
			Address: txInfo.toAddress,
			Amount: txInfo.amount
		}
		web3.eth.sendTransaction(buildTx(txInfo))
			.on('transactionHash', (hash) => {
				console.log(hash);
				transactionRecord.TxHash = hash;
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

	setupAccount: function(req, res, next) {
		console.log("setupAccount");
		switch (res.locals.loginMethod) {
			case "keystore":
				var account = web3.eth.accounts.decrypt(res.locals.keystore, res.locals.password);
				break;
			case "private key":
				var account = web3.eth.accounts.privateKeyToAccount(res.locals.privateKey);
				break;
			default:
				console.error("Invalid Login Method!");
		}
		// console.log(account);
		web3.eth.accounts.wallet.add(account);
		web3.eth.defaultAccount = account.address;
		res.locals.myAddress = account.address;
		// console.log(web3.eth.defaultAccount);
		next();
	},

	getContract: function(req, res, next) {
		console.log("getContract");

		let etherscanPrefix = res.locals.chainId === '0x03' ? '-ropsten' : '';
		let etherscanURL = 'https://api' + etherscanPrefix + '.etherscan.io/api?module=contract&action=getabi&address=' + res.locals.contractAddress + '&apikey=' + config.etherscanApiKey;
		request(etherscanURL, (error, response, data) => {
			if (error) {
				next(error);
				return;
			}
			console.log("typeof data:", typeof data);
			console.log(data.substr(0, 100));
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
			web3.eth.getTransactionCount(web3.eth.defaultAccount)
				.then((transactionCount) => {
					txInfo.txCount = transactionCount;
					var promises = [];
					for (let i = 0; i < txInfo.csvInput.length; i++) {
						var element = txInfo.csvInput[i];

						txInfo.toAddress = element.Address;
						txInfo.amount = element.Amount;
						txInfo.name = element.Name;

						promises.push(sendTxHelper(txInfo, buildTx));

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
					sendTxHelper(txInfo, buildTx)
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
			"from": web3.eth.defaultAccount,
			"to": txInfo.contractAddress,
			"value": Web3.utils.toHex(0),
			"gasPrice": Web3.utils.toHex(Web3.utils.toWei(txInfo.gasPrice, "shannon")),
			"gas": Web3.utils.toHex(70000),
			"nonce": txInfo.txCount,
			"data": data
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
	}

}
