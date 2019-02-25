# @futuretense/stellar-pathfinder-server

# What?

Listen to anyone talking about Stellar and what sets it apart from other blockchain projects,
and path payments will ultimately be touted.

The ability to pay for a cup of coffee using whatever asset you have at hand, and still have the merchant receive their preferred currency. 
Commerce, cross-border remittances; the uses are many.

*Path finding* is at the center of this.

To do a path payment you need to supply a path to the network, to get a path you need to ask someone to figure one out for you.

By default, this is one of the responsibilities of a Horizon server.

**This** is a standalone path finding server that performs path finding without the need to have a Horizon server running.

# Why?

For the vision to come true of everyday use of path payments, for *every* payment, path finding has to be able to run at interactive rates.
You don't want to leave users hanging, waiting around wondering what's going on.

Looking at the current stats, that's exactly what happens now, which is what led to the development of this project.

|       | stellar.org |  satoshipay.io | pathfinder |
|-------|-------------|----------------|------------|
|**Get account status** <sup>[1](#note1)</sup>  |  0.300s     |     0.353s     |     N/A    |
|**Find path** <sup>[2](#note2)</sup>  |  5.340s     |     6.647s     |    0.586s  |


# How?

## Requirements

* A synced stellar-core node
* A PostgreSQL instance w/ a stellar-core database

## Installing

#### From the NPM package

```
npm install -g @futuretense/stellar-pathfinder-server
```

#### From the source code

```
git clone https://github.com/future-tense/stellar-pathfinder-server.git
cd stellar-pathfinder-server
npm install
npm run build
npm install -g
```

These will install the command-line tool `stellar-pathfinder-server`, which can be run, with the proper environment variables set.

## Environment variables

* STELLAR_CORE_DB
    - PostgreSQL connection string, e.g.
        * `postgres://{username}:{password}@{host}:{port}/{database}`
* API_PORT
    - TCP port to listen to for incoming connections for the API. Default: 8000
* TRIGGER_DELAY
    - How many milliseconds after the last trigger to wait before considering a ledger complete. Default: 5
* LOG_LEVEL
    - NONE, FATAL, ERROR, WARN, INFO, DEBUG, TRACE/ALL. Default: INFO

## Compatibility with Horizon

The REST API is more-or-less compatible with the Horizon API, and could be used as a drop-in replacement simply by remapping the "/paths" path on the server that runs Horizon.

The differences are

* `pathfinder` requires the `source_account` query parameter
* `pathfinder` ignores the `destination_account` query parameter
* `pathfinder` returns fewer results


---

Notes:<br>
<br><a name="note1"> 1) using the median value of three runs of `time curl https://{host}/accounts/GDUMWJ3ISSVBKGZHVQZRVUN6TUOJETXDV7POKVNXEYBCRN4CQOYCV5AA`</a><br>
<br><a name="note2"> 2) using the median value of three runs of `time curl "https://{host}/paths?source_account=GDUMWJ3ISSVBKGZHVQZRVUN6TUOJETXDV7POKVNXEYBCRN4CQOYCV5AA&destination_account=GDUMWJ3ISSVBKGZHVQZRVUN6TUOJETXDV7POKVNXEYBCRN4CQOYCV5AA&destination_asset_type=credit_alphanum4&destination_asset_code=BTC&destination_asset_issuer=GBSTRH4QOTWNSVA6E4HFERETX4ZLSR3CIUBLK7AXYII277PFJC4BBYOG&destination_amount=0.01"`</a><br>

Copyright &copy; 2019 Future Tense, LLC
