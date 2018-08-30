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
The wallet creation module is hidden by default. To create new wallet, click on ```Create Wallet``` tab in navigation bar. There are two types of wallet creation:<br />
- create account address and private key with a single click
- create password encrypted account and generate keystore file

### Send Token/Ether

- hover over menu for the type of transfer (batch or single transaction)
- token transferred must be ERC20 token type
- upload recipients info in csv file under the following format: ```Name, Address, Amount``` (units in 18th decimal place or Wei)
- webpage will be redirected to Etherscan and transaction hashes will be generated in CSV format under ```outputs``` folder


## Todo's
- ~~keystore file download~~ ✓
- ~~~user defined gas price~~~ ✓
- ~~~single transaction~~~ ✓
- ~~~transfer Ether~~~ ✓
- ~~~read keystore file~~~ ✓
- switch between private key login and keystore login
- error handling
- restrict upload file types
- refactor html code in public/html/components folder
- ~~~migrate all functionalities to client-side~~~
