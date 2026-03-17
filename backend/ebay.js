const EbayAuthToken = require('ebay-oauth-nodejs-client');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID,
    clientSecret: process.env.EBAY_CLIENT_SECRET,
    redirectUri: process.env.EBAY_CALLBACK_URL
});

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
    try {
        if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
            return cachedToken;
        }
        const token = await ebayAuthToken.getApplicationToken('PRODUCTION');
        cachedToken = token;

        tokenExpiry = Date.now() + (7200 * 1000);
        return token;

    } catch (error) {
        console.error('Error getting eBay access token:', error.message);
        throw new Error('Failed to authenticate with eBay API');
    }
}

/**
 * Search for products on eBay
 * @param {string} query - Search keywords
 * @param {object} options - Search options
 * @param {number} options.limit - Max number of results (default: 10)
 * @param {string} options.categoryId - eBay category ID for fashion items
 * @param {string} options.condition - NEW, USED, UNSPECIFIED
 * @param {string} options.sortOrder - price, bestMatch, endingSoonest, etc.
 * @returns {Promise<Array>} Array of product listings
 */
async function searchProducts(query, options = {}) {
    try {
        const token = await getAccessToken();
        const limit = options.limit || 10;
        
        const params = {
            q: query,
            limit: limit,
        };

        // optional filters
        if (options.categoryId) {
            params.category_ids = options.categoryId;
        }
        if (options.condition) {
            params.filter = `conditions:{${options.condition}}`;
        }
        if (options.sortOrder) {
            params.sort = options.sortOrder;
        }

        const response = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
            },
            params: params
        });

        // Transform response to simplified format
        const items = response.data.itemSummaries || [];
        return items.map(item => ({
            id: item.itemId,
            title: item.title,
            price: item.price?.value,
            currency: item.price?.currency,
            image: item.image?.imageUrl,
            condition: item.condition,
            itemWebUrl: item.itemWebUrl,
            seller: item.seller?.username,
            shippingCost: item.shippingOptions?.[0]?.shippingCost?.value || 'N/A'
        }));
    } catch (error) {
        console.error('eBay search error:', error.response?.data || error.message);
        throw new Error(`eBay search failed: ${error.message}`);
    }
}

/**
 * Get detailed information about a specific eBay item
 * @param {string} itemId - eBay item ID
 * @returns {Promise<object>} Detailed item information
 */
async function getItemDetails(itemId) {
    try {
        const token = await getAccessToken();
        
        const response = await axios.get(`https://api.ebay.com/buy/browse/v1/item/${itemId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
            }
        });

        return response.data;
    } catch (error) {
        console.error('eBay item details error:', error.response?.data || error.message);
        throw new Error(`Failed to get item details: ${error.message}`);
    }
}

/**
 * Fetch recent clothing postings from eBay and store them in a JSON file
 * @param {object} options - Fetch options
 * @param {number} options.limit - Number of items to fetch (default: 50)
 * @param {string} options.outputFile - Output JSON file path (default: data/ebay_clothing.json)
 * @param {string} options.category - Clothing category to search (default: 'clothing')
 * @param {string} options.categoryId - Specific eBay category ID (optional, defaults to Women's Clothing)
 * @returns {Promise<object>} Result with file path and item count
 */
async function fetchAndStoreClothing(options = {}) {
    try {
        const limit = options.limit || 50;
        const outputFile = options.outputFile || path.join(__dirname, 'data', 'ebay_clothing.json');
        const category = options.category || 'clothing';
        
        console.log(`Fetching ${limit} recent clothing items from eBay...`);
        
        // 15724 = Women's Clothing
        // 1059 = Men's Clothing
        const categoryId = options.categoryId || '15724';
        
        const items = await searchProducts(category, {
            limit: limit,
            categoryId: categoryId,
            sortOrder: 'newlyListed' // Get recent postings
        });
        
        const dataToStore = {
            fetchedAt: new Date().toISOString(),
            totalItems: items.length,
            category: category,
            categoryId: categoryId,
            items: items
        };
        
        const dataDir = path.dirname(outputFile);
        await fs.mkdir(dataDir, { recursive: true });
        
        await fs.writeFile(
            outputFile,
            JSON.stringify(dataToStore, null, 2),
            'utf8'
        );
        
        console.log(`Successfully saved ${items.length} clothing items to ${outputFile}`);
        
        return {
            success: true,
            filePath: outputFile,
            itemCount: items.length,
            fetchedAt: dataToStore.fetchedAt
        };
        
    } catch (error) {
        console.error('Error fetching and storing clothing:', error.message);
        throw new Error(`Failed to fetch and store clothing: ${error.message}`);
    }
}

module.exports = {
    getAccessToken,
    searchProducts,
    getItemDetails,
    fetchAndStoreClothing
};
