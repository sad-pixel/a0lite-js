# a0lite-js

a0lite-js is a TypeScript port of the original [dkappe/a0lite](https://github.com/dkappe/a0lite) project. It is designed to work with lc0 networks that have been converted to the ONNX format.

**Note:** This project is a Work In Progress (WIP). It is not able to play a full chess game yet! 

### Prerequisites

- Bun installed on your machine.
- ONNX Runtime for JavaScript.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/a0lite-js.git
   cd a0lite-js
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Use the `lc0` command to convert your network to ONNX format by running the following command:
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