// Mint SUBCULT as a Token-2022 token with on-chain name/symbol metadata.
//
//   CLUSTER=devnet|mainnet-beta   (default devnet)
//   SUPPLY=1000000000             whole tokens (default 1,000,000,000)
//   DECIMALS=9                    (default 9, the Solana norm)
//   REVOKE_MINT=0                 keep the mint authority (default: revoke, so supply is fixed)
//   KEYPAIR=<path>                payer/owner key (default ~/.config/subcultcoin/deployer.json)
//   RECIPIENT=<address>           wallet that receives the supply (default: the payer)
//   URI=<url>                     optional off-chain JSON (image, description)
//
// The keypair file is created on first run if missing. Only the public address is printed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType, TOKEN_2022_PROGRAM_ID, AuthorityType, TYPE_SIZE, LENGTH_SIZE,
  createInitializeMetadataPointerInstruction, createInitializeMintInstruction,
  createAssociatedTokenAccountIdempotent, getMintLen, mintTo, setAuthority,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

const cluster = process.env.CLUSTER ?? "devnet";
const decimals = Number(process.env.DECIMALS ?? 9);
const supply = BigInt(process.env.SUPPLY ?? "1000000000") * 10n ** BigInt(decimals);
const revoke = (process.env.REVOKE_MINT ?? "1") !== "0";
const keypairPath = process.env.KEYPAIR ?? path.join(os.homedir(), ".config/subcultcoin/deployer.json");
const recipient = process.env.RECIPIENT ? new PublicKey(process.env.RECIPIENT) : null;
const NAME = "SUBCULT", SYMBOL = "SUBCULT", URI = process.env.URI ?? "";

function loadOrCreateKeypair(file) {
  if (fs.existsSync(file)) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const kp = Keypair.generate();
  fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 });
  console.log("Created new keypair file:", file);
  return kp;
}

const payer = loadOrCreateKeypair(keypairPath);
const connection = new Connection(clusterApiUrl(cluster), "confirmed");
console.log(`Cluster : ${cluster}\nPayer   : ${payer.publicKey.toBase58()}`);

let balance = await connection.getBalance(payer.publicKey);
if (cluster === "devnet" && balance < 0.1 * LAMPORTS_PER_SOL) {
  console.log("Requesting devnet airdrop of 1 SOL...");
  try {
    const sig = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) }, "confirmed");
    balance = await connection.getBalance(payer.publicKey);
  } catch (e) {
    console.log("Airdrop failed (the RPC faucet is closed). Use https://faucet.solana.com instead.");
  }
}
console.log(`Balance : ${balance / LAMPORTS_PER_SOL} SOL`);

const mint = Keypair.generate();
const metadata = { mint: mint.publicKey, name: NAME, symbol: SYMBOL, uri: URI, additionalMetadata: [] };
const mintLen = getMintLen([ExtensionType.MetadataPointer]);
const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
const rent = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
console.log(`Mint rent: ${rent / LAMPORTS_PER_SOL} SOL (plus ~0.002 SOL for the token account and fees)`);
if (balance < rent + 0.01 * LAMPORTS_PER_SOL) {
  console.error(`Not enough SOL. Fund ${payer.publicKey.toBase58()} with at least ${((rent / LAMPORTS_PER_SOL) + 0.01).toFixed(3)} SOL and rerun.`);
  process.exit(1);
}

const tx = new Transaction().add(
  SystemProgram.createAccount({
    fromPubkey: payer.publicKey, newAccountPubkey: mint.publicKey,
    space: mintLen, lamports: rent, programId: TOKEN_2022_PROGRAM_ID,
  }),
  createInitializeMetadataPointerInstruction(mint.publicKey, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
  createInitializeMintInstruction(mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
  createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID, metadata: mint.publicKey, updateAuthority: payer.publicKey,
    mint: mint.publicKey, mintAuthority: payer.publicKey, name: NAME, symbol: SYMBOL, uri: URI,
  }),
);
await sendAndConfirmTransaction(connection, tx, [payer, mint]);

const ata = await createAssociatedTokenAccountIdempotent(
  connection, payer, mint.publicKey, recipient ?? payer.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
await mintTo(connection, payer, mint.publicKey, ata, payer, supply, [], undefined, TOKEN_2022_PROGRAM_ID);
if (revoke) {
  await setAuthority(connection, payer, mint.publicKey, payer, AuthorityType.MintTokens, null, [], undefined, TOKEN_2022_PROGRAM_ID);
}

const explorer = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
console.log(`\nSUBCULT minted.\nMint    : ${mint.publicKey.toBase58()}\nOwner   : ${(recipient ?? payer.publicKey).toBase58()}\nHolder  : ${ata.toBase58()}\nSupply  : ${process.env.SUPPLY ?? "1000000000"} (${revoke ? "mint authority revoked, supply fixed" : "mint authority kept"})\nExplorer: https://explorer.solana.com/address/${mint.publicKey.toBase58()}${explorer}`);
