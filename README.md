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

1. **Install dependencies:**
   ```bash
   npm install
   ```
   
2. Fill in your API credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   EBAY_CLIENT_ID=your_ebay_client_id_here
   EBAY_CLIENT_SECRET=your_ebay_client_secret_here
   EBAY_CALLBACK_URL=your_ebay_callback_url_here
   
   PORT=3000
   NODE_ENV=development
   ```

3. **Start the server:**
   ```bash
   cd backend
   npm run dev
   ```

   The server will run on `http://localhost:3000`

## eBay Fashion Category IDs

Common fashion category IDs you can use with the `categoryId` parameter:

- `15724` - Women's Clothing
- `1059` - Men's Clothing  
- `3034` - Women's Shoes
- `93427` - Men's Shoes
- `45238` - Women's Bags & Handbags
- `15687` - Women's Accessories
- `4250` - Men's Accessories
