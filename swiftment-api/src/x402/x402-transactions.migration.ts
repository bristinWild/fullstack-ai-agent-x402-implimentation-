import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create X402 Transactions Table
 * 
 * Tracks all X402 payment protocol transactions for agentic commerce
 * 
 * Run with: npm run typeorm migration:run
 */
export class CreateX402TransactionsTable1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create x402_transactions table
        await queryRunner.createTable(
            new Table({
                name: 'x402_transactions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'signature',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        comment: 'Blockchain transaction signature',
                    },
                    {
                        name: 'payment_scheme',
                        type: 'varchar',
                        length: '50',
                        default: "'exact'",
                        comment: 'Payment scheme: exact, upto, etc.',
                    },
                    {
                        name: 'network',
                        type: 'varchar',
                        length: '50',
                        comment: 'Blockchain network: mainnet, devnet, testnet',
                    },
                    {
                        name: 'blockchain',
                        type: 'varchar',
                        length: '50',
                        comment: 'Blockchain platform: solana, base, ethereum',
                    },
                    {
                        name: 'asset',
                        type: 'varchar',
                        length: '50',
                        comment: 'Payment asset: USDC, etc.',
                    },
                    {
                        name: 'amount',
                        type: 'bigint',
                        comment: 'Amount in base units (e.g., 1000000 = 1 USDC)',
                    },
                    {
                        name: 'amount_usd',
                        type: 'decimal',
                        precision: 18,
                        scale: 6,
                        comment: 'Amount in USD for easy querying',
                    },
                    {
                        name: 'pay_to',
                        type: 'varchar',
                        length: '255',
                        comment: 'Recipient wallet address',
                    },
                    {
                        name: 'pay_from',
                        type: 'varchar',
                        length: '255',
                        comment: 'Sender wallet address',
                    },
                    {
                        name: 'resource',
                        type: 'varchar',
                        length: '500',
                        comment: 'API endpoint or resource accessed',
                    },
                    {
                        name: 'agent_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                        comment: 'AI agent identifier if available',
                    },
                    {
                        name: 'agent_metadata',
                        type: 'jsonb',
                        isNullable: true,
                        comment: 'Additional agent information',
                    },
                    {
                        name: 'merchant_id',
                        type: 'uuid',
                        comment: 'Merchant who received the payment',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: true,
                        comment: 'User ID if linked to account',
                    },
                    {
                        name: 'payment_id',
                        type: 'uuid',
                        isNullable: true,
                        comment: 'Link to main payments table if integrated',
                    },
                    {
                        name: 'verified',
                        type: 'boolean',
                        default: false,
                        comment: 'Whether payment was verified on-chain',
                    },
                    {
                        name: 'verified_at',
                        type: 'timestamp',
                        isNullable: true,
                        comment: 'When payment was verified',
                    },
                    {
                        name: 'verification_method',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        comment: 'How payment was verified: facilitator, direct, etc.',
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                        comment: 'Additional X402 protocol metadata',
                    },
                    {
                        name: 'error_message',
                        type: 'text',
                        isNullable: true,
                        comment: 'Error message if verification failed',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'pending'",
                        comment: 'Transaction status: pending, verified, failed, refunded',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create indexes for better query performance
        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_SIGNATURE',
                columnNames: ['signature'],
            }),
        );

        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_MERCHANT',
                columnNames: ['merchant_id'],
            }),
        );

        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_AGENT',
                columnNames: ['agent_id'],
            }),
        );

        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_CREATED',
                columnNames: ['created_at'],
            }),
        );

        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_STATUS',
                columnNames: ['status', 'verified'],
            }),
        );

        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_BLOCKCHAIN',
                columnNames: ['blockchain', 'network'],
            }),
        );

        // Create composite index for merchant analytics
        await queryRunner.createIndex(
            'x402_transactions',
            new TableIndex({
                name: 'IDX_X402_MERCHANT_ANALYTICS',
                columnNames: ['merchant_id', 'created_at', 'verified'],
            }),
        );

        // Optional: Create foreign key if you have a merchants table
        // Uncomment if you want to enforce referential integrity
        /*
        await queryRunner.createForeignKey(
          'x402_transactions',
          new TableForeignKey({
            name: 'FK_X402_MERCHANT',
            columnNames: ['merchant_id'],
            referencedTableName: 'merchants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
        */

        // Create view for merchant analytics
        await queryRunner.query(`
      CREATE OR REPLACE VIEW x402_merchant_stats AS
      SELECT 
        merchant_id,
        COUNT(*) as total_transactions,
        COUNT(DISTINCT agent_id) as unique_agents,
        SUM(amount_usd) as total_volume_usd,
        AVG(amount_usd) as average_payment_usd,
        MAX(created_at) as last_payment_at,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
      FROM x402_transactions
      GROUP BY merchant_id;
    `);

        // Create view for agent analytics
        await queryRunner.query(`
      CREATE OR REPLACE VIEW x402_agent_stats AS
      SELECT 
        agent_id,
        COUNT(*) as total_transactions,
        COUNT(DISTINCT merchant_id) as unique_merchants,
        SUM(amount_usd) as total_spent_usd,
        AVG(amount_usd) as average_payment_usd,
        MAX(created_at) as last_payment_at,
        MIN(created_at) as first_payment_at
      FROM x402_transactions
      WHERE agent_id IS NOT NULL
      GROUP BY agent_id;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop views
        await queryRunner.query('DROP VIEW IF EXISTS x402_agent_stats');
        await queryRunner.query('DROP VIEW IF EXISTS x402_merchant_stats');

        // Drop foreign keys if created
        // await queryRunner.dropForeignKey('x402_transactions', 'FK_X402_MERCHANT');

        // Drop table
        await queryRunner.dropTable('x402_transactions');
    }
}