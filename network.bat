cd network
geth --identity "node1" --rpc --rpcport "8000" --rpccorsdomain "*" --datadir "node1" --port "30303" --nodiscover --rpcapi "db,eth,net,web3,personal,miner,admin" --networkid 2020 --nat "any" --allow-insecure-unlock --ipcdisable