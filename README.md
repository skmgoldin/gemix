# Gemix

Gemix is a simple mixer CLI for JobCoin. Invoke it with a list of addresses you would like your coins mixed to, and it will return a deposit address to send your coins to. You may optionally specify a number of days within which mixing must be completed (default: 3 days) once the deposit is received.

Deposits must be made in a single transaction, and within 24 hours.

Example:
```
gemix --days 5 alice bob carol
abcdwxyz <= your deposit address
```

## Developing

Gemix uses the gemix mixing server at gemix.hidden.computer. For testing gemix with a local API server, you may use the `--api` option. Set `--days` to 0 for instant mixing.

Example:
```
gemix --api localhost:3000 --days 0 xena yang zoey
wxyzabcd <= your deposit address
```

