use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, Token, TokenAccount, Mint, Transfer, 
    mint_to, InitializeAccount,
};
use anchor_spl::{associated_token::get_associated_token_address, associated_token::AssociatedToken};

declare_id!("6SsNGoMWPnU18ax2MqCtfaQuTY8MgehYUt52bsrNc84k");

fn ata_for(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    get_associated_token_address(owner, mint)
}

#[program]
pub mod swiftment_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, usdc_mint: Pubkey, purchase_fee_bps: u16, withdraw_fee_bps: u16) -> Result<()> {
        require!(purchase_fee_bps <= 10_000 && withdraw_fee_bps <= 10_000, SwiftErr::InvalidBps);
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.usdc_mint = usdc_mint;
        cfg.purchase_fee_bps = purchase_fee_bps;
        cfg.withdraw_fee_bps = withdraw_fee_bps;
        cfg.authority_treasury = ctx.accounts.authority_treasury.key();
        cfg.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn register_merchant(ctx: Context<RegisterMerchant>) -> Result<()> {
            let m = &mut ctx.accounts.merchant;
            m.merchant_authority = ctx.accounts.merchant_authority.key();
            m.treasury = ctx.accounts.treasury.key();
            m.bump = ctx.bumps.merchant;

            let t = &mut ctx.accounts.treasury;
            t.merchant = m.key();
            t.usdc_ata = ctx.accounts.treasury_usdc_ata.key();
            t.bump = ctx.bumps.treasury;
;

            Ok(())
        }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        let u = &mut ctx.accounts.user;
        u.owner = ctx.accounts.user_authority.key();
        u.default_daily_limit_usdc = 0; // unlimited by default
        u.bump = ctx.bumps.user;
        Ok(())
    }

    pub fn opt_in(ctx: Context<OptIn>, daily_limit_usdc: u64) -> Result<()> {
        let up = &mut ctx.accounts.user_platform;
        up.user = ctx.accounts.user.key();
        up.merchant = ctx.accounts.merchant.key();
        up.daily_limit_usdc = daily_limit_usdc;
        up.spent_today_usdc = 0;
        up.last_reset_unix = Clock::get()?.unix_timestamp;
        up.bump = ctx.bumps.user_platform;
        Ok(())
    }

    pub fn set_daily_limit(ctx: Context<SetDailyLimit>, new_limit: u64) -> Result<()> {
        require_keys_eq!(ctx.accounts.user.owner, ctx.accounts.user_authority.key());
        ctx.accounts.user_platform.daily_limit_usdc = new_limit;
        Ok(())
    }

    pub fn pay(ctx: Context<Pay>, amount_usdc: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        let up = &mut ctx.accounts.user_platform;

        msg!("config.usdc_mint = {}", ctx.accounts.config.usdc_mint);
        msg!("merchant.treasury = {}", ctx.accounts.merchant.treasury);
        msg!("treasury (passed) = {}", ctx.accounts.treasury.key());
        msg!("treasury_ata (passed) = {}", ctx.accounts.treasury_usdc_ata.key());
        msg!("expected_treasury_ata = {}", ata_for(&ctx.accounts.treasury.key(), &ctx.accounts.config.usdc_mint));
        msg!("authority_treasury (passed) = {}", ctx.accounts.authority_treasury.key());
        msg!("config.authority_treasury = {}", ctx.accounts.config.authority_treasury);
        msg!("user_usdc_ata (passed) = {}", ctx.accounts.user_usdc_ata.key());
        msg!("user_authority = {}", ctx.accounts.user_authority.key());

        // daily reset if day changed
        let now = Clock::get()?.unix_timestamp;
        if !same_utc_day(now, up.last_reset_unix) {
            up.spent_today_usdc = 0;
            up.last_reset_unix = now;
        }

        // enforce limit (0 means unlimited)
        if up.daily_limit_usdc > 0 {
            require!(up.spent_today_usdc.saturating_add(amount_usdc) <= up.daily_limit_usdc, SwiftErr::DailyLimitExceeded);
        }

        // compute purchase fee
        let fee = (amount_usdc as u128)
            .saturating_mul(cfg.purchase_fee_bps as u128)
            .checked_div(10_000)
            .unwrap() as u64;
        let to_merchant = amount_usdc.saturating_sub(fee);




        // transfers: user -> merchant_treasury, user -> authority_treasury
        // 1) to merchant treasury
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_usdc_ata.to_account_info(),
                    to: ctx.accounts.treasury_usdc_ata.to_account_info(),
                    authority: ctx.accounts.user_authority.to_account_info(),
                }),
            to_merchant,
        )?;

        // 2) fee to authority treasury (skip if fee == 0)
        if fee > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_usdc_ata.to_account_info(),
                        to: ctx.accounts.authority_treasury.to_account_info(),
                        authority: ctx.accounts.user_authority.to_account_info(),
                    }),
                fee,
            )?;
        }

        up.spent_today_usdc = up.spent_today_usdc.saturating_add(amount_usdc);
        emit!(PurchaseEvent {
            user: ctx.accounts.user.key(),
            merchant: ctx.accounts.merchant.key(),
            amount_usdc,
            fee_usdc: fee,
            ts: now,
        });
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount_usdc: u64) -> Result<()> {
        let cfg = &ctx.accounts.config;
        // only merchant authority can withdraw
        require_keys_eq!(ctx.accounts.merchant.merchant_authority, ctx.accounts.merchant_authority.key());

        let fee = (amount_usdc as u128)
            .saturating_mul(cfg.withdraw_fee_bps as u128)
            .checked_div(10_000)
            .unwrap() as u64;
        let to_merchant = amount_usdc.saturating_sub(fee);

        // treasury -> merchant wallet
        let seeds = &[
            b"treasury",
            ctx.accounts.merchant.to_account_info().key.as_ref(),
            &[ctx.accounts.treasury.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.treasury_usdc_ata.to_account_info(),
                    to: ctx.accounts.merchant_usdc_ata.to_account_info(),
                    authority: ctx.accounts.treasury.to_account_info(),
                },
                signer,
            ),
            to_merchant,
        )?;

        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.treasury_usdc_ata.to_account_info(),
                        to: ctx.accounts.authority_treasury.to_account_info(),
                        authority: ctx.accounts.treasury.to_account_info(),
                    },
                    signer,
                ),
                fee,
            )?;
        }

        emit!(WithdrawEvent {
            merchant: ctx.accounts.merchant.key(),
            amount_usdc,
            fee_usdc: fee,
            ts: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

// ————— helpers —————

fn same_utc_day(a: i64, b: i64) -> bool {
    (a / 86_400) == (b / 86_400)
}

// ————— accounts —————

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"config"],
        bump,
        space = 8 + Config::SIZE
    )]
    pub config: Account<'info, Config>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = authority
    )]
    pub authority_treasury: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterMerchant<'info> {
    #[account(mut, seeds=[b"config"], bump=config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = merchant_authority,
        seeds = [b"merchant", merchant_authority.key().as_ref()],
        bump,
        space = 8 + Merchant::SIZE
    )]
    pub merchant: Account<'info, Merchant>,

    #[account(
        init,
        payer = merchant_authority,
        seeds = [b"treasury", merchant.key().as_ref()],
        bump,
        space = 8 + Treasury::SIZE
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init, // or init_if_needed if you enabled the feature
        payer = merchant_authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury
    )]
    pub treasury_usdc_ata: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub merchant_authority: Signer<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}



#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = user_authority,
        seeds = [b"user", user_authority.key().as_ref()],
        bump,
        space = 8 + User::SIZE
    )]
    pub user: Account<'info, User>,

    #[account(mut)]
    pub user_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OptIn<'info> {
    pub config: Account<'info, Config>,
    pub user: Account<'info, User>,
    pub merchant: Account<'info, Merchant>,

    #[account(
        init,
        payer = user_authority,
        seeds = [b"user_platform", user.key().as_ref(), merchant.key().as_ref()],
        bump,
        space = 8 + UserPlatform::SIZE
    )]
    pub user_platform: Account<'info, UserPlatform>,

    #[account(mut)]
    pub user_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetDailyLimit<'info> {
    pub user: Account<'info, User>,
    #[account(mut)]
    pub user_platform: Account<'info, UserPlatform>,
    pub user_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Pay<'info> {
    pub config: Account<'info, Config>,
    pub user: Account<'info, User>,
    pub merchant: Account<'info, Merchant>,

    #[account(
        mut,
        seeds = [b"user_platform", user.key().as_ref(), merchant.key().as_ref()],
        bump = user_platform.bump
    )]
    pub user_platform: Account<'info, UserPlatform>,

    // ✅ Add USDC mint as an account
    #[account(address = config.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user_authority,
        associated_token::mint = usdc_mint,  // ← Now reference the account
        associated_token::authority = user_authority
    )]
    pub user_usdc_ata: Account<'info, TokenAccount>,

    #[account(mut, address = merchant.treasury)]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        constraint = treasury_usdc_ata.key() == ata_for(&treasury.key(), &config.usdc_mint) @ SwiftErr::InvalidTreasuryAta,
        constraint = treasury_usdc_ata.owner == treasury.key(),
        constraint = treasury_usdc_ata.mint == config.usdc_mint
    )]
    pub treasury_usdc_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = ata_for(&config.authority, &config.usdc_mint)
    )]
    pub authority_treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_authority: Signer<'info>,
    
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub config: Account<'info, Config>,
    #[account(has_one = merchant_authority)]
    pub merchant: Account<'info, Merchant>,

    #[account(mut, address = merchant.treasury)]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        constraint = treasury_usdc_ata.key() == ata_for(&treasury.key(), &config.usdc_mint) @ SwiftErr::InvalidTreasuryAta,
        constraint = treasury_usdc_ata.owner == treasury.key(),
        constraint = treasury_usdc_ata.mint == config.usdc_mint
    )]
    pub treasury_usdc_ata: Account<'info, TokenAccount>,

    // merchant’s personal USDC ATA
    #[account(mut, constraint = merchant_usdc_ata.mint == config.usdc_mint)]
    pub merchant_usdc_ata: Account<'info, TokenAccount>,

    /// CHECK
    #[account(mut, address = config.authority_treasury)]
    pub authority_treasury: AccountInfo<'info>,

    pub merchant_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}



#[account]
pub struct Config {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub purchase_fee_bps: u16,
    pub withdraw_fee_bps: u16,
    pub authority_treasury: Pubkey,
    pub bump: u8,
}
impl Config { pub const SIZE: usize = 32+32+2+2+32+1; }

#[account]
pub struct Merchant {
    pub merchant_authority: Pubkey,
    pub treasury: Pubkey,
    pub bump: u8,
}
impl Merchant { pub const SIZE: usize = 32+32+1; }

#[account]
pub struct Treasury {
    pub merchant: Pubkey,
    pub usdc_ata: Pubkey,
    pub bump: u8,
}
impl Treasury { pub const SIZE: usize = 32+32+1; }

#[account]
pub struct User {
    pub owner: Pubkey,
    pub default_daily_limit_usdc: u64,
    pub bump: u8,
}
impl User { pub const SIZE: usize = 32+8+1; }

#[account]
pub struct UserPlatform {
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub daily_limit_usdc: u64,
    pub spent_today_usdc: u64,
    pub last_reset_unix: i64,
    pub bump: u8,
}
impl UserPlatform { pub const SIZE: usize = 32+32+8+8+8+1; }

// ————— events & errors —————

#[event]
pub struct PurchaseEvent {
    pub user: Pubkey,
    pub merchant: Pubkey,
    pub amount_usdc: u64,
    pub fee_usdc: u64,
    pub ts: i64,
}

#[event]
pub struct WithdrawEvent {
    pub merchant: Pubkey,
    pub amount_usdc: u64,
    pub fee_usdc: u64,
    pub ts: i64,
}

#[error_code]
pub enum SwiftErr {
    #[msg("Invalid basis points")]
    InvalidBps,
    #[msg("Daily spending limit exceeded")]
    DailyLimitExceeded,
    #[msg("Treasury ATA does not match treasury + USDC mint")]
    InvalidTreasuryAta,
     #[msg("Invalid fee ata")]
    InvalidFeeAta,
    #[msg("Invalid fee owner")]
    InvalidFeeOwner,
    #[msg("Invalid user ata owner")]
    InvalidUserAtaOwner,
    #[msg("Invalid user ata mint")]
    InvalidUserAtaMint,
    #[msg("Invalid fee ata mint")]
    InvalidFeeAtaMint
}
