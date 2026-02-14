import React, { useState } from 'react';
import './App.css';

function App() {
  // State management
  const [portfolio, setPortfolio] = useState([]);
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [stressTestResults, setStressTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState('');

  // Add stock to portfolio
  const addStock = () => {
    if (ticker && shares && parseFloat(shares) > 0) {
      setPortfolio([...portfolio, { 
        ticker: ticker.toUpperCase(), 
        shares: parseFloat(shares),
        id: Date.now()
      }]);
      setTicker('');
      setShares('');
    }
  };

  // Remove stock from portfolio
  const removeStock = (id) => {
    setPortfolio(portfolio.filter(stock => stock.id !== id));
  };

  // Run stress test
  const runStressTest = async () => {
    if (portfolio.length === 0) {
      alert('Please add stocks to your portfolio first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/stress-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolio }),
      });

      const data = await response.json();
      setStressTestResults(data.results);
      setAiInsights(data.ai_insights);
    } catch (error) {
      console.error('Error running stress test:', error);
      alert('Failed to run stress test. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <h1>📊 Portfolio Stress Testing</h1>
        <p>Analyze your portfolio's resilience to market shocks</p>
      </header>

      <div className="container">
        {/* Portfolio Input Section */}
        <section className="input-section">
          <h2>Build Your Portfolio</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Stock Ticker (e.g., AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
            />
            <input
              type="number"
              placeholder="Shares"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
            />
            <button onClick={addStock} className="btn-add">Add Stock</button>
          </div>

          {/* Portfolio Display */}
          {portfolio.length > 0 && (
            <div className="portfolio-list">
              <h3>Current Portfolio</h3>
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Shares</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map(stock => (
                    <tr key={stock.id}>
                      <td>{stock.ticker}</td>
                      <td>{stock.shares}</td>
                      <td>
                        <button 
                          onClick={() => removeStock(stock.id)}
                          className="btn-remove"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stress Test Button */}
          <button 
            onClick={runStressTest} 
            className="btn-stress-test"
            disabled={loading || portfolio.length === 0}
          >
            {loading ? 'Running Analysis...' : 'Run Stress Test'}
          </button>
        </section>

        {/* Results Section */}
        {stressTestResults && (
          <section className="results-section">
            <h2>Stress Test Results</h2>
            
            {/* Portfolio Summary */}
            <div className="summary-card">
              <h3>Portfolio Summary</h3>
              <p><strong>Current Value:</strong> ${stressTestResults.current_value?.toFixed(2)}</p>
              <p><strong>Worst Case Value:</strong> ${stressTestResults.worst_case_value?.toFixed(2)}</p>
              <p className="loss-highlight">
                <strong>Potential Loss:</strong> ${stressTestResults.potential_loss?.toFixed(2)} 
                ({stressTestResults.loss_percentage?.toFixed(2)}%)
              </p>
            </div>

            {/* Scenario Results */}
            <div className="scenarios">
              <h3>Scenario Analysis</h3>
              {stressTestResults.scenarios?.map((scenario, index) => (
                <div key={index} className="scenario-card">
                  <h4>{scenario.name}</h4>
                  <p>{scenario.description}</p>
                  <p><strong>Impact:</strong> {scenario.impact}%</p>
                  <p><strong>Portfolio Value:</strong> ${scenario.portfolio_value?.toFixed(2)}</p>
                  <p><strong>Loss:</strong> ${scenario.loss?.toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* AI Insights */}
            {aiInsights && (
              <div className="ai-insights">
                <h3>🤖 AI-Powered Insights</h3>
                <p>{aiInsights}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
