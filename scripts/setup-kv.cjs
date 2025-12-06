#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KV_NAMESPACE = 'SUBLINK_KV';
const WORKER_NAME = 'sublink-worker'
const KV_NAMESPACE_NAME = `${WORKER_NAME}-${KV_NAMESPACE}`;
const LEGACY_KV_NAMESPACE_NAME = `${WORKER_NAME}-${WORKER_NAME}-${KV_NAMESPACE}`;  // 历史遗留的命名空间名称
const FALLBACK_KV_NAMESPACE_NAME = KV_NAMESPACE; // 早期账号里只叫 SUBLINK_KV
const SUPPORTED_TITLES = [
  KV_NAMESPACE_NAME,
  LEGACY_KV_NAMESPACE_NAME,
  FALLBACK_KV_NAMESPACE_NAME
];
const WRANGLER_CONFIG_PATH = path.join(__dirname, '..', 'wrangler.toml');

// 执行wrangler命令并返回结果
function runWranglerCommand(command, ignoreError = false) {
  try {
    return execSync(`npx wrangler ${command}`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    if (ignoreError) {
      throw error;
    }
    console.error(`执行命令失败: npx wrangler ${command}`);
    console.error(error.message);
    if (error.stdout) console.log('stdout:', error.stdout.toString());
    if (error.stderr) console.error('stderr:', error.stderr.toString());
    process.exit(1);
  }
}

// 检查KV namespace是否存在
function checkKvNamespaceExists() {
  console.log(`正在检查KV namespace ${SUPPORTED_TITLES.map(title => `"${title}"`).join('、')} 是否存在...`);
  let output;
  try {
    output = runWranglerCommand('kv namespace list');
  } catch (e) {
    console.error('获取KV列表失败，跳过检查');
    return null;
  }
  
  try {
    // 尝试从输出中提取JSON部分（如果有）
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const namespaces = JSON.parse(jsonMatch[0]);
      // 优先使用按顺序声明的各版本命名空间
      for (const title of SUPPORTED_TITLES) {
        const namespace = namespaces.find(ns => ns.title === title);
        if (namespace) {
          console.log(`找到命名空间: ${title}`);
          return namespace;
        }
      }
      
      return null;
    }
    
    // 如果没有匹配到JSON格式，就使用正则表达式查找namespace
    for (const title of SUPPORTED_TITLES) {
      const namespaceRegex = new RegExp(`"${title}"\\s*([a-zA-Z0-9-]+)`);
      const match = output.match(namespaceRegex);
      if (match) {
        console.log(`找到命名空间: ${title}`);
        return {
          title,
          id: match[1]
        };
      }
    }

    return null;
  } catch (error) {
    console.error('解析KV namespace列表失败:', error.message);
    console.error('原始输出:', output);
    return null;
  }
}

// 从wrangler.toml读取现有ID
function getExistingIdFromConfig() {
  try {
    const config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    const match = config.match(/id\s*=\s*"([a-zA-Z0-9]+)"/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

// 创建KV namespace
function createKvNamespace() {
  console.log(`创建KV namespace "${KV_NAMESPACE_NAME}"...`);

  try {
    const output = runWranglerCommand(`kv namespace create "${KV_NAMESPACE}"`, true);
    // 尝试从输出中提取ID
    const idMatch = output.match(/id\s*=\s*"([^"]+)"/);
    if (idMatch) {
      return {
        title: KV_NAMESPACE_NAME,
        id: idMatch[1]
      };
    } else {
      throw new Error('无法从输出中提取KV namespace ID');
    }
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString() : '';
    const stdout = error.stdout ? error.stdout.toString() : '';
    const output = stderr + stdout;

    // 检查是否是因为已存在导致的错误 (code: 10014)
    if (output.includes('code: 10014') || output.includes('already exists')) {
      console.log(`KV namespace "${KV_NAMESPACE_NAME}" 已存在 (虽然未在列表显示)。尝试使用 wrangler.toml 中的现有 ID。`);
      const existingId = getExistingIdFromConfig();
      if (existingId) {
        console.log(`使用现有 ID: ${existingId}`);
        return {
          title: KV_NAMESPACE_NAME,
          id: existingId
        };
      } else {
        console.error('无法自动获取 ID：Namespace 已存在但在 wrangler.toml 中未找到现有 ID。请手动检查 Cloudflare 控制台。');
        process.exit(1);
      }
    }

    console.error('创建KV namespace失败:', error.message);
    console.error('Output:', output);
    process.exit(1);
  }
}

// 更新wrangler.toml文件
function updateWranglerConfig(kvNamespaceId) {
  console.log(`更新wrangler.toml文件...`);
  
  try {
    let config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    
    // 使用正则表达式查找并替换KV namespace ID
    const kvConfigRegex = /kv_namespaces\s*=\s*\[\s*{\s*binding\s*=\s*"SUBLINK_KV"\s*,\s*id\s*=\s*"([^"]*)"\s*}\s*\]/;
    
    if (kvConfigRegex.test(config)) {
      config = config.replace(kvConfigRegex, `kv_namespaces = [\n  { binding = "SUBLINK_KV", id = "${kvNamespaceId}" }\n]`);
    } else {
      // 如果没有找到现有的KV配置，则添加新的配置
      config += `\nkv_namespaces = [\n  { binding = "SUBLINK_KV", id = "${kvNamespaceId}" }\n]\n`;
    }
    
    fs.writeFileSync(WRANGLER_CONFIG_PATH, config);
    console.log('wrangler.toml文件已更新');
  } catch (error) {
    console.error('更新wrangler.toml文件失败:', error.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('开始设置KV namespace...');
  
  // 检查KV namespace是否存在
  let namespace = checkKvNamespaceExists();
  
  // 如果不存在，则创建
  if (!namespace) {
    console.log(`KV namespace "${KV_NAMESPACE_NAME}"不存在，正在创建...`);
    namespace = createKvNamespace();
    console.log(`KV namespace "${KV_NAMESPACE_NAME}"创建成功，ID: ${namespace.id}`);
  } else {
    console.log(`KV namespace "${KV_NAMESPACE_NAME}"已存在，ID: ${namespace.id}`);
  }
  
  // 更新wrangler.toml文件
  updateWranglerConfig(namespace.id);
  
  console.log('设置完成！');
}

main(); 
