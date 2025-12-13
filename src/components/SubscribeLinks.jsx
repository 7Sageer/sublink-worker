/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

export const SubscribeLinks = (props) => {
    const { t, links } = props;

    if (!links) return null;

    return (
        <div x-data="{ copied: null }" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 transition-all duration-300 hover:shadow-md">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <span class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <i class="fas fa-link text-sm"></i>
                </span>
                {t('subscriptionLinks')}
            </h2>

            <div class="space-y-4">
                {/* Xray Link */}
                <div class="relative group">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('xrayLink')}
                    </label>
                    <div class="flex gap-2">
                        <input
                            type="text"
                            readonly
                            value={links.xray}
                            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                        />
                        <button
                            type="button"
              x-on:click={`$clipboard('${links.xray}'); copied = 'xray'; setTimeout(() => copied = null, 2000)`}
                        class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                        x-bind:class="{'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': copied === 'xray'}"
            >
                        <i class="fas" x-bind:class="copied === 'xray' ? 'fa-check' : 'fa-copy'"></i>
                </button>
            </div>
        </div>

        {/* SingBox Link */ }
    <div class="relative group">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('singboxLink')}
        </label>
        <div class="flex gap-2">
            <input
                type="text"
                readonly
                value={links.singbox}
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
            />
            <button
                type="button"
              x-on:click={`$clipboard('${links.singbox}'); copied = 'singbox'; setTimeout(() => copied = null, 2000)`}
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
            x-bind:class="{'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': copied === 'singbox'}"
            >
            <i class="fas" x-bind:class="copied === 'singbox' ? 'fa-check' : 'fa-copy'"></i>
    </button>
          </div >
        </div >

    {/* Clash Link */ }
    < div class="relative group" >
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('clashLink')}
          </label>
          <div class="flex gap-2">
            <input 
              type="text" 
              readonly 
              value={links.clash} 
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
            />
            <button 
              type="button"
              x-on:click={`$clipboard('${links.clash}'); copied = 'clash'; setTimeout(() => copied = null, 2000)`}
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
              x-bind:class="{'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': copied === 'clash'}"
            >
              <i class="fas" x-bind:class="copied === 'clash' ? 'fa-check' : 'fa-copy'"></i>
            </button >
          </div >
        </div >

    {/* Surge Link */ }
    < div class="relative group" >
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('surgeLink')}
          </label>
          <div class="flex gap-2">
            <input 
              type="text" 
              readonly 
              value={links.surge} 
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
            />
            <button 
              type="button"
              x-on:click={`$clipboard('${links.surge}'); copied = 'surge'; setTimeout(() => copied = null, 2000)`}
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
              x-bind:class="{'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': copied === 'surge'}"
            >
              <i class="fas" x-bind:class="copied === 'surge' ? 'fa-check' : 'fa-copy'"></i>
            </button >
          </div >
        </div >
      </div >
    </div >
  );
};
