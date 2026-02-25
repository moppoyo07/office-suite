// Service Worker登録（クライアントポータル専用）
// このスクリプトはポータルページでService Workerを登録します

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // vite-plugin-pwaが生成するService Workerを登録
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('SW registered:', registration.scope);
        } catch (error) {
            console.log('SW registration failed:', error);
        }
    });
}
