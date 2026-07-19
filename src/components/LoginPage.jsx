/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Layout } from './Layout.jsx';
import { APP_NAME } from '../constants.js';

export const LoginPage = ({ t, error }) => (
    <Layout title={t('loginTitle')}>
        <div class="min-h-screen flex items-center justify-center px-4 py-12">
            <main class="w-full max-w-md">
                <div class="text-center mb-8">
                    <img src="/favicon.ico" alt={`${APP_NAME} logo`} class="w-12 h-12 mx-auto mb-4" />
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
                    <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">{t('loginDescription')}</p>
                </div>

                <form method="post" action="/login" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg p-6">
                    <label for="secret" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('loginSecretLabel')}
                    </label>
                    <input
                        id="secret"
                        name="secret"
                        type="password"
                        autocomplete="current-password"
                        required
                        autofocus
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                    {error ? (
                        <p class="mt-3 text-sm text-red-600 dark:text-red-400">{t('loginInvalidSecret')}</p>
                    ) : null}
                    <button
                        type="submit"
                        class="mt-5 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
                    >
                        {t('loginSubmit')}
                    </button>
                </form>
            </main>
        </div>
    </Layout>
);
