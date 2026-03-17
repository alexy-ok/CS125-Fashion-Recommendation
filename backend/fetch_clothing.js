const { fetchAndStoreClothing } = require('./ebay');

async function main() {
    try {
        console.log('Starting eBay clothing fetch...');
        
        const result = await fetchAndStoreClothing({
            limit: 50, // Fetch 50 items
            category: 'clothing',
            outputFile: './data/ebay_clothing.json'
        });
        
        console.log('\nSuccess!');
        console.log(`  - File: ${result.filePath}`);
        console.log(`  - Items: ${result.itemCount}`);
        console.log(`  - Fetched at: ${result.fetchedAt}`);
        
    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

main();
