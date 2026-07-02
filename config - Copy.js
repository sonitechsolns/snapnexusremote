// config.js - SnapNexus Unified Configuration (place at root of your domain)
const SnapNexus = {
    ENDPOINT: 'https://cloud.appwrite.io/v1',
    PROJECT_ID: '69d8eda100264f4e42ae',
    BUCKET_ID: '69d8f2b800397ad57e50',
    DATABASE_ID: '69d8f0b0003c6d1e4d93',
    COLLECTION_ID: 'EventsTable',
    
    // Helper: build absolute URL for internal links
    resolveUrl: function(relativePath) {
        if (relativePath.startsWith('/')) {
            return window.location.origin + relativePath;
        }
        return window.location.origin + '/' + relativePath;
    },
    
    debug: false,
    log: function(...args) {
        if (this.debug) console.log('[SnapNexus]', ...args);
    },
    error: function(...args) {
        console.error('[SnapNexus]', ...args);
    }
};

// Mount configuration and Appwrite SDK tools to window context
window.SnapNexus = SnapNexus;
window.cfg = SnapNexus;

// Note: Ensure the Appwrite SDK script is loaded before config.js or handle initialization lazily
// To prevent duplicate declarations in HTML files, we instantiate them once here.
// But we must wait for Appwrite to defined on window if it was loaded after.
if (typeof Appwrite !== 'undefined') {
    window.client = new Appwrite.Client()
        .setEndpoint(SnapNexus.ENDPOINT)
        .setProject(SnapNexus.PROJECT_ID);
    window.account = new Appwrite.Account(window.client);
    window.databases = new Appwrite.Databases(window.client);
    window.storage = new Appwrite.Storage(window.client);
} else {
    // Attempt initialization on DOMContentLoaded if loaded asynchronously
    document.addEventListener("DOMContentLoaded", function() {
        if (typeof Appwrite !== 'undefined') {
            window.client = new Appwrite.Client()
                .setEndpoint(SnapNexus.ENDPOINT)
                .setProject(SnapNexus.PROJECT_ID);
            window.account = new Appwrite.Account(window.client);
            window.databases = new Appwrite.Databases(window.client);
            window.storage = new Appwrite.Storage(window.client);
        }
    });
}
