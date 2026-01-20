from tavily import TavilyClient
from typing import List, Dict, Optional

def search_fund_news(query: str, api_key: str, max_results: int = 5) -> List[Dict]:
    """
    使用 Tavily 搜索基金相关新闻
    
    Args:
        query: 搜索关键词
        api_key: Tavily API Key
        max_results: 最大结果数
    """
    if not api_key:
        print("Error: API Key is required for Tavily search")
        return []

    try:
        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=query,
            search_depth="advanced",
            topic="news",
            max_results=max_results,
            include_answer=False,
            include_raw_content=False,
            include_images=False,
        )
        return response.get("results", [])
    except Exception as e:
        print(f"Error searching Tavily: {e}")
        return []

def search_market_sentiment(api_key: str, max_results: int = 3) -> List[Dict]:
    """
    搜索当前市场宏观情绪
    """
    if not api_key:
        return []
        
    try:
        client = TavilyClient(api_key=api_key)
        query = "A股 市场情绪 宏观分析 最新"
        response = client.search(
            query=query,
            search_depth="advanced",
            topic="news",
            max_results=max_results
        )
        return response.get("results", [])
    except Exception as e:
        print(f"Error searching market sentiment: {e}")
        return []
