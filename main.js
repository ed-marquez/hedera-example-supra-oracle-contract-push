const { ethers, ContractFactory } = require("ethers");
const fs = require("fs");
require("dotenv").config();

//SETTINGS
//-----------------------------------------------------------------------------------------------------------------
const network = "testnet";
const storageContractAddress = "0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917"; // TESTNET Address of the Supra Oracle Storage Contract
//-----------------------------------------------------------------------------------------------------------------

const abi = fs.readFileSync("./contracts/artifacts/ConsumerContract.abi").toString();
const bytecode = fs.readFileSync("./contracts/artifacts/ConsumerContract.bin").toString();

const rpcUrl = `https://${network}.hashio.io/api`;
const explorerURL = `https://hashscan.io/${network}`;
const privateKey = process.env.PRIVATE_KEY; //Your private key

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);

//Main function to deploy the contract
async function main() {
	// STEP 1 ===================================
	console.log(`\nSTEP 1 ===================================\n`);
	console.log(`- Deploy the smart contract...\n`);

	let gasLimit = 4000000;
	const newContract = new ContractFactory(abi, bytecode, signer);
	const contractDeployTx = await newContract.deploy(storageContractAddress, { gasLimit: gasLimit });
	const contractDeployRx = await contractDeployTx.deployTransaction.wait();
	const contractAddress = contractDeployRx.contractAddress;
	console.log(`- Contract deployed to address: ${contractAddress} ✅`);
	console.log(`- See details in HashScan: \n ${explorerURL}/address/${contractAddress} \n `);

	// STEP 2 ===================================
	console.log(`\nSTEP 2 ===================================\n`);
	console.log(`- Call contract functions...\n`);

	// Set the pair indices that you wish to request/use as an array - https://supra.com/docs/data-feeds/data-feeds-index
	const pricePairName = ["BTC/USDT", "ETH/USDT", "HBAR/USDT"];
	const pricePairIdx = [0, 1, 75];

	gasLimit = 200000;
	const myContract = new ethers.Contract(contractAddress, abi, signer);
	const callResult = await myContract.getPriceForMultiplePair(pricePairIdx, { gasLimit: gasLimit });

	for (let i = 0; i < pricePairIdx.length; i++) {
		const price = callResult[i].price;
		const decimals = callResult[i].decimals;
		const round = callResult[i].round;
		const timestamp = callResult[i].time;
		const formattedPrice = price * 10 ** -decimals;

		console.log(`- Pair Name : ${pricePairName[i]}`);
		console.log(`- Price : ${price}`);
		console.log(`- Decimal : ${decimals}`);
		console.log(`- Round : ${round}`);
		console.log(`- Timestamp : ${timestamp}`);
		console.log(`\n- Formatted Price: ${formattedPrice}`);
		console.log(`\n===================================\n`);
	}
}

main();
