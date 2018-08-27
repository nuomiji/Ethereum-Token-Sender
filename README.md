# Token-Sender-with-Server
A Ethereum Wallet web app using NodeJS to create new accounts and transfer ERC20 tokens

Project uses Infura as service provider and Etherscan API to obtain contract ABI

## Installation
In Administrator Cmd: <br />
``` $ npm install windows-build-tools```

set python path in npm: <br />
``` $ npm config set python C:\Users\YourName\.windows-build-tools\ ```

install all dependencies in the Ethereum-Token-Sender directory <br />
``` $ npm install -s ```

## Usage

### To Run
```bash
nodemon server.js
```
Code is running on http://localhost:8080/

### Create Accounts
The wallet creation module is hiden by default. To create new wallet, click on ```Create Wallet``` tab in navagation bar. There are two types of wallet creation:<br />
- create account address and private key with a single click
- create password encrypted account and generate keystore file

### Send Token
- batch transaction done on given ERC20 token type 
- network selection implemented as dropdown selection
- upload recipients info in csv file under the following format: ```Name, Address, Amount``` (units in 18th decimal place)
- webpage will be redirected to ```Etherscan``` and transaction hashes will be generated in CSV formt under ```outputs``` folder

### Send Ether
- batch transaction on Ether
- network selection implemented as dropdown
- upload recipients info in csv file under the following format: ```Name, Address, Amount``` (units in Wei)
- webpage will be redirected to ```Etherscan``` and transaction hashes will be generated in CSV formt under ```outputs``` folder

## Todo's
- ~~keystore file download~~ ✓
- ~~~user defined gas price~~~ ✓
- ~~~single transaction~~~ ✓
- ~~~transfer Ether~~~ ✓
- read keystore file
- migrate all functionalities to client-side

