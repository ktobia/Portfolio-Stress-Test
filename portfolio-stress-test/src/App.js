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
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  // Add stock to portfolio
  const addStock = async () => {
    // Clear any previous errors
    setError('');

    // Validate ticker
    if (!ticker || ticker.trim() === '') {
      setError('Please enter a stock ticker');
      return;
    }

    // Validate shares
    const sharesNum = parseFloat(shares);
    if (!shares || isNaN(sharesNum) || sharesNum <= 0) {
      setError('Please enter a valid number of shares (greater than 0)');
      return;
    }

    // Validate ticker exists by checking with backend
    setValidating(true);
    try {
      const response = await fetch('http://localhost:5000/api/validate-ticker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: ticker.toUpperCase() }),
      });

      const data = await response.json();
      
      if (!data.valid) {
        setError(`Invalid ticker symbol: ${ticker.toUpperCase()}. Please check and try again.`);
        setValidating(false);
        return;
      }

      // Add to portfolio if valid
      setPortfolio([...portfolio, { 
        ticker: ticker.toUpperCase(), 
        shares: sharesNum,
        id: Date.now()
      }]);
      setTicker('');
      setShares('');
      setError('');
    } catch (error) {
      console.error('Error validating ticker:', error);
      setError('Unable to validate ticker. Make sure the backend is running.');
    } finally {
      setValidating(false);
    }
  };

  // Remove stock from portfolio
  const removeStock = (id) => {
    setPortfolio(portfolio.filter(stock => stock.id !== id));
  };

  // Run stress test
  const runStressTest = async () => {
    if (portfolio.length === 0) {
      setError('Please add stocks to your portfolio first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/stress-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolio }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStressTestResults(data.results);
        setAiInsights(data.ai_insights);
        setError('');
      } else {
        setError(data.error || 'Failed to run stress test');
      }
    } catch (error) {
      console.error('Error running stress test:', error);
      setError('Failed to run stress test. Make sure the backend is running.');
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
          
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

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
            <button onClick={addStock} className="btn-add" disabled={validating}>
              {validating ? 'Validating...' : 'Add Stock'}
            </button>
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