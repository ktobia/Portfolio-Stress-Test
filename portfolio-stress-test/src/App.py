from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import yfinance as yf
import os
from datetime import datetime

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Stress test scenarios
SCENARIOS = [
    {
        "name": "Market Crash",
        "description": "Severe market downturn similar to 2008 financial crisis",
        "impact": -40
    },
    {
        "name": "Tech Sector Correction",
        "description": "Technology sector experiences significant correction",
        "impact": -25,
        "sector": "Technology"
    },
    {
        "name": "Interest Rate Shock",
        "description": "Federal Reserve raises rates aggressively",
        "impact": -15
    },
    {
        "name": "Mild Recession",
        "description": "Economic slowdown with moderate market impact",
        "impact": -20
    },
    {
        "name": "Black Swan Event",
        "description": "Unexpected catastrophic event",
        "impact": -50
    }
]

def get_stock_data(ticker):
    """Fetch current stock data using yfinance"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('regularMarketOpen')
        
        if not current_price:
            # Try getting recent price from history
            hist = stock.history(period="1d")
            if not hist.empty:
                current_price = hist['Close'].iloc[-1]
        
        return {
            'ticker': ticker,
            'current_price': float(current_price) if current_price else 0,
            'name': info.get('longName', ticker),
            'sector': info.get('sector', 'Unknown')
        }
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

def calculate_portfolio_value(portfolio_data):
    """Calculate total portfolio value"""
    total_value = 0
    stock_details = []
    
    for stock in portfolio_data:
        ticker = stock['ticker']
        shares = stock['shares']
        
        stock_data = get_stock_data(ticker)
        if stock_data and stock_data['current_price'] > 0:
            value = stock_data['current_price'] * shares
            total_value += value
            stock_details.append({
                **stock_data,
                'shares': shares,
                'value': value
            })
        else:
            print(f"Warning: Could not fetch valid data for {ticker}")
    
    return total_value, stock_details

def run_stress_scenarios(portfolio_data, current_value, stock_details):
    """Run stress test scenarios on portfolio"""
    scenario_results = []
    worst_case_value = current_value
    
    for scenario in SCENARIOS:
        impact = scenario['impact'] / 100
        scenario_value = current_value * (1 + impact)
        loss = current_value - scenario_value
        
        scenario_results.append({
            'name': scenario['name'],
            'description': scenario['description'],
            'impact': scenario['impact'],
            'portfolio_value': scenario_value,
            'loss': loss
        })
        
        if scenario_value < worst_case_value:
            worst_case_value = scenario_value
    
    return scenario_results, worst_case_value

def generate_ai_insights(portfolio_data, results, stock_details):
    """Generate AI-powered insights"""
    try:
        # Placeholder insights (Gemini API integration optional)
        num_stocks = len(stock_details)
        loss_pct = results['loss_percentage']
        
        if loss_pct > 40:
            risk_level = "high"
            recommendation = "Consider significant diversification across sectors and asset classes."
        elif loss_pct > 25:
            risk_level = "moderate to high"
            recommendation = "Review your sector allocation and consider adding defensive stocks."
        else:
            risk_level = "moderate"
            recommendation = "Your portfolio shows reasonable resilience, but continue monitoring."
        
        return f"Your portfolio of {num_stocks} stocks shows a {risk_level} risk profile with potential maximum loss of {loss_pct:.1f}% under worst-case scenarios. {recommendation} The current portfolio value is ${results['current_value']:.2f}."
    
    except Exception as e:
        print(f"Error generating AI insights: {e}")
        return "Portfolio analysis complete. Consider diversifying to reduce risk exposure."

@app.route('/api/stress-test', methods=['POST', 'OPTIONS'])
@cross_origin()
def stress_test():
    """Main endpoint for running stress tests"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        portfolio = data.get('portfolio', [])
        
        print(f"Received portfolio: {portfolio}")
        
        if not portfolio:
            return jsonify({'error': 'Portfolio is empty'}), 400
        
        # Calculate current portfolio value
        current_value, stock_details = calculate_portfolio_value(portfolio)
        
        if current_value == 0:
            return jsonify({'error': 'Unable to fetch stock data. Please check ticker symbols.'}), 500
        
        # Run stress scenarios
        scenario_results, worst_case_value = run_stress_scenarios(
            portfolio, current_value, stock_details
        )
        
        potential_loss = current_value - worst_case_value
        loss_percentage = (potential_loss / current_value) * 100
        
        results = {
            'current_value': current_value,
            'worst_case_value': worst_case_value,
            'potential_loss': potential_loss,
            'loss_percentage': loss_percentage,
            'scenarios': scenario_results,
            'stock_details': stock_details
        }
        
        # Generate AI insights
        ai_insights = generate_ai_insights(portfolio, results, stock_details)
        
        print(f"Stress test completed successfully")
        
        return jsonify({
            'results': results,
            'ai_insights': ai_insights,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error in stress test: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
@cross_origin()
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/validate-ticker', methods=['POST', 'OPTIONS'])
@cross_origin()
def validate_ticker():
    """Validate if a ticker symbol exists"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json
        ticker = data.get('ticker', '').strip().upper()
        
        if not ticker:
            return jsonify({'valid': False, 'error': 'Ticker is required'}), 400
        
        # Try to fetch stock data
        stock_data = get_stock_data(ticker)
        
        if stock_data and stock_data['current_price'] > 0:
            return jsonify({
                'valid': True,
                'ticker': ticker,
                'name': stock_data['name'],
                'current_price': stock_data['current_price']
            })
        else:
            return jsonify({
                'valid': False,
                'ticker': ticker,
                'error': 'Ticker not found or no price data available'
            })
    
    except Exception as e:
        print(f"Error validating ticker: {e}")
        return jsonify({'valid': False, 'error': str(e)}), 500

@app.route('/api/search-stocks', methods=['GET', 'OPTIONS'])
@cross_origin()
def search_stocks():
    """Search for stocks by ticker or name"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        query = request.args.get('q', '').strip().upper()
        
        if not query or len(query) < 1:
            return jsonify({'results': []})
        
        # Expanded list of popular stocks across all sectors
        common_stocks = [
            # Top Tech
            'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 
            'AVGO', 'ORCL', 'ADBE', 'CRM', 'CSCO', 'ACN', 'AMD', 'INTC', 'IBM',
            'QCOM', 'TXN', 'INTU', 'NOW', 'AMAT', 'MU', 'LRCX', 'KLAC', 'SNPS',
            'CDNS', 'MRVL', 'FTNT', 'PANW', 'CRWD', 'DDOG', 'NET', 'ZS',
            
            # Finance
            'BRK.B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW',
            'AXP', 'C', 'SPGI', 'BX', 'KKR', 'PGR', 'CB', 'MMC', 'ICE', 'CME',
            
            # Healthcare
            'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'PFE',
            'BMY', 'AMGN', 'GILD', 'CVS', 'CI', 'HUM', 'MCK', 'ELV', 'REGN',
            'VRTX', 'ISRG', 'SYK', 'BSX', 'MDT', 'ZTS', 'DXCM',
            
            # Consumer
            'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'TJX', 'COST',
            'PG', 'KO', 'PEP', 'PM', 'MO', 'MDLZ', 'CL', 'KMB', 'GIS', 'HSY',
            
            # Communication
            'DIS', 'NFLX', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'EA', 'TTWO',
            
            # Industrial & Energy
            'BA', 'CAT', 'GE', 'HON', 'UNP', 'RTX', 'LMT', 'DE', 'MMM',
            'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO',
            
            # Auto & Transport
            'TSLA', 'F', 'GM', 'UBER', 'LYFT', 'DAL', 'UAL', 'AAL', 'LUV',
            
            # Aerospace & Defense
            'RKLB',  # Rocket Lab - Added specifically!
            'LMT', 'BA', 'RTX', 'GD', 'NOC', 'TDG', 'HWM', 'LHX',
            
            # Retail & E-commerce
            'AMZN', 'BABA', 'JD', 'MELI', 'SE', 'SHOP', 'ETSY', 'W', 'CHWY',
            
            # Semiconductors
            'NVDA', 'TSM', 'AVGO', 'ASML', 'AMD', 'INTC', 'QCOM', 'TXN',
            'AMAT', 'LRCX', 'KLAC', 'MU', 'NXPI', 'MCHP', 'ADI', 'ON',
            
            # Cloud & SaaS
            'CRM', 'ORCL', 'ADBE', 'NOW', 'INTU', 'WDAY', 'TEAM', 'ZM',
            'SNOW', 'DDOG', 'CRWD', 'ZS', 'OKTA', 'VEEV', 'BILL',
            
            # EV & Clean Energy
            'TSLA', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'ENPH', 'SEDG',
            
            # Crypto & Fintech
            'COIN', 'SQ', 'PYPL', 'HOOD', 'SOFI', 'AFRM', 'NU',
            
            # Biotech
            'MRNA', 'BNTX', 'NVAX', 'BIIB', 'ILMN', 'INCY', 'BMRN', 'ALNY',
            
            # REITs
            'PLD', 'AMT', 'CCI', 'EQIX', 'PSA', 'DLR', 'O', 'WELL', 'AVB',
            
            # Misc
            'PLTR', 'RBLX', 'U', 'DASH', 'ABNB', 'SPOT', 'PINS', 'SNAP'
        ]
        
        # Find all stocks that start with the query (priority)
        matching_tickers = [
            ticker for ticker in common_stocks 
            if ticker.startswith(query)
        ]
        
        # If no startswith matches, try contains
        if not matching_tickers:
            matching_tickers = [
                ticker for ticker in common_stocks 
                if query in ticker
            ]
        
        # Limit results
        matching_tickers = matching_tickers[:8]
        
        # Fetch details for matching stocks
        results = []
        for ticker in matching_tickers:
            stock_data = get_stock_data(ticker)
            if stock_data and stock_data['current_price'] > 0:
                results.append({
                    'ticker': ticker,
                    'name': stock_data['name'],
                    'price': stock_data['current_price'],
                    'sector': stock_data.get('sector', 'Unknown')
                })
        
        # If still no results and query looks complete, try exact yfinance lookup
        if not results and len(query) >= 1:
            stock_data = get_stock_data(query)
            if stock_data and stock_data['current_price'] > 0:
                results.append({
                    'ticker': query,
                    'name': stock_data['name'],
                    'price': stock_data['current_price'],
                    'sector': stock_data.get('sector', 'Unknown')
                })
        
        return jsonify({'results': results})
    
    except Exception as e:
        print(f"Error searching stocks: {e}")
        return jsonify({'results': []}), 500

if __name__ == '__main__':
    print("🚀 Portfolio Stress Testing Backend Starting...")
    print("📊 Dependencies:")
    print("   pip3 install flask flask-cors yfinance")
    print("\n✅ Server starting on http://localhost:5000")
    print("🌐 CORS enabled for http://localhost:3000")
    print("\nEndpoints:")
    print("   GET  /api/health")
    print("   GET  /api/search-stocks?q=<query>")
    print("   POST /api/validate-ticker")
    print("   POST /api/stress-test")
    print("\n" + "="*50)
    app.run(debug=True, port=5000, host='127.0.0.1')