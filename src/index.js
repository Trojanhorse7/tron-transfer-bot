const { sign } = require("@noble/secp256k1");
const TronWeb = require("tronweb");
require("dotenv").config();

const withdrawalAddress = TronWeb.address.fromPrivateKey(process.env.PRIVATE_KEY); // Address to withdraw TRX
const walletAddress = process.env.OWNER_ADDRESS; // Wallet Address with Trx

const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io", // RPC NODE -
    headers: { "TRON-PRO-API-KEY": process.env.API_KEY },
});

// Minimum balance to keep
const MIN_BALANCE_THRESHOLD = 0.2 * 1e6; // 0.1 TRX in SUN

// Function to estimate bandwidth usage
function estimateBandwidth(signedTransaction) {
    const DATA_HEX_PROTOBUF_EXTRA = 3;
    const MAX_RESULT_SIZE_IN_TX = 64;
    const A_SIGNATURE = 67;

    let length = signedTransaction.raw_data_hex.length / 2 + DATA_HEX_PROTOBUF_EXTRA + MAX_RESULT_SIZE_IN_TX;
    const signatureListSize = signedTransaction.signature.length;

    for (let i = 0; i < signatureListSize; i++) {
        length += A_SIGNATURE;
    }
    return length;
}

// Function to check wallet balance and withdraw TRX
async function checkAndWithdraw() {
    try {
        // Fetch current wallet balance in SUN (1 TRX = 1e6 SUN)
        const balance = await tronWeb.trx.getBalance(walletAddress);
        console.log(`Current balance: ${balance / 1e6} TRX`);

        // Proceed only if balance exceeds the minimum threshold
        if (balance > MIN_BALANCE_THRESHOLD) {
            console.log(`Sufficient balance detected! Calculating transaction fee...`);

            // Create dummy sendtransaction
            const transaction = await tronWeb.transactionBuilder.sendTrx(
                withdrawalAddress,
                balance,
                walletAddress,
            );

            const signedTransaction = await tronWeb.trx.multiSign(transaction, process.env.PRIVATE_KEY);

            // Estimate bandwidth and calculate transaction fee in TRX
            const bandwidth = estimateBandwidth(signedTransaction);
            const feeInTRX = (bandwidth * 0.001) + 0.03; // Fee in TRX
            console.log(`Transaction fee: ${feeInTRX.toFixed(6)} TRX`);

            // Adjust the amount to send after deducting fees
            const amountToSend = balance - (feeInTRX * 1e6);
            if (amountToSend > 0) {
                console.log(`Preparing to send ${amountToSend / 1e6} TRX to ${withdrawalAddress}`);

                // Create and sign the adjusted transaction
                const adjustedTransaction = await tronWeb.transactionBuilder.sendTrx(
                    withdrawalAddress,
                    amountToSend,
                    walletAddress
                );

                const signedAdjustedTransaction = await tronWeb.trx.multiSign(adjustedTransaction, process.env.PRIVATE_KEY);
                const receipt = await tronWeb.trx.sendRawTransaction(signedAdjustedTransaction);

                if (receipt.result) {
                    console.log(`Withdrawal successful! Transaction ID: ${receipt.txid}`);
                } else {
                    console.log("Withdrawal failed:", receipt);
                }
            } else {
                console.log(`Balance is insufficient after fees. Remaining balance: ${(balance / 1e6).toFixed(6)} TRX`);
            }
        } else {
            console.log(`Balance is below the minimum withdrawal.`);
        }
    } catch (error) {
        console.log("Error during balance check or withdrawal:", error);
    }
}

// Run the check every 10 seconds
setInterval(checkAndWithdraw, 10000);