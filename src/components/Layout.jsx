import { html } from 'hono/html'
import { APP_KEYWORDS } from '../constants.js';

export const Layout = (props) => {
  const { title, children } = props
  return html`
    <!DOCTYPE html>
    <html lang="en" x-data="appData()">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <meta name="description" content="Convert and optimize your subscription links easily" />
        <meta name="keywords" content="${APP_KEYWORDS}" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.10/dist/cdn.min.js" onerror="window.__alpineFailed=true"></script>
        <script>
          window.__alpineLoaded = false;
          document.addEventListener('alpine:init', () => { window.__alpineLoaded = true; });
          window.addEventListener('DOMContentLoaded', () => {
            if (window.__alpineFailed || !window.__alpineLoaded) {
              console.error('Failed to initialize Alpine.js. Interactive features are disabled.');
              const warning = document.createElement('div');
              warning.className = 'fixed bottom-4 right-4 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg shadow';
              warning.textContent = '加载 Alpine.js 失败，页面交互功能不可用，请刷新或检查网络。';
              document.body.appendChild(warning);
            }
          });
        </script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  primary: {
                    50: '#eef9ff',
                    100: '#dcf2ff',
                    200: '#b2e6ff',
                    300: '#6ed4ff',
                    400: '#33c5ff', // Spaceship Blue
                    500: '#0aa3eb',
                    600: '#0082ca',
                    700: '#0068a3',
                    800: '#005887',
                    900: '#06496f',
                    950: '#042f4a',
                  },
                  gray: {
                    850: '#1f2937',
                    900: '#111827',
                    950: '#0b0f19', // Deep dark for background
                  }
                },
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            position: relative;
            min-height: 100vh;
          }

          /* Subtle radial gradient background */
          body::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -2;
            background:
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(10, 163, 235, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 90% 80%, rgba(51, 197, 255, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at 10% 90%, rgba(0, 130, 202, 0.04) 0%, transparent 50%);
            pointer-events: none;
          }

          .dark body::before,
          html.dark body::before {
            background:
              radial-gradient(ellipse 80% 50% at 50% -20%, rgba(10, 163, 235, 0.12) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 90% 80%, rgba(51, 197, 255, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at 10% 90%, rgba(0, 130, 202, 0.05) 0%, transparent 50%);
          }

          /* Subtle noise texture overlay */
          body::after {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -1;
            opacity: 0.3;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            background-repeat: repeat;
            background-size: 128px 128px;
          }

          .dark body::after,
          html.dark body::after {
            opacity: 0.15;
          }

          [x-cloak] { display: none !important; }
        </style>
        <script>
          function appData() {
            return {
              darkMode: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
              toggleDarkMode() {
                this.darkMode = !this.darkMode;
                localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
                if (this.darkMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              },
              init() {
                if (this.darkMode) {
                  document.documentElement.classList.add('dark');
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        ${children}
      </body>
    </html>
  `
}
