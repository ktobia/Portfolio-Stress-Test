# Portfolio-Stress-Test
  
A web-based Portfolio Stress Testing application that analyzes how your stock portfolio performs under both bull and bear market scenarios. Built with AI-powered insights using Google Gemini, this tool helps investors understand their portfolio's risk-reward profile through dynamic, personalized stress tests.
Features

Real-Time Stock Data - Fetch live market prices using Yahoo Finance API
AI-Powered Scenario Generation - Google Gemini creates custom stress tests based on your specific holdings
Dual Analysis - View both downside risks (crashes, corrections) and upside potential (bull runs, sector booms)
Smart Stock Search - Autocomplete search with real-time suggestions
Portfolio Management - Easy-to-use interface for building and managing your holdings
Visual Results - Color-coded scenarios with clear impact visualization
Educational Insights - AI-generated explanations help you understand your portfolio's vulnerabilities

Tech Stack
Frontend:

React - Fast, interactive user interface
CSS3 - Modern, responsive styling

Backend:

Python/Flask - RESTful API server
yfinance - Real-time stock market data from Yahoo Finance
Google Gemini 2.0 Flash - AI-powered scenario generation and portfolio insights

Prerequisites
Before you begin, ensure you have the following installed:

Python 3.8+ - Download Python
Node.js 14+ - Download Node.js
npm (comes with Node.js)
Google Gemini API Key - Get API Key

Installation & Setup
Step 1: Clone the Repository
bashgit clone https://github.com/yourusername/Portfolio-Stress-Test.git
cd Portfolio-Stress-Test
Step 2: Backend Setup
Install Python Dependencies
bash# Install required packages
pip3 install flask flask-cors yfinance google-generativeai python-dotenv
Or use the requirements file:
bashpip3 install -r requirements.txt
Configure Environment Variables
Create a .env file in the src directory:
bashcd portfolio-stress-test/src
touch .env
Add your Gemini API key to the .env file:
envGEMINI_API_KEY=your-api-key-here
Important: Never commit your .env file to version control. It should already be in .gitignore.
Start the Backend Server
bashpython3 App.py
The backend will start on http://localhost:5001
You should see:
🚀 Portfolio Stress Testing Backend Starting...
✅ Server starting on http://localhost:5001
🌐 CORS enabled for http://localhost:3000
Step 3: Frontend Setup
Navigate to React Project
bashcd portfolio-stress-test
Install Node Dependencies
bashnpm install
Start the React Development Server
bashnpm start
The frontend will automatically open in your browser at http://localhost:3000
How to Use
Building Your Portfolio

Search for Stocks - Type a ticker symbol (e.g., AAPL) or company name in the search box
Select from Suggestions - Click on a stock from the autocomplete dropdown
Enter Shares - Input the number of shares you own
Add to Portfolio - Click "Add Stock" to add it to your portfolio
Repeat - Add as many stocks as you'd like to analyze

Running Stress Tests

Click "Run Stress Test" - Once you've built your portfolio, click the button
Wait for Analysis - The AI will generate personalized scenarios based on your holdings
Review Results - Examine both downside risks and upside opportunities

Understanding Results
The app provides:

Current Portfolio Value - Your portfolio's current market value
Downside Risk - Worst-case scenario and potential losses
Upside Potential - Best-case scenario and potential gains
6 Custom Scenarios - 3 bearish and 3 bullish scenarios tailored to your holdings
AI Insights - Personalized analysis of your portfolio's strengths and vulnerabilities

Stress Test Scenarios
The AI generates scenarios such as:
Bearish Scenarios:

Market crashes and corrections
Sector-specific downturns
Interest rate shocks
Economic recessions

Bullish Scenarios:

Bull market rallies
Sector booms and innovations
Rate cut catalysts
Economic expansions
Configuration
Special Ticker Handling

The app automatically handles special tickers:

SPX → Fetches S&P 500 Index (^GSPC)
GOLD → Fetches Gold Futures (GC=F)

Built with ❤️ for investors who want to understand their portfolio's true risk-reward profile
