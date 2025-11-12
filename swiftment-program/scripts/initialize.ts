// swiftment-program/scripts/initialize.ts
// Initialize the Swiftment program config
// Run with: npx ts-node scripts/initialize.ts

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Load IDL
const idl = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "../target/idl/swiftment_program.json"),
        "utf8"
    )
);

async function main() {
    // Setup connection
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Load wallet
    const walletPath = path.join(os.homedir(), ".config/solana/id.json");
    const walletKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")))
    );

    const wallet = new Wallet(walletKeypair);

    // Create provider
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });

    anchor.setProvider(provider);

    // Get program ID from IDL
    const programId = new PublicKey(idl.address);

    // Create program instance
    // @ts-ignore
    const program = new Program(idl, provider);

    console.log("🚀 Initializing Swiftment Program...");
    console.log("📍 Program ID:", programId.toString());
    console.log("👤 Authority:", wallet.publicKey.toString());

    // USDC Mint (devnet)
    const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

    // Get the config PDA
    const [configPda, configBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        programId
    );

    console.log("🔧 Config PDA:", configPda.toString());
    console.log("   Bump:", configBump);

    // Get authority treasury (for receiving fees)
    const authorityTreasury = getAssociatedTokenAddressSync(
        USDC_MINT,
        wallet.publicKey
    );

    console.log("💰 Authority Treasury:", authorityTreasury.toString());

    // Fee settings
    const purchaseFeeBps = 250; // 2.5% fee on purchases
    const withdrawFeeBps = 100;  // 1% fee on withdrawals

    try {
        // Check if already initialized
        try {
            // @ts-ignore
            const configAccount = await (program.account as any).config.fetch(configPda);
            console.log("\n⚠️  Config already initialized!");
            console.log("   Authority:", configAccount.authority.toString());
            console.log("   USDC Mint:", configAccount.usdcMint.toString());
            console.log("   Purchase Fee:", `${configAccount.purchaseFeeBps / 100}%`);
            console.log("   Withdraw Fee:", `${configAccount.withdrawFeeBps / 100}%`);
            console.log("\n✅ Program is already ready to use!");
            return;
        } catch (e: any) {
            if (e.message?.includes("Account does not exist")) {
                console.log("ℹ️  Config not initialized yet, proceeding...");
            } else {
                console.log("⚠️  Error checking config:", e.message);
            }
        }

        console.log("\n📝 Initializing config...");
        console.log("   Purchase Fee:", `${purchaseFeeBps / 100}%`);
        console.log("   Withdraw Fee:", `${withdrawFeeBps / 100}%`);

        // Check wallet balance
        const balance = await connection.getBalance(wallet.publicKey);
        console.log("💰 Wallet balance:", balance / 1e9, "SOL");

        if (balance < 0.1 * 1e9) {
            console.log("⚠️  Low balance! You may need more SOL.");
            console.log("   Run: solana airdrop 2 --url devnet");
        }

        // Initialize the config
        const tx = await program.methods
            .initialize(USDC_MINT, purchaseFeeBps, withdrawFeeBps)
            .accounts({
                config: configPda,
                usdcMint: USDC_MINT,
                authorityTreasury: authorityTreasury,
                authority: wallet.publicKey,
            })
            .rpc();

        console.log("\n✅ Config initialized successfully!");
        console.log("📝 Transaction signature:", tx);
        console.log("🔗 View on Solana Explorer:");
        console.log(`   https://explorer.solana.com/tx/${tx}?cluster=devnet`);

        // Wait for confirmation
        console.log("\n⏳ Waiting for confirmation...");
        await connection.confirmTransaction(tx, "confirmed");

        // Fetch and display the initialized config
        // @ts-ignore
        const configAccount = await (program.account as any).config.fetch(configPda);
        console.log("\n📊 Config Details:");
        console.log("   Config PDA:", configPda.toString());
        console.log("   Authority:", configAccount.authority.toString());
        console.log("   USDC Mint:", configAccount.usdcMint.toString());
        console.log("   Purchase Fee:", `${configAccount.purchaseFeeBps / 100}%`);
        console.log("   Withdraw Fee:", `${configAccount.withdrawFeeBps / 100}%`);
        console.log("   Bump:", configAccount.bump);

        console.log("\n🎉 Program is ready to use!");

    } catch (error: any) {
        console.error("\n❌ Error initializing config:");
        console.error("   Message:", error.message || error);

        if (error.logs) {
            console.error("\n📜 Program logs:");
            error.logs.forEach((log: string) => console.error("   ", log));
        }

        if (error.message?.includes("insufficient funds")) {
            console.error("\n💡 Solution: Get more SOL");
            console.error("   Run: solana airdrop 2 --url devnet");
        }

        throw error;
    }
}

main()
    .then(() => {
        console.log("\n✅ Initialization complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Initialization failed!");
        process.exit(1);
    });