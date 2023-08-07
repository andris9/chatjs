# chatjs

Demo chat running on Llama2

### Prerequisites

-   **Node.js** and **npm** (download [here](https://nodejs.org/en/download))
-   C compiler
-   Xcode tools on Mac

### 1. Setup

Run the installer (tested on Linux and MacOS)

```
$ ./install.sh
```

> The install script compiles the llama2.cpp application and downloads the Llama2 13B chat model, so it is going to take some time

### 2. Run the app

```
$ npm start
```

## Usage

Open browser at [http://127.0.0.1:3000](http://127.0.0.1:3000) and start chatting!

> **NB!** as this app is using CPU by default, then it takes a long time (~30s) to get first response tokens, so be patient when waiting for the response.

## License

**ISC**
