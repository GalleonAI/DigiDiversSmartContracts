import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
	Metaplex,
	keypairIdentity,
	bundlrStorage,
	toMetaplexFile,
	toBigNumber,
	UploadMetadataInput,
	NftWithToken,
} from '@metaplex-foundation/js';
import * as fs from 'fs';
import { secret } from '../assets';

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

export async function createLevelXNft(
	level: number,
	image: string
): Promise<NftWithToken> {
	const CONFIG = {
		uploadPath: 'assets/',
		imgFileName: image,
		imgType: 'image/png',
		imgName: 'Level Image',
		tokenStandard: 4,
		description: 'Level Avatar Digi Divers',
		attributes: [{ trait_type: 'Level', value: level.toString() }],
		sellerFeeBasisPoints: 500, //500 bp = 5%
		symbol: 'DIGI',
		creators: [{ address: WALLET.publicKey, share: 100 }],
	};

	// Step 1 - Upload Image
	const imgUri = await uploadImage(CONFIG.uploadPath, CONFIG.imgFileName);

	// Step 2 - Upload Metadata
	const metadataUri = await uploadMetadata(
		imgUri,
		CONFIG.imgType,
		CONFIG.imgName,
		CONFIG.description,
		CONFIG.attributes
	);

	// Step 3 - Create NFT
	return await mintNft(
		metadataUri,
		CONFIG.imgName,
		CONFIG.sellerFeeBasisPoints,
		CONFIG.symbol,
		CONFIG.creators
	);
}

// update NFT
export async function updateNftLevel(nft: NftWithToken, newLevel: number, newImage?: string): Promise<NftWithToken> {
	console.log(`old nft metadata: `, nft.json);

	let newMetadata: UploadMetadataInput; 
	if (newImage !== undefined) {
		// Step 1 - Upload Image
		const imgUri = await uploadImage('assets/', newImage);
		newMetadata = {
			...nft.json,
			image: imgUri,
			attributes: [{ trait_type: 'Level', value: newLevel.toString() }],
		};
	} else {
		newMetadata = {
			...nft.json,
			attributes: [{ trait_type: 'Level', value: newLevel.toString() }],
		};
	}
	const { uri: newUri } = await METAPLEX.nfts().uploadMetadata(newMetadata);

	console.log(`new nft metadata: `, newMetadata);

	//onsole.log(`   New Metadata URI:`, newUri);
	await METAPLEX.nfts().update({
		nftOrSft: nft,
		uri: newUri,
	});
	console.log(
		`Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`
	);
	return nft
}

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
): Promise<NftWithToken> {
	console.log(`Step 3 - Minting NFT`);
	const { nft } = await METAPLEX.nfts().create(
		{
			uri: metadataUri,
			name: name,
			sellerFeeBasisPoints: sellerFee,
			symbol: symbol,
			creators: creators,
			maxSupply: toBigNumber(1),
		},
		{ commitment: 'finalized' }
	);
	console.log(`   Success!🎉`);
	console.log(
		`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`
	);
	return nft;
}