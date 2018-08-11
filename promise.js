const config = require('./config/config.js')
const Web3 = require('web3')
const Tx = require('ethereumjs-tx')
const request = require('request')

var providerUrl = 'https://ropsten.infura.io/vCfQu4uCspVZEATQTcmJ'
var myAddress = '0xA0bEc14CCf8Cb61db70557b07F2703C7c8ce4C69'
var myPrivateKey = new Buffer('eb9c47dbe32787bb641048df11ea0ed5ca93f1d40b0343a4be0da7c2713358a6', 'hex')
var contractAddress = '0x14466590b32b83be64898fd8b70e1a050da0a9d0'
var etherscanURL = 'https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=' + contractAddress + '&apikey=45Q8D9AGGM8RI33WIZTM6HV2AAC919PKQ4'

var web3 = new Web3(new Web3.providers.HttpProvider(providerUrl))

request(etherscanURL, (error, response, data) => {
	var abiArray = JSON.parse(JSON.parse(data).result)
	var contract = new web3.eth.Contract(abiArray, contractAddress)

	web3.eth.getTransactionCount(myAddress)
		.then((transactionCount) => {
			sendTokens(transactionCount, contract)
		});
})



function sendTokens(transactionCount, contract) {

	Promise.all([
		sendToken(contract, transactionCount, '0xffcdc69320928d609f656a335a1598592f039592', 10000),
		sendToken(contract, transactionCount + 1, '0xdDD93e4221A3e07A1Dc799C1Fa286297298DAc94', 10000)
	]).catch((error) => {
    console.log(error);
		console.log("caught the error!!!");
	})
}

function sendToken(contract, transactionCount, toAddress, amount) {
	return new Promise((resolve, reject) => {
		let rawTransaction = buildRawTransaction(contract, transactionCount, toAddress, amount)
		let tx = new Tx(rawTransaction)

		tx.sign(myPrivateKey)
		let serializedTx = '0x' + tx.serialize().toString('hex')
		web3.eth.sendSignedTransaction(serializedTx)
			.on('transactionHash', (hash) => {
				console.log(hash);
				resolve();
			})
			.on('error', (error) => {
				console.log(error);
				reject(error);
			})
	})
}

function buildRawTransaction(contract, transactionCount, toAddress, amount) {
	var data = contract.methods.transfer(toAddress, amount).encodeABI()

	return {
		'nonce': transactionCount,
		'gasPrice': Web3.utils.toHex(web3.utils.toWei(config.gasPrice, 'shannon')),
		"gasLimit": web3.utils.toHex(config.gasLimit),
		"to": contractAddress,
		"value": web3.utils.toHex(0),
		"data": data,
	}
}
