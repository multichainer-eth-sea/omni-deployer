module cross_chain::cross_chain_token {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::bcs;
    use wormhole::state;
    use wormhole::emitter;
    use wormhole::wormhole;

    /// Error codes
    const ERROR_NOT_AUTHORIZED: u64 = 1;
    const ERROR_ALREADY_INITIALIZED: u64 = 2;
    const ERROR_INVALID_AMOUNT: u64 = 3;

    struct State has key {
        emitter_cap: wormhole::emitter::EmitterCapability,
    }


    /// Struct to store token information
    struct TokenInfo has key {
        mint_cap: coin::MintCapability<CrossChainToken>,
        burn_cap: coin::BurnCapability<CrossChainToken>,
        freeze_cap: coin::FreezeCapability<CrossChainToken>,
        total_supply: u64,
        mint_events: event::EventHandle<MintEvent>,
        burn_events: event::EventHandle<BurnEvent>,
        bridge_out_events: event::EventHandle<BridgeOutEvent>,
        bridge_in_events: event::EventHandle<BridgeInEvent>,
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

    #[event]
    struct BridgeOutEvent has drop, store {
        amount: u64,
        from: address,
        to_chain: u16,
        recipient: vector<u8>,
    }

    #[event]
    struct BridgeInEvent has drop, store {
        amount: u64,
        to: address,
        from_chain: u16,
    }

    /// The token
    struct CrossChainToken {}

    /// Initialize the token
    public entry fun initialize(account: &signer) {
        // Register ourselves as a wormhole emitter. This gives back an
        // `EmitterCapability` which will be required to send messages through
        // wormhole.
        let emitter_cap = wormhole::register_emitter();
        move_to(account, State { emitter_cap });
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
            bridge_out_events: account::new_event_handle<BridgeOutEvent>(account),
            bridge_in_events: account::new_event_handle<BridgeInEvent>(account),
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

    /// Bridge tokens to another chain
    public entry fun bridge_out(
        account: &signer,
        amount: u64,
        to_chain: u16,
        recipient: vector<u8>
    ) acquires TokenInfo, State {
        let account_addr = signer::address_of(account);
        assert!(amount > 0, ERROR_INVALID_AMOUNT);

        let token_info = borrow_global_mut<TokenInfo>(account_addr);
        let coins_to_bridge = coin::withdraw<CrossChainToken>(account, amount);
        coin::burn(coins_to_bridge, &token_info.burn_cap);

        token_info.total_supply = token_info.total_supply - amount;

        // Emit Wormhole message
        let emitter_cap = &mut borrow_global_mut<State>(@cross_chain).emitter_cap;
        let payload = encode_bridge_out_payload(amount, recipient);
        let message_fee = wormhole::state::get_message_fee();
        let fee_coins = coin::withdraw(account, message_fee);
        wormhole::publish_message(
            emitter_cap,
            0,
            payload,
            fee_coins
        );

        event::emit_event(&mut token_info.bridge_out_events, BridgeOutEvent {
            amount,
            from: account_addr,
            to_chain,
            recipient,
        });
    }

    /// Bridge tokens in from another chain (only callable by the contract owner)
    public entry fun bridge_in(
        account: &signer,
        to: address,
        amount: u64,
        from_chain: u16
    ) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), ERROR_NOT_AUTHORIZED);

        let token_info = borrow_global_mut<TokenInfo>(account_addr);
        let coins_minted = coin::mint(amount, &token_info.mint_cap);
        coin::deposit(to, coins_minted);

        token_info.total_supply = token_info.total_supply + amount;

        event::emit_event(&mut token_info.bridge_in_events, BridgeInEvent {
            amount,
            to,
            from_chain,
        });
    }

    /// Helper function to encode bridge out payload
   fun encode_bridge_out_payload(amount: u64, recipient: vector<u8>): vector<u8> {
        let payload = vector::empty();
        vector::append(&mut payload, bcs::to_bytes(&amount));
        vector::append(&mut payload, recipient);
        payload
    }
}