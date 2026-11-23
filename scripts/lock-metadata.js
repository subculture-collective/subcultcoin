// Permanently revoke the metadata update authority and the metadata pointer authority.
// After this, the token's name, symbol and logo link can never change. Irreversible.
//
//   MINT=<mint address>  CLUSTER=devnet|mainnet-beta  node scripts/lock-metadata.js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  AuthorityType, TOKEN_2022_PROGRAM_ID, getMint, getMetadataPointerState,
  getTokenMetadata, setAuthority, tokenMetadataUpdateAuthority,
} from "@solana/spl-token";

if (!process.env.MINT) throw new Error("Set MINT=<mint address>");
const cluster = process.env.CLUSTER ?? "devnet";
const keypairPath = process.env.KEYPAIR ?? path.join(os.homedir(), ".config/subcultcoin/deployer.json");
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf8"))));
const connection = new Connection(clusterApiUrl(cluster), "confirmed");
const mint = new PublicKey(process.env.MINT);

await tokenMetadataUpdateAuthority(connection, payer, mint, payer, null, [], undefined, TOKEN_2022_PROGRAM_ID);
console.log("Metadata update authority revoked.");
await setAuthority(connection, payer, mint, payer, AuthorityType.MetadataPointer, null, [], undefined, TOKEN_2022_PROGRAM_ID);
console.log("Metadata pointer authority revoked.");

const m = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
const md = await getTokenMetadata(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
console.log({
  mintAuthority: m.mintAuthority, freezeAuthority: m.freezeAuthority,
  metadataPointerAuthority: getMetadataPointerState(m)?.authority ?? null,
  metadataUpdateAuthority: md.updateAuthority ?? null,
});
