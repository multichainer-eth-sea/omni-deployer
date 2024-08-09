module cross_chain::oft {
    use std::string::{Self, String};
    use std::signer;
    use std::vector;
    use aptos_std::event;
    use aptos_std::type_info::{Self, TypeInfo};
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::coin;
    use layerzero::endpoint::UaCapability;
    use aptos_std::table::{Self, Table};
    use layerzero_apps::oft;
    use aptos_std::from_bcs;

    struct CrossChainOFT {}
    
    struct NonBlockingEvent has drop, store {
        src_chain_id: u64,
        src_address: vector<u8>,
        receiver: address,
        amount: u64
    }

    struct OFT has key {
        admin: address,
        paused: bool,
        signer_cap: account::SignerCapability,
        white_list: Table<address, bool>
    }

    struct Capabilities has key {
        lz_cap: UaCapability<CrossChainOFT>,
    }

    struct OFTCap has key {
        hard_cap: Table<u64, u64>,
        used: Table<u64, u64>,
        last_timestamp: Table<u64, u64>,
    }

    struct EventStore has key {
        non_blocking_events: event::EventHandle<NonBlockingEvent>
    }

    const EACCESS_DENIED: u64 = 1;
    const ETOKEN_NOT_FOUND: u64 = 2;

    // Define constants for CrossChainCommandId
    const DEPLOY_REMOTE_COIN: u8 = 0;
    const VERIFY_REMOTE_COIN: u8 = 1;

    struct DeployRemoteCoin has drop {
        deployment_id: vector<u8>,
        coin_name: vector<u8>,
        coin_ticker: vector<u8>,
        coin_decimals: u8,
        coin_total_supply: u64,
        remote_chain_id: u64,
        receiver: address,
        remote_supply_amount: u64,
        remote_factory_address: address,
    }

    struct VerifyRemoteCoin has drop {
        deployment_id: vector<u8>,
        chain_id: u64,
        deployed_coin_address: address,
    }

    struct ModuleData has key {
        admin_cap: SignerCapability,
    }

    // deployedCoins[vector<u8>(deploymentId)][u64(chainId)] = address(coin)
    struct DeployedCoins has key {
        coins: Table<vector<u8>, Table<u64, address>>
    }

    fun init_module(account: &signer) {
        let (_, admin_cap) = account::create_resource_account(account, b"oft_admin");
        move_to(account, ModuleData { admin_cap });
        move_to(account, DeployedCoins { coins: table::new() });
    }


    public fun lz_receive_types(_src_chain_id: u64, _src_address: vector<u8>, _payload: vector<u8>): vector<TypeInfo> {
        vector::empty<TypeInfo>()
    }

    fun decode_send_payload(payload: vector<u8>): (u8, vector<u8>) {
        let command_id = from_bcs::to_u8(vector::slice(&payload, 0, 1));
        let command_data = vector::slice(&payload, 1, vector::length(&payload));
        (command_id, command_data)
    }

    fun decode_deploy_remote_coin(command_data: vector<u8>): DeployRemoteCoin {
        let deployment_id = vector::slice(&command_data, 0, 32);
        let coin_name_length = from_bcs::to_u64(vector::slice(&command_data, 32, 40));
        let coin_name = vector::slice(&command_data, 40, 40 + coin_name_length);
        let offset = 40 + coin_name_length;

        let coin_ticker_length = from_bcs::to_u64(vector::slice(&command_data, offset, offset + 8));
        let coin_ticker = vector::slice(&command_data, offset + 8, offset + 8 + coin_ticker_length);
        offset = offset + 8 + coin_ticker_length;

        let coin_decimals = from_bcs::to_u8(vector::slice(&command_data, offset, offset + 1));
        let coin_total_supply = from_bcs::to_u64(vector::slice(&command_data, offset + 1, offset + 9));
        let remote_chain_id = from_bcs::to_u64(vector::slice(&command_data, offset + 9, offset + 17));
        let receiver = from_bcs::to_address(vector::slice(&command_data, offset + 17, offset + 49));
        let remote_supply_amount = from_bcs::to_u64(vector::slice(&command_data, offset + 49, offset + 57));
        let remote_factory_address = from_bcs::to_address(vector::slice(&command_data, offset + 57, offset + 89));

        DeployRemoteCoin {
            deployment_id,
            coin_name,
            coin_ticker,
            coin_decimals,
            coin_total_supply,
            remote_chain_id,
            receiver,
            remote_supply_amount,
            remote_factory_address,
        }
    }

    fun decode_verify_remote_coin(command_data: vector<u8>): VerifyRemoteCoin {
        let deployment_id = vector::slice(&command_data, 0, 32);
        let chain_id = from_bcs::to_u64(vector::slice(&command_data, 32, 40));
        let deployed_coin_address = from_bcs::to_address(vector::slice(&command_data, 40, 72));

        VerifyRemoteCoin {
            deployment_id,
            chain_id,
            deployed_coin_address,
        }
    }

    public entry fun lz_receive(
        src_chain_id: u64,
        src_address: vector<u8>,
        payload: vector<u8>
    ) acquires ModuleData {

        let (command_id, command_data) = decode_send_payload(payload);

        if (command_id == DEPLOY_REMOTE_COIN) {
            // Handle deployment logic here
        } else if (command_id == VERIFY_REMOTE_COIN) {
            let verify_data = decode_verify_remote_coin(command_data);
            let module_data = borrow_global<ModuleData>(@cross_chain);
            let admin_signer = account::create_signer_with_capability(&module_data.admin_cap);
            // Create a new OFT token
            let seed = verify_data.deployment_id; // Use deployment_id as seed
            let (resource_account, resource_signer_cap) = account::create_resource_account(&admin_signer, seed);
            let resource_signer = account::create_signer_with_capability(&resource_signer_cap);

            // You might want to retrieve these details from somewhere or use default values
            let name = b"Remote OFT Token";
            let symbol = b"ROFT";
            let decimals = 8;
            let shared_decimals = 8;

            let lz_cap = oft::init_oft<CrossChainOFT>(
                &resource_signer,
                name,
                symbol,
                decimals,
                shared_decimals
            );
            move_to(&admin_signer, Capabilities {
                lz_cap,
            });

            
            // Set the deployed coin address
            set_deployed_coin_address(verify_data.deployment_id, verify_data.chain_id, verify_data.deployed_coin_address);
            oft::lz_receive<CrossChainOFT>(src_chain_id, src_address, payload);
        } else {
            // Handle unknown command
        }

        // let oft_info = borrow_global<OFTInfo>(token_address);/
        
    }

    fun set_deployed_coin_address(deployment_id: vector<u8>, chain_id: u64, address: address) acquires DeployedCoins {
        let deployed_coins = borrow_global_mut<DeployedCoins>(@cross_chain);
        if (!table::contains(&deployed_coins.coins, deployment_id)) {
            table::add(&mut deployed_coins.coins, deployment_id, table::new());
        };
        let chain_table = table::borrow_mut(&mut deployed_coins.coins, deployment_id);
        table::upsert(chain_table, chain_id, address);
    }
}