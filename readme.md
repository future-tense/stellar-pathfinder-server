# @futuretense/stellar-pathfinder-server


|       | stellar.org |  satoshipay.io | pathfinder |
|-------|-------------|----------------|------------|
|**Get account status** (1)  |  0.300s     |     0.353s     |     N/A    |
|**Find path** (2)  |  5.340s     |     6.647s     |    0.586s  |

1) https://{host}/accounts/GDUMWJ3ISSVBKGZHVQZRVUN6TUOJETXDV7POKVNXEYBCRN4CQOYCV5AA
2) https://{host}//paths?source_account=GDUMWJ3ISSVBKGZHVQZRVUN6TUOJETXDV7POKVNXEYBCRN4CQOYCV5AA&destination_asset_type=credit_alphanum4&destination_asset_code=BTC&destination_asset_issuer=GBSTRH4QOTWNSVA6E4HFERETX4ZLSR3CIUBLK7AXYII277PFJC4BBYOG&destination_amount=0.01

## Requirements

* A synced stellar-core node
* A PostgreSQL instance w/ a stellar-core database

## Environment variables

* STELLAR_CORE_DB
    - PostgreSQL connection string, e.g.
        * `postgres://{username}:{password}@{host}/{database}`
* API_PORT
    - TCP port to listen to for incoming connections for the API. Default: 8000
* TRIGGER_DELAY
    - How many milliseconds after the last trigger to wait before considering a ledger complete. Default: 5
* LOG_LEVEL
    - NONE, FATAL, ERROR, WARN, INFO, DEBUG, TRACE/ALL. Default: INFO

## TODO:

* add rate limiting