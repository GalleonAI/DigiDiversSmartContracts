import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
	Metaplex,
	keypairIdentity,
	bundlrStorage,
	toMetaplexFile,
	toBigNumber,
} from '@metaplex-foundation/js';
import * as fs from 'fs';
import secret from './localWallet/my-keypair.json';

const DEVNET_ENDPOINT = clusterApiUrl('devnet');
const connection = new Connection(DEVNET_ENDPOINT);

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

const METAPLEX = Metaplex.make(connection)
	.use(keypairIdentity(WALLET))
	.use(
		bundlrStorage({
			address: 'https://devnet.bundlr.network',
			providerUrl: DEVNET_ENDPOINT,
			timeout: 60000,
		})
	);

// create meta data
const CONFIG = {
	uploadPath: 'assets/',
	imgFileName: 'science.png',
	imgType: 'image/png',
	imgName: 'Science Rules',
	description: 'A one-of-a-kind pixelated science nerd',
	attributes: [
		{ trait_type: 'Bubbles', value: 'Yes' },
		{ trait_type: 'Type', value: 'Pixelated' },
		{ trait_type: 'Background', value: 'Clear' },
	],
	sellerFeeBasisPoints: 500, //500 bp = 5%
	symbol: 'SCI',
	creators: [{ address: WALLET.publicKey, share: 100 }],
};

// upload NFT metadata
async function uploadImage(
	filePath: string,
	fileName: string
): Promise<string> {
	console.log(`Step 1 - Uploading Image`);
	const imgBuffer = fs.readFileSync(filePath + fileName);
	const imgMetaplexFile = toMetaplexFile(imgBuffer, fileName);
	const imgUri = await METAPLEX.storage().upload(imgMetaplexFile);
	console.log(`   Image URI:`, imgUri);
	return imgUri;
}

async function uploadMetadata(
	imgUri: string,
	imgType: string,
	nftName: string,
	description: string,
	attributes: { trait_type: string; value: string }[]
) {
	console.log(`Step 2 - Uploading Metadata`);
	const { uri } = await METAPLEX.nfts().uploadMetadata({
		name: nftName,
		description: description,
		image: imgUri,
		attributes: attributes,
		properties: {
			files: [
				{
					type: imgType,
					uri: imgUri,
				},
			],
		},
	});
	console.log('   Metadata URI:', uri);
	return uri;
}

async function mintNft(
	metadataUri: string,
	name: string,
	sellerFee: number,
	symbol: string,
	creators: { address: PublicKey; share: number }[]
) {
	console.log(`Step 3 - Minting NFT`);
	const { nft } = await METAPLEX.nfts().create(
		{
			uri: metadataUri,
			name: name,
			sellerFeeBasisPoints: sellerFee,
			symbol: symbol,
			creators: creators,
			isMutable: false,
			maxSupply: toBigNumber(1),
		},
		{ commitment: 'finalized' }
	);
	console.log(`   Success!🎉`);
	console.log(
		`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`
	);
}

async function main() {
	console.log(
		`Minting ${
			CONFIG.imgName
		} to an NFT in Wallet ${WALLET.publicKey.toBase58()}.`
	);

	//Step 1 - Upload Image
	const imgUri = await uploadImage(CONFIG.uploadPath, CONFIG.imgFileName);

	//Step 2 - Upload Metadata
	const metadataUri = await uploadMetadata(
		imgUri,
		CONFIG.imgType,
		CONFIG.imgName,
		CONFIG.description,
		CONFIG.attributes
	);

	//Step 3 - Mint NFT
	await mintNft(
		metadataUri,
		CONFIG.imgName,
		CONFIG.sellerFeeBasisPoints,
		CONFIG.symbol,
		CONFIG.creators
	);
}

main();
// QUESTIONS FOR MYSELF
// what is bundlrStorage
