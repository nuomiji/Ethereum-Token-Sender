var express = require('express');
var router = express.Router();
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/vCfQu4uCspVZEATQTcmJ'));

router.get('/keypair', (req, res) => {
	var newAccount = web3.eth.accounts.create();
	var keyPair = {
		address: newAccount.address,
		privateKey: newAccount.privateKey,
	}
	res.send(keyPair);
});

router.post('/keystore', (req, res) => {
	var newAccount = web3.eth.accounts.create();
	var keystore = JSON.stringify(newAccount.encrypt(req.body.password));

	res.setHeader('Content-disposition', 'attachment; filename=' + newAccount.address);
	res.setHeader('Content-type', 'application/json');

	res.send(keystore);
})


module.exports = router;
