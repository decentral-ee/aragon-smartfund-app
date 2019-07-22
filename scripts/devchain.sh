#!/bin/sh

cd "$(dirname "$0")"/..

DB_PATH="$PWD/data/devchain-db"
LOG_PATH="$PWD/data/devchain.log"

if [ ! -z "$RESET_DEVCHAIN" ] || [ ! -d "${DB_PATH}" ];then
  echo Resetting devchain db...
  rm -rf "$DB_PATH"
  mkdir -p data
  cp -r './node_modules/@aragon/cli/node_modules/@aragon/aragen/aragon-ganache' "$DB_PATH"
else
  echo Using existing devchain db...
fi

cat <<EOF
✔ Devchain DB initialized at ${DB_PATH}
✔ Local chain starting at port ${DEVCHAIN_PORT}

ℹ Here are some Ethereum accounts you can use.
The first one will be used for all the actions the CLI performs.
You can use your favorite Ethereum provider or wallet to import their private keys.

Address #1:  0xb4124cEB3451635DAcedd11767f004d8a28c6eE7 (this account is used to deploy DAOs, it has more permissions)
Private key: a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563
Address #2:  0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb
Private key: ce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608
ℹ The accounts were generated from the following mnemonic phrase:
explain tackle mirror kit van hammer degree position ginger unfair soup bonus

ℹ ENS instance deployed at 0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1

ℹ Devchain running: http://localhost:38401.
EOF

ganache-cli \
  --db "$DB_PATH" \
  --port ${DEVCHAIN_PORT} \
  --mnemonic 'explain tackle mirror kit van hammer degree position ginger unfair soup bonus' \
  --accounts 10 \
  --defaultBalanceEther 1000000000000 \
  --gasPrice 5000000000 \
  --gasLimit 8000000
