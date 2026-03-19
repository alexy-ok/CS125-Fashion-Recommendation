# CS125-Fashion-Recommendation

A fashion recommendation system for CS 125 taking listings from different websites for clothing and accessories, and recommending them to the user based on several criteria.


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

4. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```

   The server will run on `http://localhost:5173`

