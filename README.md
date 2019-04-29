# gemix
The first thing to notice about this implementation of a JobCoin mixer is that the client is very thin. Nearly everything happens in the server. I wanted to move the mixing logic into a server which could manage many mix jobs simultaneously since a mixer with an empty house address isn't really providing any useful obfuscation.

# The CLI Client

The CLI client is called `gemix`. It takes an `--api` argument specifying where it can find a mix server, followed by a list of output addresses. It returns a deposit address.

```
node gemix --api http://localhost:3000 addrOne addrTwo addrThree
xyz <- Your deposit address
```

Optionally, you can specify a `ttl` for your mix job (the default is 30 seconds). A mix job will disburse randomly sized chunks of tokens to the user's provided addresses at random intervals until the job exceeds its `ttl`, at which point it will disburse any remaining coins expediently. A job may finish well before its `ttl` expires.

A mix job with a two minute `ttl`:

```
node gemix --ttl 120 --api http://localhost:3000 addrOne addrTwo addrThree
xyz <- Your deposit address
```

# The Server

The server takes arguments specifying a port to expose its API on, an interval in seconds between scans of the JobCoin API, and a house address to mix coins in.

```
node gemix-server --port 3000 --scanInterval 10 --houseAddr xyz
```

The server also has a test suite. `npm run test` will invoke it. The address "Satoshi" needs a token balance for the tests to run.

## Server architecture

The server maintains a linked list of active mix jobs. It adds jobs to the list when users POST to the `/gemix` API. It prunes jobs from the list as they are completed. It also prunes jobs from the list whose ttls expire without receiving deposits.

The core of the mixer server is the scanloop. The scanloop is a function mapped over the list of mix jobs every scan interval. Mix jobs are modeled as state machines which may be "registered", "in-progress", or "prunable". The scanloop progresses mix jobs through states.

Mix jobs which are registered are those for which deposit addresses have been generated, but no deposit has yet been received. Jobs stay in this state until either a deposit is made to their deposit address, bumping them to the in-progress state, or they exceed their ttl, making them prunable.

Jobs which are in-progress remain so while their undisbursed coin balance is greater than zero. In any invocation of the scanloop, an in-progress job may disburse coins to one of its user-provided outAddrs. If the job does make a disbursal in a scanloop invocation, it will also calculate when it should do so again in the future and how many coins it will disburse in that next disbursal. In-progress jobs become prunable once their undisbursed coin balance is zero.

Jobs which become prunable are deleted in the same invocation of the scanloop.

## TODOs

- About half the tests are unimplemented.
- The mix jobs should be persisted in a database. Without persistence, if the server crashes or goes offline for any reason, people will lose money.
- The server should be Dockerized and deployed somewhere.
- Calls to the JobCoin API transferring coins out of the house address and into user outAddrs which fail for any reason are assumed to have failed completely. This won't always be the case, and assuming so could result in users losing money. Nor should it be relied on that API calls which return a 2xx necessarily completed the transfer. More careful state checking on transfers in general would be good.
