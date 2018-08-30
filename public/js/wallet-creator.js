document.write(
	'<div id="CreateWallet" class="container" style="display:none">' +
	'		<h1>Create New Wallet</h1>' +
	'		<button id="CreateKeyPairButton">Create New Wallet</button>' +
	'		<form id="KeystoreForm" action="http://localhost:8080/wallet/keystore" method="post">' +
	'			<input type="password" name="password" placeholder="Please enter a strong password" pattern=".{8,}" required/>' +
	'			<input type="submit" value="Create New Wallet with Password" />' +
	'		</form>' +
	'' +
	'   <div id="Wallet"></div>' +
	'	</div>'
)
