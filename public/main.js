$(document).ready(function() {
	var isBatchToken = true;
	var isBatchEther = true;

	$("#create-wallet-tab").click(function() {
		$("#WalletCreator").toggle();
	})

})

function createKeyPair() {
	console.log("Clicked!");
  $.get('http://localhost:8080/wallet/keypair', function(response, status) {
		$("#Wallet").empty();
		$("#Wallet").append($('<p></p>').text(response.address));
		$("#Wallet").append($('<p></p>').text(response.privateKey));
	})
}
