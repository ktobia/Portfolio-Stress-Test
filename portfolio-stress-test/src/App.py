from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import google.generativeai as genai
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure Gemini API (you'll need to set your API key)
# genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

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
        current_price = info.get('currentPrice') or info.get('regularMarketPrice')
        
        return {
            'ticker': ticker,
            'current_price': current_price,
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
        if stock_data:
            value = stock_data['current_price'] * shares
            total_value += value
            stock_details.append({
                **stock_data,
                'shares': shares,
                'value': value
            })
    
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
    """Generate AI-powered insights using Gemini API"""
    try:
        # Uncomment when you have Gemini API key
        # model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Analyze this portfolio stress test:
        
        Portfolio:
        {[f"{s['ticker']}: {s['shares']} shares at ${s['current_price']}" for s in stock_details]}
        
        Current Value: ${results['current_value']:.2f}
        Worst Case Value: ${results['worst_case_value']:.2f}
        Potential Loss: ${results['potential_loss']:.2f} ({results['loss_percentage']:.2f}%)
        
        Provide a brief 2-3 sentence analysis of the portfolio's risk profile and recommendations.
        """
        
        # response = model.generate_content(prompt)
        # return response.text
        
        # Placeholder response when API key is not configured
        return f"Your portfolio shows a potential maximum loss of {results['loss_percentage']:.1f}% under worst-case scenarios. " \
               f"The portfolio contains {len(stock_details)} stocks with current value of ${results['current_value']:.2f}. " \
               f"Consider diversification to reduce exposure to severe market shocks."
    
    except Exception as e:
        print(f"Error generating AI insights: {e}")
        return "AI insights unavailable. Configure Gemini API key for detailed analysis."

@app.route('/api/stress-test', methods=['POST'])
def stress_test():
    """Main endpoint for running stress tests"""
    try:
        data = request.json
        portfolio = data.get('portfolio', [])
        
        if not portfolio:
            return jsonify({'error': 'Portfolio is empty'}), 400
        
        # Calculate current portfolio value
        current_value, stock_details = calculate_portfolio_value(portfolio)
        
        if current_value == 0:
            return jsonify({'error': 'Unable to fetch stock data'}), 500
        
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
        
        return jsonify({
            'results': results,
            'ai_insights': ai_insights,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error in stress test: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("🚀 Portfolio Stress Testing Backend Starting...")
    print("📊 Make sure to install dependencies:")
    print("   pip install flask flask-cors yfinance google-generativeai")
    print("\n🔑 Set your Gemini API key:")
    print("   export GEMINI_API_KEY='your-api-key-here'")
    print("\n✅ Server running on http://localhost:5000")
    app.run(debug=True, port=5000)