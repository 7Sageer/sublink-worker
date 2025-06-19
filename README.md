<div align="center">
  <h1><b>Sublink Worker</b></h1>
  <h5><i>Best Practice for Serverless Self-Deployed Subscription Conversion Tool</i></h5>
  
  <a href="https://trendshift.io/repositories/12291" target="_blank">
    <img src="https://trendshift.io/api/badge/repositories/12291" alt="7Sageer%2Fsublink-worker | Trendshift" width="250" height="55"/>
  </a>
  
  <!-- <p>
    <a href="https://sublink-worker.sageer.me">https://sublink-worker.sageer.me</a>
  </p> -->
  <br>

  <p>
    <a href="https://dash.cloudflare.com/?to=/:account/workers-and-pages/create">
      <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"/>
    </a>
  </p>
  
  <p><a href="/docs/README_CN.md">中文文档</a></p>
</div>

## 🚀 Quick Start

### Quick Deployment
- Fork this project, click the `Deploy to Cloudflare` button above
- Select your repository in the `Import Repository` section (you need to link your GitHub account)
- Change the `Deploy Command` as follows, then select `Save and Deploy`
``` bash
npm run deploy
```

## ✨ Features

### Supported Protocols
- ShadowSocks
- VMess
- VLESS
- Hysteria2
- Trojan
- TUIC

### Core Features
- Support for importing Base64 http/https subscription links and various protocol sharing URLs
- Pure JavaScript + Cloudflare Worker implementation, one-click deployment, ready to use
- Support for fixed/random short link generation (based on KV)
- Light/Dark theme toggle
- Flexible API, supporting script operations
- Support for Chinese, English, and Persian languages

### Client Support
- Sing-Box
- Clash
- Xray/V2Ray

### Web Interface Features
- User-friendly operation interface
- Various predefined rule sets
- Customizable policy groups for geo-site, geo-ip, ip-cidr, and domain-suffix

## 📖 API Documentation

For detailed API documentation, please refer to [APIDoc.md](/docs/APIDoc.md)

### Main Endpoints
- `/singbox` - Generate Sing-Box configuration
- `/clash` - Generate Clash configuration
- `/xray` - Generate Xray configuration
- `/shorten` - Generate short links

## 📝 Recent Updates

### 2025-05-02

- Automatic renaming is now applied when proxies with the same name exist ([#175](https://github.com/7Sageer/sublink-worker/pull/175))
- Fixed DNS configuration for Singbox ([#174](https://github.com/7Sageer/sublink-worker/pull/174))

## 🔧 Project Structure

```
.
├── index.js                 # Main server logic, handles request routing
├── BaseConfigBuilder.js     # Build base configuration
├── SingboxConfigBuilder.js  # Build Sing-Box configuration
├── ClashConfigBuilder.js    # Build Clash configuration
├── ProxyParsers.js          # Parse URLs of various proxy protocols
├── utils.js                 # Provide various utility functions
├── htmlBuilder.js           # Generate Web interface
├── style.js                 # Generate CSS for Web interface
├── config.js                # Store configuration information
└── docs/
    ├── APIDoc.md            # API documentation
    ├── UpdateLogs.md        # Update logs
    ├── FAQ.md               # Frequently asked questions
    └── BaseConfig.md        # Basic configuration feature introduction
```

## Local Development / Deployment

To run this project locally for development or testing, follow these steps:

### Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm) installed on your system.
*   Git for cloning the repository.

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
    (Replace `your-username/your-repo-name` with the actual repository URL)

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the local development server:**
    ```bash
    npm run dev
    ```
    This command uses `wrangler dev`, which will start a local server (usually on `http://localhost:8787`) and simulate the Cloudflare environment, including KV storage. Any data written to KV namespaces (like `SUBLINK_KV`) will be stored locally in a `.wrangler` directory within your project.

### KV Namespace Note

The script `npm run setup-kv` (or `node scripts/setup-kv.js`) is intended for managing the KV namespace in a *deployed* Cloudflare Workers environment. It interacts with your Cloudflare account to create or find the necessary KV namespace and updates `wrangler.toml` accordingly.

**You do not need to run `npm run setup-kv` for local development with `npm run dev`**, as `wrangler dev` handles local KV simulation automatically.

## 🤝 Contribution

Issues and Pull Requests are welcome to improve this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for learning and exchange purposes only. Please do not use it for illegal purposes. All consequences resulting from the use of this project are solely the responsibility of the user and are not related to the developer.

## 💰 Sponsorship

<div align="center">
  <h3>Thanks to the following sponsors for their support of this project</h3>
<table border="0">
  <tr>
    <td>
      <a href="https://yxvm.com/" target="_blank" title="YXVM">
        <img src="https://image.779477.xyz/yxvm.png" alt="YXVM" height="60" hspace="20"/>
      </a>
    </td>
    <td>
      <a href="https://github.com/NodeSeekDev/NodeSupport" target="_blank" title="NodeSupport">
        <img src="https://image.779477.xyz/ns.png" alt="NodeSupport" height="60" hspace="20"/>
      </a>
    </td>
  </tr>
</table>
  <p><b>NodeSupport has sponsored this project, thank you for your support!</b></p>
  <p>If you would like to sponsor this project, please contact the developer <a href="https://github.com/7Sageer" style="text-decoration: none;">@7Sageer</a></p>
</div>

## ⭐ Star History

Thanks to everyone who has starred this project! 🌟

<a href="https://star-history.com/#7Sageer/sublink-worker&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date" />
 </picture>
</a>
