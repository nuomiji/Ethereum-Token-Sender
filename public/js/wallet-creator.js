document.write(
	'<div id="CreateWallet" class="container" style="display:none">' +
	'		<h1>Create New Wallet</h1>' +
	'		<button id="CreateKeyPairButton">Create Address & Private Key Pair</button>' +
	'   <p>-or-</p>' +
	'		<form id="KeystoreForm" action="../../../wallet/keystore" method="post">' +
	'			<input type="password" name="password" placeholder="Please enter a strong password" pattern=".{8,}" required/>' +
	'			<input type="submit" value="Create Keystore File with Password" />' +
	'		</form>' +
	'' +
	'   <div id="Wallet"></div>' +
	'	</div>'
)
