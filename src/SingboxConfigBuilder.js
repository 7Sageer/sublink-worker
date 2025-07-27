// --- KONFIGURASI ---
const https = require('https');
const fs = require('fs');
const readline = require('readline');

const IP_CIDR_URL = "https://raw.githubusercontent.com/HybridNetworks/whatsapp-cidr/main/WhatsApp/whatsapp_cidr_ipv4.txt";
const DOMAIN_LIST_URL = "https://raw.githubusercontent.com/HybridNetworks/whatsapp-cidr/main/WhatsApp/whatsapp_domainlist.txt";
const OUTPUT_JSON_FILE = "rules/whatsapp_rules.json";

function fetchDataFromUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            if (res.statusCode !== 200) {
                reject(new Error(`Gagal mengambil data: ${res.statusCode}`));
                return;
            }

            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function parseList(content, commentChar = '#') {
    if (!content) return [];

    return content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith(commentChar));
}

async function main() {
    console.log("Memulai proses pembaruan aturan WhatsApp...");

    try {
        console.log("Mengambil daftar IP CIDR...");
        const ipContent = await fetchDataFromUrl(IP_CIDR_URL);

        console.log("Mengambil daftar Domain...");
        const domainContent = await fetchDataFromUrl(DOMAIN_LIST_URL);

        const ipCidrs = parseList(ipContent);
        console.log(`Ditemukan ${ipCidrs.length} IP CIDR yang valid.`);

        const domains = parseList(domainContent);
        console.log(`Ditemukan ${domains.length} domain yang valid.`);

        const outputData = {
            version: 2,
            rules: [
                {
                    domain_suffix: domains.sort(),
                    ip_cidr: ipCidrs.sort()
                }
            ]
        };

        // Pastikan direktori 'rules/' ada
        fs.mkdirSync('rules', { recursive: true });

        fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(outputData, null, 4), 'utf8');
        console.log(`Berhasil menyimpan aturan ke file: ${OUTPUT_JSON_FILE}`);
        console.log("\nProses pembaruan selesai dengan sukses.");
    } catch (error) {
        console.error(`Gagal: ${error.message}`);
        process.exit(1);
    }
}

main();
