import {
    SystemProgram,
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
    Signer,
} from '@solana/web3.js';
import { CONNECTION } from '../utils';

/**
 * function to send SOL to multiple users in a mapping address -> amount
 * @param from - signer
 * @param mappAddressAmount - map of address and amount
 * */
export async function transferSolToUsers({
    from,
    mapAddressAmount,
}: {
    from: Signer;
    mapAddressAmount: any[];
}) {
    // Set up transaction
    const transaction = new Transaction();

    mapAddressAmount.forEach((amount, address) => {
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: new PublicKey(address),
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );
    });

    // Sign transaction, broadcast, and confirm
    const signature = await sendAndConfirmTransaction(CONNECTION, transaction, [from]);

    console.log('SIGNATURE', signature);
}

// TESTING
const mappingAddressAmountMap = new Map<string, number>();
mappingAddressAmountMap.set('6cKDgYaPxpqm15sxCB34zZxHa2CSSAtNAxMkUdYHmooC', 0.05);
mappingAddressAmountMap.set('6cKDgYaPxpqm15sxCB34zZxHa2CSSAtNAxMkUdYTmooC', 0.05);
