import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { secret } from '../assets';
import { Metaplex, bundlrStorage, keypairIdentity } from '@metaplex-foundation/js';

export const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
export const DEVNET_ENDPOINT = clusterApiUrl('devnet');

export const CONNECTION = new Connection(clusterApiUrl('devnet'), 'confirmed');
export const METAPLEX: Metaplex = Metaplex.make(CONNECTION)
    .use(keypairIdentity(WALLET))
    .use(
        bundlrStorage({
            address: 'https://devnet.bundlr.network',
            providerUrl: DEVNET_ENDPOINT,
            timeout: 60000,
        })
    );

export const MOBILE_ADDR_BASE64 = 'EZCZz/y0YImqB6dGtua8GB7lSmZKGr9Go9k7Nsz0CP4=';
export const REQUIRED_EXPERIENCE = 10;
