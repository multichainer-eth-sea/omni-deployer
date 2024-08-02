module my_addr::cross_chain_token {
    use std::signer;
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::account;

    /// Error codes
    const ERROR_NOT_AUTHORIZED: u64 = 1;
    const ERROR_ALREADY_INITIALIZED: u64 = 2;

    /// Struct to store token information
    struct TokenInfo has key {
        mint_cap: coin::MintCapability<CrossChainToken>,
        burn_cap: coin::BurnCapability<CrossChainToken>,
        freeze_cap: coin::FreezeCapability<CrossChainToken>,
        total_supply: u64,
        mint_events: event::EventHandle<MintEvent>,
        burn_events: event::EventHandle<BurnEvent>,
    }

    /// Events
    #[event]
    struct MintEvent has drop, store {
        amount: u64,
        to: address,
    }

    #[event]
    struct BurnEvent has drop, store {
        amount: u64,
        from: address,
    }

    /// The token
    struct CrossChainToken {}

    /// Initialize the token
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);

        assert!(!exists<TokenInfo>(account_addr), ERROR_ALREADY_INITIALIZED);

        let (burn_cap, freeze_cap, mint_cap) =
            coin::initialize<CrossChainToken>(
                account,
                string::utf8(b"Cross Chain Token"),
                string::utf8(b"CCT"),
                8, // decimals
                true, // monitor_supply
            );

        move_to(account, TokenInfo {
            mint_cap,
            burn_cap,
            freeze_cap,
            total_supply: 0,
            mint_events: account::new_event_handle<MintEvent>(account),
            burn_events: account::new_event_handle<BurnEvent>(account),
        });
    }

    /// Mint tokens (only callable by the contract owner)
    public entry fun mint(account: &signer, to: address, amount: u64) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), ERROR_NOT_AUTHORIZED);

        let token_info = borrow_global_mut<TokenInfo>(account_addr);
        let coins_minted = coin::mint(amount, &token_info.mint_cap);
        coin::deposit(to, coins_minted);

        token_info.total_supply = token_info.total_supply + amount;

        event::emit_event(&mut token_info.mint_events, MintEvent { amount, to });
    }

    /// Burn tokens
    public entry fun burn(account: &signer, amount: u64) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), ERROR_NOT_AUTHORIZED);

        let token_info = borrow_global_mut<TokenInfo>(account_addr);
        let coins_burned = coin::withdraw<CrossChainToken>(account, amount);
        coin::burn(coins_burned, &token_info.burn_cap);

        token_info.total_supply = token_info.total_supply - amount;

        event::emit_event(&mut token_info.burn_events, BurnEvent { amount, from: account_addr });
    }
}