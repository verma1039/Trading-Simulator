from __future__ import annotations


SUPPORTED_INDEXES = [
    {"id": "sp500", "symbol": "^GSPC", "name": "S&P 500", "label": "S&P 500"},
    {"id": "nasdaq100", "symbol": "^NDX", "name": "NASDAQ 100", "label": "NASDAQ 100"},
    {"id": "dowjones", "symbol": "^DJI", "name": "Dow Jones", "label": "Dow Jones"},
    {"id": "russell2000", "symbol": "^RUT", "name": "Russell 2000", "label": "Russell 2000"},
]

INDEX_OPTIONS = [
    {"label": "All", "value": "All"},
    *[
        {"label": item["label"], "value": item["label"]}
        for item in SUPPORTED_INDEXES
    ],
]

SUPPORTED_STOCKS = [
    {"id": "aapl", "symbol": "AAPL", "company": "Apple Inc.", "sector": "Technology", "indices": ["S&P 500", "NASDAQ 100", "Dow Jones"]},
    {"id": "msft", "symbol": "MSFT", "company": "Microsoft Corp.", "sector": "Technology", "indices": ["S&P 500", "NASDAQ 100", "Dow Jones"]},
    {"id": "nvda", "symbol": "NVDA", "company": "NVIDIA Corp.", "sector": "Semiconductors", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "amzn", "symbol": "AMZN", "company": "Amazon.com Inc.", "sector": "Consumer Discretionary", "indices": ["S&P 500", "NASDAQ 100", "Dow Jones"]},
    {"id": "meta", "symbol": "META", "company": "Meta Platforms Inc.", "sector": "Communication Services", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "googl", "symbol": "GOOGL", "company": "Alphabet Inc.", "sector": "Communication Services", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "tsla", "symbol": "TSLA", "company": "Tesla Inc.", "sector": "Consumer Discretionary", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "nflx", "symbol": "NFLX", "company": "Netflix Inc.", "sector": "Communication Services", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "amd", "symbol": "AMD", "company": "Advanced Micro Devices Inc.", "sector": "Semiconductors", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "jpm", "symbol": "JPM", "company": "JPMorgan Chase & Co.", "sector": "Financials", "indices": ["S&P 500", "Dow Jones"]},
    {"id": "v", "symbol": "V", "company": "Visa Inc.", "sector": "Financials", "indices": ["S&P 500", "Dow Jones"]},
    {"id": "ma", "symbol": "MA", "company": "Mastercard Inc.", "sector": "Financials", "indices": ["S&P 500"]},
    {"id": "cost", "symbol": "COST", "company": "Costco Wholesale Corp.", "sector": "Consumer Staples", "indices": ["S&P 500", "NASDAQ 100"]},
    {"id": "wmt", "symbol": "WMT", "company": "Walmart Inc.", "sector": "Consumer Staples", "indices": ["S&P 500", "Dow Jones"]},
    {"id": "dis", "symbol": "DIS", "company": "The Walt Disney Co.", "sector": "Communication Services", "indices": ["S&P 500", "Dow Jones"]},
    {"id": "ba", "symbol": "BA", "company": "Boeing Co.", "sector": "Industrials", "indices": ["S&P 500", "Dow Jones"]},
]

SUPPORTED_STOCK_SYMBOLS = [item["symbol"] for item in SUPPORTED_STOCKS]
SUPPORTED_STOCK_BY_SYMBOL = {item["symbol"]: item for item in SUPPORTED_STOCKS}
