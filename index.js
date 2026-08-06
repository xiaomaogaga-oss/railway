const express = require("express");
const app = express();
const axios = require("axios");
const os = require('os');
const fs = require("fs");
const path = require("path");
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// 日志工具函数
function log(level, ...args) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[LOG_LEVEL] || 2;
    const msgLevel = levels[level] || 2;
    if (msgLevel <= currentLevel) {
        console[level === 'debug' ? 'log' : level](...args);
    }
}

// 生成随机名称函数
function generateRandomName() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// 全局错误处理，防止主进程崩溃退出
process.on('uncaughtException', (err) => {
    log('error', 'Process error:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Promise rejection:', reason);
});

// 环境变量配置 (移除硬编码)
const UPLOAD_URL = process.env.UPLOAD_URL || '';
const PROJECT_URL = process.env.PROJECT_URL || '';
const AUTO_ACCESS = process.env.AUTO_ACCESS === 'true';
// 使用绝对路径确保在不同环境下的一致性
const FILE_PATH = path.resolve(process.env.FILE_PATH || './tmp');
const SUB_PATH = process.env.SUB_PATH || generateRandomName();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const UUID = process.env.UUID || '';
const NEZHA_SERVER = process.env.NEZHA_SERVER || '';
const NEZHA_PORT = process.env.NEZHA_PORT || '';
const NEZHA_KEY = process.env.NEZHA_KEY || '';
const ARGO_DOMAIN = process.env.ARGO_DOMAIN || '';
const ARGO_AUTH = process.env.ARGO_AUTH || '';
const ARGO_PORT = parseInt(process.env.ARGO_PORT) || 8001;
const CFIP = process.env.CFIP || 'www.shopify.com';
const CFPORT = process.env.CFPORT || 443;
const NAME = process.env.NAME || 'gaga';
// 安全增强配置
const DOWNLOAD_BASE_AMD = process.env.DOWNLOAD_BASE_AMD || 'https://amd64.ssss.nyc.mn';
const DOWNLOAD_BASE_ARM = process.env.DOWNLOAD_BASE_ARM || 'https://arm64.ssss.nyc.mn';
const AUTO_ACCESS_API = process.env.AUTO_ACCESS_API || 'https://oooo.serv00.net/add-url';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // 'error', 'warn', 'info', 'debug'
const SITE_TITLE = process.env.SITE_TITLE || 'My Personal Blog';
const SITE_DESC = process.env.SITE_DESC || 'Welcome to my personal website';

// 运行目录准备
if (!fs.existsSync(FILE_PATH)) {
    fs.mkdirSync(FILE_PATH, { recursive: true });
}

const npmName = generateRandomName();
const webName = generateRandomName();
const botName = generateRandomName();
const phpName = generateRandomName();
const npmPath = path.join(FILE_PATH, npmName);
const phpPath = path.join(FILE_PATH, phpName);
const webPath = path.join(FILE_PATH, webName);
const botPath = path.join(FILE_PATH, botName);
const subPath = path.join(FILE_PATH, 'sub.txt');
const listPath = path.join(FILE_PATH, 'list.txt');
const bootLogPath = path.join(FILE_PATH, 'boot.log');
const configPath = path.join(FILE_PATH, 'config.json');

// 获取isp信息
async function getMetaInfo() {
    try {
        const response1 = await axios.get('https://ipapi.co/json/', { timeout: 3000 });
        if (response1.data && response1.data.country_code && response1.data.org) {
            return response1.data.country_code + '_' + response1.data.org;
        }
    } catch (error) {
        try {
            const response2 = await axios.get('http://ip-api.com/json/', { timeout: 3000 });
            if (response2.data && response2.data.status === 'success' && response2.data.countryCode && response2.data.org) {
                return response2.data.countryCode + '_' + response2.data.org;
            }
        } catch (error) {
        }
    }
    return 'Unknown';
}

// 自动上传节点或订阅
async function uploadNodes() {
    if (UPLOAD_URL && PROJECT_URL) {
        const subscriptionUrl = PROJECT_URL + '/' + SUB_PATH;
        const jsonData = { subscription: [subscriptionUrl] };
        try {
            await axios.post(UPLOAD_URL + '/api/add-subscriptions', jsonData, {
                headers: { 'Content-Type': 'application/json' }
            });
            log('info', 'Subscription uploaded');
        } catch (error) {
            log('debug', 'Upload failed:', error.message);
        }
    }
}

// 删除历史节点
async function deleteNodes() {
    try {
        if (!UPLOAD_URL || !fs.existsSync(subPath)) return;
        const fileContent = fs.readFileSync(subPath, 'utf-8');
        const decoded = Buffer.from(fileContent, 'base64').toString('utf-8');
        const nodes = decoded.split('\n').filter(line => /(vless|vmess|trojan):\/\//.test(line));
        if (nodes.length === 0) return;
        await axios.post(UPLOAD_URL + '/api/delete-nodes', JSON.stringify({ nodes }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
    }
}

// 自动访问项目URL
async function AddVisitTask() {
    if (!AUTO_ACCESS || !PROJECT_URL) return;
    try {
        await axios.post(AUTO_ACCESS_API, { url: PROJECT_URL }, {
            headers: { 'Content-Type': 'application/json' }
        });
        log('info', 'Auto access task added');
    } catch (error) {
        log('debug', 'Auto access failed:', error.message);
    }
}

// 处理 TunnelSecret
function argoType() {
    if (ARGO_AUTH && ARGO_DOMAIN && ARGO_AUTH.includes('TunnelSecret')) {
        fs.writeFileSync(path.join(FILE_PATH, 'tunnel.json'), ARGO_AUTH);
        const tunnelYaml = 'tunnel: ' + ARGO_AUTH.split('"')[11] + '\ncredentials-file: ' + path.join(FILE_PATH, 'tunnel.json') + '\nprotocol: http2\ningress:\n  - hostname: ' + ARGO_DOMAIN + '\n    service: http://localhost:' + ARGO_PORT + '\n    originRequest:\n      noTLSVerify: true\n  - service: http_status:404';
        fs.writeFileSync(path.join(FILE_PATH, 'tunnel.yml'), tunnelYaml);
        log('info', 'Tunnel config generated');
    }
}

// 进程守护与按需恢复逻辑
async function keepAlive(name, filePath, command, args, delay = 5000) {
    log('debug', `Starting process: ${name}`);

    if (!fs.existsSync(filePath)) {
        log('debug', `File missing, recovering: ${path.basename(filePath)}`);
        await downloadFilesAndRun();
        if (!fs.existsSync(filePath)) {
            log('error', `Recovery failed for ${path.basename(filePath)}`);
            setTimeout(() => keepAlive(name, filePath, command, args, delay), delay);
            return;
        }
        fs.chmodSync(filePath, 0o775);
    }

    const exeName = path.basename(command);
    try {
        const child = spawn('./' + exeName, args, {
            cwd: FILE_PATH,
            detached: false,
            stdio: LOG_LEVEL === 'debug' ? 'inherit' : 'ignore'
        });

        child.on('exit', (code, signal) => {
            log('debug', `Process ${name} exited (code: ${code}), restarting...`);
            setTimeout(() => keepAlive(name, filePath, command, args, delay), delay);
        });

        child.on('error', (err) => {
            log('error', `Process ${name} error:`, err.message);
            setTimeout(() => keepAlive(name, filePath, command, args, delay), delay);
        });
    } catch (err) {
        log('error', `Failed to start ${name}:`, err.message);
        setTimeout(() => keepAlive(name, filePath, command, args, delay), delay);
    }
}

// 下载逻辑 (保持原逻辑但优化)
function downloadFile(fileName, fileUrl) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(fileName);
        axios({ 
            method: 'get', 
            url: fileUrl, 
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
            .then(response => {
                response.data.pipe(writer);
                writer.on('finish', () => {
                    writer.close();
                    fs.chmodSync(fileName, 0o775);
                    log('debug', 'Downloaded:', path.basename(fileName));
                    resolve(fileName);
                });
                writer.on('error', err => {
                    fs.unlink(fileName, () => { });
                    reject(err);
                });
            })
            .catch(reject);
    });
}

function getSystemArchitecture() {
    const arch = os.arch();
    return (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') ? 'arm' : 'amd';
}

function getFilesForArchitecture(architecture) {
    const prefix = architecture === 'arm' ? DOWNLOAD_BASE_ARM : DOWNLOAD_BASE_AMD;
    let files = [
        { fileName: webPath, fileUrl: prefix + '/web' },
        { fileName: botPath, fileUrl: prefix + '/bot' }
    ];
    if (NEZHA_SERVER && NEZHA_KEY) {
        if (NEZHA_PORT) {
            files.push({ fileName: npmPath, fileUrl: prefix + '/agent' });
        } else {
            files.push({ fileName: phpPath, fileUrl: prefix + '/v1' });
        }
    }
    return files;
}

async function downloadFilesAndRun() {
    const architecture = getSystemArchitecture();
    const filesToDownload = getFilesForArchitecture(architecture);
    for (const file of filesToDownload) {
        if (!fs.existsSync(file.fileName)) {
            try {
                await downloadFile(file.fileName, file.fileUrl);
            } catch (err) {
                log('error', 'Download failed:', path.basename(file.fileName));
            }
        }
    }
}

async function generateConfig() {
    const config = {
        log: { access: '/dev/null', error: '/dev/null', loglevel: 'none' },
        inbounds: [
            {
                port: ARGO_PORT,
                protocol: 'vless',
                settings: {
                    clients: [{ id: UUID }],
                    decryption: 'none',
                    fallbacks: [
                        { dest: 3001 },
                        { path: "/vless-argo", dest: 3002 },
                        { path: "/vmess-argo", dest: 3003 },
                        { path: "/trojan-argo", dest: 3004 }
                    ]
                },
                streamSettings: { network: 'tcp' },
                sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false }
            },
            { port: 3001, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID }], decryption: "none" }, streamSettings: { network: "tcp", security: "none" } },
            { port: 3002, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID, level: 0 }], decryption: "none" }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/vless-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
            { port: 3003, listen: "127.0.0.1", protocol: "vmess", settings: { clients: [{ id: UUID, alterId: 0 }] }, streamSettings: { network: "ws", wsSettings: { path: "/vmess-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
            { port: 3004, listen: "127.0.0.1", protocol: "trojan", settings: { clients: [{ password: UUID }] }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/trojan-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
        ],
        dns: { servers: ["https+local://8.8.8.8/dns-query"] },
        outbounds: [{ protocol: "freedom", tag: "direct" }, { protocol: "blackhole", tag: "block" }]
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function extractDomains() {
    log('debug', 'Extracting domains, ARGO_AUTH length:', ARGO_AUTH ? ARGO_AUTH.length : 0);
    if (ARGO_AUTH && ARGO_DOMAIN) {
        log('info', 'Using fixed domain mode');
        await generateLinks(ARGO_DOMAIN);
    } else if (ARGO_AUTH && !ARGO_DOMAIN) {
        log('warn', 'ARGO_AUTH set but ARGO_DOMAIN missing. Token mode requires ARGO_DOMAIN.');
    } else {
        // 临时隧道逻辑
        log('info', 'Using temporary tunnel mode');
        let count = 0;
        const checkLog = async () => {
            if (fs.existsSync(bootLogPath)) {
                const content = fs.readFileSync(bootLogPath, 'utf-8');
                const match = content.match(/https?:\/\/([^ ]*trycloudflare\.com)\/?/);
                if (match) {
                    log('info', 'Temporary domain obtained');
                    await generateLinks(match[1]);
                    return;
                }
            }
            if (count++ < 20) {
                setTimeout(checkLog, 2000);
            } else {
                log('error', 'Timeout: Failed to get temporary tunnel domain');
            }
        };
        checkLog();
    }
}

async function generateLinks(argoDomain) {
    log('debug', 'Generating links for domain:', argoDomain);
    const ISP = await getMetaInfo();
    log('debug', 'ISP info:', ISP);
    const nodeName = NAME ? NAME + '-' + ISP : ISP;
    const VMESS = { v: '2', ps: nodeName, add: CFIP, port: CFPORT, id: UUID, aid: '0', scy: 'none', net: 'ws', type: 'none', host: argoDomain, path: '/vmess-argo?ed=2560', tls: 'tls', sni: argoDomain, alpn: '', fp: 'firefox' };
    const subTxt = '\nvless://' + UUID + '@' + CFIP + ':' + CFPORT + '?encryption=none&security=tls&sni=' + argoDomain + '&fp=firefox&type=ws&host=' + argoDomain + '&path=%2Fvless-argo%3Fed%3D2560#' + nodeName + '\n\nvmess://' + Buffer.from(JSON.stringify(VMESS)).toString('base64') + '\n\ntrojan://' + UUID + '@' + CFIP + ':' + CFPORT + '?security=tls&sni=' + argoDomain + '&fp=firefox&type=ws&host=' + argoDomain + '&path=%2Ftrojan-argo%3Fed%3D2560#' + nodeName + '\n    ';
    fs.writeFileSync(subPath, Buffer.from(subTxt).toString('base64'));

    app.get('/' + SUB_PATH, (req, res) => {
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(Buffer.from(subTxt).toString('base64'));
    });

    log('info', 'Links generated, subscription path: /' + SUB_PATH);
    await uploadNodes();
}

async function startserver() {
    argoType();
    await deleteNodes();
    await downloadFilesAndRun();
    await generateConfig();

    // 启动哪吒
    if (NEZHA_SERVER && NEZHA_KEY) {
        if (!NEZHA_PORT) {
            const configYaml = 'client_secret: ' + NEZHA_KEY + '\nserver: ' + NEZHA_SERVER + '\nuuid: ' + UUID + '\ntls: true';
            fs.writeFileSync(path.join(FILE_PATH, 'config.yaml'), configYaml);
            keepAlive('nezha-v1', phpPath, phpPath, ['-c', 'config.yaml']);
        } else {
            keepAlive('nezha-v0', npmPath, npmPath, ['-s', NEZHA_SERVER + ':' + NEZHA_PORT, '-p', NEZHA_KEY, '--report-delay', '4']);
        }
    }

    // 启动 Xray
    keepAlive('xray', webPath, webPath, ['-c', 'config.json']);

    // 启动 Cloudflared
    let argoArgs = [];
    // 放宽正则：只要包含 eyJ 且长度足够即可认为是 Token
    if (ARGO_AUTH.indexOf('eyJ') !== -1 && ARGO_AUTH.length > 50) {
        argoArgs = ['tunnel', '--edge-ip-version', 'auto', '--no-autoupdate', '--protocol', 'http2', 'run', '--token', ARGO_AUTH];
    } else if (ARGO_AUTH.includes('TunnelSecret')) {
        argoArgs = ['tunnel', '--edge-ip-version', 'auto', '--config', 'tunnel.yml', 'run'];
    } else {
        argoArgs = ['tunnel', '--edge-ip-version', 'auto', '--no-autoupdate', '--protocol', 'http2', '--logfile', 'boot.log', '--url', 'http://localhost:' + ARGO_PORT];
    }
    keepAlive('cloudflared', botPath, botPath, argoArgs);

    await extractDomains();
    await AddVisitTask();
}

// 伪装首页
app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SITE_TITLE}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; }
        p { color: #666; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
    </style>
</head>
<body>
    <h1>${SITE_TITLE}</h1>
    <p>${SITE_DESC}</p>
    <p>This is a simple web application built with Node.js and Express.</p>
    <div class="footer">
        <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
    </div>
</body>
</html>`);
});

// 健康检查端点
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

app.listen(PORT, () => {
    log('info', 'Server running on port ' + PORT);
    log('debug', 'Environment check: UUID=' + (UUID ? 'SET' : 'NOT SET') + 
        ', ARGO_AUTH=' + (ARGO_AUTH ? 'SET(len:' + ARGO_AUTH.length + ')' : 'NOT SET') + 
        ', ARGO_DOMAIN=' + (ARGO_DOMAIN || 'NOT SET'));
});

startserver().catch(err => log('error', 'Server error:', err.message));
