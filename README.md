# CS125-Fashion-Recommendation

A fashion recommendation system for CS 125 taking listings from different websites for clothing and accessories, and recommending them to the user based on several criteria.

## Features

- **AI-Powered Style Matching**: Uses Google Gemini AI to analyze images and match them against style descriptions
- **eBay Product Search**: Search for fashion products on eBay with advanced filtering options
- **Style Scoring**: Get AI-generated scores (1-5) on how well products match your desired style

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- eBay Developer Account
- Google Gemini API Key

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the `backend` directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Fill in your API credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   EBAY_CLIENT_ID=your_ebay_client_id_here
   EBAY_CLIENT_SECRET=your_ebay_client_secret_here
   EBAY_CALLBACK_URL=your_ebay_callback_url_here
   
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server:**
   ```bash
   node app.js
   ```

   The server will run on `http://localhost:3000`

## API Endpoints

### 1. AI Style Score
**POST** `/ai-score`

Score how well an image matches a style description.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `image`: Image file (required)
  - `description`: Style description text (optional)

**Example:**
```bash
curl -X POST http://localhost:3000/ai-score \
  -F "image=@outfit.jpg" \
  -F "description=casual streetwear with earth tones"
```

**Response:**
```json
{
  "comments": "The image shows casual streetwear...",
  "score": 4
}
```

### 2. Search Products
**GET** `/search-products`

Search for fashion products on eBay.

**Query Parameters:**
- `query` (required): Search keywords
- `limit` (optional): Max results (default: 10)
- `categoryId` (optional): eBay category ID for fashion
- `condition` (optional): NEW, USED, UNSPECIFIED
- `sortOrder` (optional): price, bestMatch, endingSoonest

**Example:**
```bash
curl "http://localhost:3000/search-products?query=leather%20jacket&limit=5"
```

**Response:**
```json
{
  "query": "leather jacket",
  "count": 5,
  "products": [
    {
      "id": "v1|123456789|0",
      "title": "Men's Leather Jacket",
      "price": "89.99",
      "currency": "USD",
      "image": "https://...",
      "condition": "NEW",
      "itemWebUrl": "https://www.ebay.com/...",
      "seller": "seller_username",
      "shippingCost": "9.99"
    }
  ]
}
```

### 3. Get Item Details
**GET** `/item/:itemId`

Get detailed information about a specific eBay item.

**Example:**
```bash
curl "http://localhost:3000/item/v1|123456789|0"
```

## eBay Fashion Category IDs

Common fashion category IDs you can use with the `categoryId` parameter:

- `15724` - Women's Clothing
- `1059` - Men's Clothing  
- `3034` - Women's Shoes
- `93427` - Men's Shoes
- `45238` - Women's Bags & Handbags
- `15687` - Women's Accessories
- `4250` - Men's Accessories

## Project Structure

```
backend/
├── app.js              # Main Express application
├── ebay.js             # eBay API integration module
├── package.json        # Dependencies
├── .env.example        # Environment variables template
└── .env                # Your environment variables (create this)
```

## Usage Example

1. Start the server
2. Search for products matching your style:
   ```bash
   curl "http://localhost:3000/search-products?query=vintage%20denim%20jacket&limit=10"
   ```
3. Score product images against your style:
   ```bash
   curl -X POST http://localhost:3000/ai-score \
     -F "image=@product.jpg" \
     -F "description=vintage 90s casual"
   ```