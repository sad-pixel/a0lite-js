# a0lite-js

a0lite-js is a TypeScript port of the original [dkappe/a0lite](https://github.com/dkappe/a0lite) project. It is designed to work with lc0 networks that have been converted to the ONNX format.

You can play against the bot on Lichess as [`A0lite-js`](https://lichess.org/@/A0lite-js). Current ratings:

[![lichess-rapid](https://lichess-shield.vercel.app/api?username=A0lite-js&format=bullet)](https://lichess.org/@/A0lite-js/perf/bullet)
[![lichess-rapid](https://lichess-shield.vercel.app/api?username=A0lite-js&format=blitz)](https://lichess.org/@/A0lite-js/perf/blitz)
[![lichess-rapid](https://lichess-shield.vercel.app/api?username=A0lite-js&format=rapid)](https://lichess.org/@/A0lite-js/perf/rapid)

[Challenge Bot](https://lichess.org/?user=A0lite-js#friend)

### Known Limitations

The engine currently has some weaknesses:
- May miss obvious checkmates
- Can fall into threefold repetition in winning positions
- Basic time management system

These are being actively worked on for future improvements.

### Prerequisites

- Bun installed on your machine
- lc0 installed for network conversion

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sad-pixel/a0lite-js.git
   cd a0lite-js
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Convert an LC0 network to ONNX format:
   ```bash
   lc0 leela2onnx --input=<path-to-network-file> --output=<path-to-output-onnx-file>
   ```
   Place the resulting ONNX model in the `nets` directory.

### Usage

Run the application using Bun:
```bash
bun run index.ts
```

This starts the application as a UCI engine.