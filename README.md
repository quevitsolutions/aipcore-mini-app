# AIPCORE - The Ultimate Matrix Mini App

AIPCORE is a high-performance, gamified Web3 Mini App built for the Telegram ecosystem. It combines an addictive tapping mechanic with a powerful 18-level matrix reward system on the Binance Smart Chain.

## 🚀 Key Features

- **Tap-to-Earn**: High-fidelity tapping interface with energy management and node-based boosts.
- **18-Level Matrix**: Automated BNB distribution across a massive referral network.
- **Admin Dashboard**: Comprehensive control center for snapshotting, reward distribution, and task management.
- **Scalable RPC**: Browser-side node rotation for million-user stability without server bottlenecks.
- **One-Click Conversion**: Seemless transition from off-chain tapping coins to on-chain AIP reward units.

## 🛠️ Getting Started

### Installation

1. **Clone the Project**:
    ```bash
    git clone [your-repo-url]
    cd aipcore-mini-app
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🌐 Production Deployment

For production hosting on a VPS (AWS/DigitalOcean):

1. **Build the Application**:
    ```bash
    npm run build
    ```

2. **Configure Nginx**:
    Use the provided `nginx.conf` to serve the `dist/` directory.

3. **Process Management**:
    Use `pm2 start ecosystem.config.cjs` to ensure the app remains online.

## 📄 License

Proprietary - AIPCORE Network.
