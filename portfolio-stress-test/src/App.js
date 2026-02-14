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
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search for stocks as user types
  const searchStocks = async (query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/search-stocks?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowSuggestions(data.results && data.results.length > 0);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search to avoid too many API calls
  const handleTickerChange = (value) => {
    setTicker(value);
    setError('');
    
    // Clear any existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set new timeout for search
    window.searchTimeout = setTimeout(() => {
      searchStocks(value);
    }, 300); // Wait 300ms after user stops typing
  };

  // Select a stock from suggestions
  const selectStock = (stock) => {
    setTicker(stock.ticker);
    setSearchResults([]);
    setShowSuggestions(false);
  };

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
            <div className="search-container">
              <input
                type="text"
                placeholder="Search stock (e.g., AAPL or Apple)"
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStock()}
                onFocus={() => ticker && searchResults.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="ticker-input"
              />
              {searching && <div className="search-spinner">🔍</div>}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && searchResults.length > 0 && (
                <div className="suggestions-dropdown">
                  {searchResults.map((stock, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectStock(stock)}
                    >
                      <div className="suggestion-main">
                        <span className="suggestion-ticker">{stock.ticker}</span>
                        <span className="suggestion-name">{stock.name}</span>
                      </div>
                      <div className="suggestion-details">
                        <span className="suggestion-price">${stock.price?.toFixed(2)}</span>
                        <span className="suggestion-sector">{stock.sector}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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