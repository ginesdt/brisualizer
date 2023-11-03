# Brisualizer

Brisualizer is designed to offer an innovative solution that showcases all deposits and withdrawals between Ethereum
Mainnet and Optimism or Base networks. Bridging the gap between these two prominent blockchain networks, Brisualizer
provides a comprehensive and user-friendly view for users and developers to gain a deeper understanding of cross-network
transactions.

The Ethereum network has long been the go-to platform for DApps and DeFi applications. However, the network's
scalability and high gas fees have led to the development of Layer 2 scaling solutions. Optimism, an optimistic rollup
solution, offers faster and cheaper transactions, making it an attractive choice for DApp developers.

With multiple and diverse assets moving between these networks, tracking transactions, and understanding their flow can
be a complex task. This is where Brisualizer steps in, providing a valuable tool for users and developers to visualize
and analyze these complex interactions. By providing transparency and insights into asset movements, this project aligns
with the broader goal of promoting transparency and understanding in the blockchain space, making it accessible to a
wider audience.

Deposits and withdrawals involve transactions spanning different networks. One to trigger the asset exchange, and
another or various more to prove and finalize the exchange, which could occur over an extended period of time between
them. Coordinating and correlating these transactions can be challenging due to the complexity of the blockchain
ecosystem and the various parties and smart contracts involved. Brisualizer serves as a valuable tool by simplifying
this process, offering users a clear and intuitive view and easy track of how assets move between these networks.

In the technical side, this project uses DeCommas API to fetch all the transactions coming from or to the smart
contracts aimed to lock/release tokens in L1 and mint/burn the equivalent tokens in L2. It fetch additional information
of the transactions, like nonces or withdraw hashes, so the different transactions involved in deposits or withdrawals
can be related to each other. Additionally, it uses DeCommas API to fetch the information of the tokens involved in each
transaction, such as coin names, prices, logos, etc. so this information can be easily presented to the users without
having to navigate trough all the individual transactions. The deposits, withdrawals, their related transactions and
token information is kept in a database, which is later queried from the frontend, for faster lookup.

## Getting started

This is a [Next.js](https://nextjs.org/) project.

First, set up your environment variables. Fill and copy .env.example to .env

You need:
- Postgres DB (or change prisma/schema.prisma to use SQLite for development)
- DeCommas API key
- Etherscan API Key for each network (Mainnet, Optimism, Base)

To run the development server use:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the visualizer.
