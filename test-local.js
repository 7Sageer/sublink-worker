// 本地测试脚本
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const yaml = require('js-yaml');

const projectRoot = path.resolve(__dirname);
const baseConfigPath = path.join(projectRoot, 'src', 'BaseConfigBuilder.js');
const clashBuilderPath = path.join(projectRoot, 'src', 'ClashConfigBuilder.js');
const testCasesPath = path.join(projectRoot, 'test-cases.yaml');
const i18nPath = path.join(projectRoot, 'src', 'i18n', 'index.js');

console.log('🔧 修复模块导入路径:', baseConfigPath);

let BaseConfigBuilder;
let ClashConfigBuilder;
let i18nModule;
async function ensureModuleLoaded() {
    if (!BaseConfigBuilder) {
        const module = await import(pathToFileURL(baseConfigPath).href);
        BaseConfigBuilder = module.BaseConfigBuilder;
        if (!BaseConfigBuilder) {
            throw new Error('BaseConfigBuilder 模块未导出');
        }
    }
    if (!ClashConfigBuilder) {
        const module = await import(pathToFileURL(clashBuilderPath).href);
        ClashConfigBuilder = module.ClashConfigBuilder;
        if (!ClashConfigBuilder) {
            throw new Error('ClashConfigBuilder 模块未导出');
        }
    }
}

async function ensureI18nLoaded() {
    if (!i18nModule) {
        i18nModule = await import(pathToFileURL(i18nPath).href);
        if (i18nModule?.setLanguage) {
            i18nModule.setLanguage('zh-CN');
        }
    }
}

function loadTestCases() {
    if (!fs.existsSync(testCasesPath)) {
        throw new Error(`未找到测试用例文件: ${testCasesPath}`);
    }
    const rawContent = fs.readFileSync(testCasesPath, 'utf8');
    const parsed = yaml.load(rawContent, { json: true });
    if (!parsed || !Array.isArray(parsed.tests)) {
        throw new Error('测试用例文件格式错误，应包含 tests 数组');
    }
    return parsed.tests;
}

function evaluateResult(items, builder, expected) {
    const report = { passed: true, messages: [] };
    const tags = items.map(item => item?.tag).filter(Boolean);

    if (typeof expected.proxyCount === 'number') {
        if (items.length !== expected.proxyCount) {
            report.passed = false;
            report.messages.push(`预期代理数量 ${expected.proxyCount}，实际 ${items.length}`);
        }
    }

    if (Array.isArray(expected.proxyTags)) {
        const missing = expected.proxyTags.filter(tag => !tags.includes(tag));
        if (missing.length > 0) {
            report.passed = false;
            report.messages.push(`缺少预期节点: ${missing.join(', ')}`);
        }
    }

    if (expected.typeCount && typeof expected.typeCount === 'object') {
        const typeSummary = items.reduce((acc, item) => {
            if (!item || !item.type) return acc;
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {});
        Object.entries(expected.typeCount).forEach(([type, count]) => {
            if (typeSummary[type] !== count) {
                report.passed = false;
                report.messages.push(`类型 ${type} 预期 ${count} 个，实际 ${typeSummary[type] || 0} 个`);
            }
        });
    }

    if (expected.config && typeof expected.config === 'object') {
        Object.entries(expected.config).forEach(([key, value]) => {
            if (JSON.stringify(builder.config?.[key]) !== JSON.stringify(value)) {
                report.passed = false;
                report.messages.push(`配置项 ${key} 未按预期覆盖`);
            }
        });
    }

    // 校验指定节点的字段（支持点号路径，如 tls.alpn）
    if (Array.isArray(expected.proxyDetails)) {
        const getByPath = (obj, path) => {
            return String(path)
                .split('.')
                .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
        };

        expected.proxyDetails.forEach(({ tag, fields }) => {
            const item = items.find(it => it && it.tag === tag);
            if (!item) {
                report.passed = false;
                report.messages.push(`未找到名为 ${tag} 的节点用于字段校验`);
                return;
            }
            Object.entries(fields || {}).forEach(([path, expectedValue]) => {
                const actual = getByPath(item, path);
                if (JSON.stringify(actual) !== JSON.stringify(expectedValue)) {
                    report.passed = false;
                    report.messages.push(`节点 ${tag} 字段 ${path} 预期 ${JSON.stringify(expectedValue)}，实际 ${JSON.stringify(actual)}`);
                }
            });
        });
    }

    return report;
}

async function runTest(testCase) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    const preview = testCase.input.length > 120
        ? `${testCase.input.substring(0, 117)}...`
        : testCase.input;
    console.log(`📝 输入片段: ${preview}`);
    
    try {
        await ensureModuleLoaded();
        const builder = new BaseConfigBuilder(testCase.input, {}, 'zh-CN', 'test-agent');
        const items = await builder.parseCustomItems();

        console.log(`📊 解析结果: ${items.length} 个代理节点`);

        if (items.length > 0) {
            console.log('📋 节点列表:');
            items.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.tag} (${item.type})`);
            });
        }

        const result = evaluateResult(items, builder, testCase.expected || {});
        console.log(`✅ 测试结果: ${result.passed ? '通过' : '失败'}`);
        if (!result.passed) {
            result.messages.forEach(msg => console.log(`   - ${msg}`));
        }
        console.log('---');
        return result.passed;
        
    } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 开始本地测试 YAML 解析功能\n');
    const cases = loadTestCases();

    let passedTests = 0;
    for (const testCase of cases) {
        const result = await runTest(testCase);
        if (result) {
            passedTests++;
        }
    }
    const totalTests = cases.length;
    console.log(`\n🎯 测试完成!`);
    console.log(`📊 结果: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过!YAML 解析功能工作正常!');
    } else {
        console.log('⚠️  有测试失败，请检查实现');
    }

    // 附加：构建级 Clash 配置输出测试（验证 proxy-groups 清理与去重）
    await runClashOutputTest();
    await runCountryGroupTest();
}

// 执行测试
runAllTests().then(() => {
    console.log('\n🏁 测试完成，可以安全部署了!');
}).catch(error => {
        console.error('测试执行失败:', error);
});

async function runClashOutputTest() {
    console.log('\n🧪 追加测试: Clash 构建输出中的 proxy-groups 清理');
    const input = `
proxies:
  - name: Valid-SS
    type: ss
    server: example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: 自定义选择
    type: select
    proxies:
      - DIRECT
      - REJECT
      - Valid-SS
      - " NotExist "
`;

    try {
        await ensureModuleLoaded();
        const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
        const yamlText = await builder.build();
        const built = yaml.load(yamlText);
        const grp = (built['proxy-groups'] || []).find(g => g && g.name === '自定义选择');
        if (!grp) {
            throw new Error('未找到自定义选择分组');
        }
        const expected = ['DIRECT','REJECT','Valid-SS'];
        const actual = grp.proxies || [];
        const ok = JSON.stringify(actual) === JSON.stringify(expected);
        console.log(`✅ 结果: ${ok ? '通过' : '失败'}`);
        if (!ok) {
            console.log('   期望:', expected);
            console.log('   实际:', actual);
        }
    } catch (e) {
        console.error('❌ Clash 构建输出测试失败:', e.message);
    }
}

async function runCountryGroupTest() {
    console.log('\n🧪 追加测试: 按国家分组功能 (Clash)');
    const input = `
ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1
ss://YWVzLTEyOC1nY206dGVzdA@example.com:444#香港节点2
ss://YWVzLTEyOC1nY206dGVzdA@example.com:445#US-Node-1
trojan://password@example.com:443?sni=example.com#美国节点2
vmess://ewogICJ2IjogIjIiLAogICJwcyI6ICJ0dzEubm9kZS5jb20iLAogICJhZGQiOiAidHcxLm5vZGUuY29tIiwKICAicG9ydCI6IDQ0MywKICAiaWQiOiAiZGE4Y2FkMTYtYjEzNS00MmZlLWEzYjYtNzUyZGFhY2E5MGIwIiwKICAiYWlkIjogMCwKICAibmV0IjogIndzIiwKICAidHlwZSI6ICJub25lIiwKICAiaG9zdCI6ICJ0dzEubm9kZS5jb20iLAogICJwYXRoIjogIi92bWVzcyIsCiAgInRscyI6ICJ0bHMiCn0=#台湾节点
    `;

    try {
        await ensureModuleLoaded();
        await ensureI18nLoaded();
        const t = i18nModule?.t;
        const builder = new ClashConfigBuilder(input, 'all', [], null, 'zh-CN', 'test-agent', true);

        // 关键修复：必须调用 build() 来触发完整的配置生成流程
        const yamlText = await builder.build();
        const built = yaml.load(yamlText);

        let passed = true;
        const messages = [];
        const proxiesCount = (built.proxies || []).length;

        const hkGroup = (built['proxy-groups'] || []).find(g => g && g.name === '🇭🇰 Hong Kong');
        if (!hkGroup || hkGroup.proxies.length !== 2 || hkGroup.type !== 'url-test') {
            passed = false;
            messages.push('香港分组验证失败 (预期 2 个节点, url-test 类型)');
        }

        const usGroup = (built['proxy-groups'] || []).find(g => g && g.name === '🇺🇸 United States');
        if (!usGroup || usGroup.proxies.length !== 2 || usGroup.type !== 'url-test') {
            passed = false;
            messages.push('美国分组验证失败 (预期 2 个节点, url-test 类型)');
        }

        const twGroup = (built['proxy-groups'] || []).find(g => g && g.name === '🇹🇼 Taiwan');
        if (!twGroup || twGroup.proxies.length !== 1 || twGroup.type !== 'url-test') {
            passed = false;
            messages.push('台湾分组验证失败 (预期 1 个节点, url-test 类型)');
        }

        const manualName = t ? t('outboundNames.Manual Switch') : '🖐️ 手动切换';
        const autoName = t ? t('outboundNames.Auto Select') : '⚡ 自动选择';
        const nodeSelectLabel = t ? t('outboundNames.Node Select') : '🚀 节点选择';
        const youtubeLabel = t ? t('outboundNames.Youtube') : '📹 油管视频';

        const manualGroup = (built['proxy-groups'] || []).find(g => g && g.name === manualName);
        if (!manualGroup || manualGroup.type !== 'select') {
            passed = false;
            messages.push('手动切换分组验证失败 (未找到或类型错误)');
        } else {
            const manualProxies = manualGroup.proxies || [];
            if (manualProxies.length !== proxiesCount) {
                passed = false;
                messages.push(`手动切换分组节点数量不正确 (预期 ${proxiesCount}, 实际 ${manualProxies.length})`);
            }
        }

        const nodeSelectGroup = (built['proxy-groups'] || []).find(g => g && g.name === nodeSelectLabel);
        if (!nodeSelectGroup) {
            passed = false;
            messages.push(`未找到 "${nodeSelectLabel}" 分组`);
        } else {
            const expectedProxies = [autoName, manualName, '🇭🇰 Hong Kong', '🇹🇼 Taiwan', '🇺🇸 United States'];
            const actualProxies = nodeSelectGroup.proxies || [];
            if (JSON.stringify(actualProxies.sort()) !== JSON.stringify(expectedProxies.sort())) {
                passed = false;
                messages.push(`"${nodeSelectLabel}" 分组成员不匹配. 预期: ${expectedProxies}, 实际: ${actualProxies}`);
            }
        }

        const youtubeGroup = (built['proxy-groups'] || []).find(g => g && g.name === youtubeLabel);
        if (youtubeGroup) {
            const expectedMembers = [nodeSelectLabel, autoName, manualName, '🇭🇰 Hong Kong', '🇹🇼 Taiwan', '🇺🇸 United States'];
            const actualMembers = youtubeGroup.proxies || [];
            const missing = expectedMembers.filter(name => !actualMembers.includes(name));
            if (missing.length > 0) {
                passed = false;
                messages.push(`"${youtubeLabel}" 分组缺少预期成员: ${missing.join(', ')}`);
            }
        }

        console.log(`✅ 结果: ${passed ? '通过' : '失败'}`);
        if (!passed) {
            messages.forEach(msg => console.log(`   - ${msg}`));
        }

    } catch (e) {
        console.error('❌ 按国家分组测试失败:', e.message);
        console.error(e.stack);
    }
}
