"""
基金数据接口 - 使用 AkShare
"""
import akshare as ak
from typing import List, Dict


def search_funds(query: str, limit: int = 10) -> List[Dict]:
    """
    搜索基金（代码或名称模糊匹配）
    
    Args:
        query: 搜索关键词
        limit: 返回结果数量限制
        
    Returns:
        基金列表 [{'code': '...', 'name': '...', 'type': '...', 'pinyin': '...'}]
    """
    query = query.strip().lower()
    
    if not query:
        return []
    
    try:
        # 获取全市场基金列表
        df = ak.fund_name_em()
        
        if df.empty:
            return []
        
        # 重命名列以保持一致性
        df = df.rename(columns={
            '基金代码': 'code',
            '基金简称': 'name',
            '基金类型': 'type',
            '拼音缩写': 'pinyin'
        })
        
        results = []
        
        # 优先级 1: 精确代码匹配
        exact_code = df[df['code'] == query]
        if not exact_code.empty:
            results.extend(exact_code.to_dict('records'))
        
        # 优先级 2: 代码开头匹配
        if len(results) < limit:
            code_starts = df[
                (df['code'].str.startswith(query)) & 
                (~df['code'].isin([r['code'] for r in results]))
            ]
            results.extend(code_starts.head(limit - len(results)).to_dict('records'))
        
        # 优先级 3: 名称包含
        if len(results) < limit:
            name_contains = df[
                (df['name'].str.lower().str.contains(query, na=False)) &
                (~df['code'].isin([r['code'] for r in results]))
            ]
            results.extend(name_contains.head(limit - len(results)).to_dict('records'))
        
        # 优先级 4: 拼音包含
        if len(results) < limit:
            pinyin_contains = df[
                (df['pinyin'].str.lower().str.contains(query, na=False)) &
                (~df['code'].isin([r['code'] for r in results]))
            ]
            results.extend(pinyin_contains.head(limit - len(results)).to_dict('records'))
        
        return results[:limit]
        
    except Exception as e:
        print(f"Error searching funds: {e}")
        return []


import pandas as pd
from datetime import datetime, timedelta
import inspect

def get_fund_holdings(fund_code: str, year: str = None):
    """
    获取基金持仓信息（前十大重仓股）
    """
    current_year = str(datetime.now().year)
    if not year:
        year = current_year
    
    try:
        sig = None
        try:
            sig = inspect.signature(ak.fund_portfolio_hold_em)
        except Exception:
            sig = None

        def _call_holdings(target_year: str):
            if sig and "symbol" in sig.parameters:
                return ak.fund_portfolio_hold_em(symbol=fund_code, date=target_year)
            try:
                return ak.fund_portfolio_hold_em(fund_code, target_year)
            except TypeError:
                return ak.fund_portfolio_hold_em(code=fund_code, year=target_year)

        df = _call_holdings(year)
        
        if df.empty and year == current_year:
            prev_year = str(int(year) - 1)
            df = _call_holdings(prev_year)

        if not df.empty:
            # 统一字段名（不同年份接口返回可能略有差异，这里简单处理）
            return df.to_dict('records')
        return []
    except Exception as e:
        print(f"Error fetching holdings for {fund_code}: {e}")
        return []

def get_fund_info(fund_code: str) -> Dict:
    """
    获取基金详细信息
    """
    try:
        # 1. 获取基本信息 (增强容错)
        basic_info = {}
        try:
            df_basic = ak.fund_individual_basic_info_em(symbol=fund_code)
            if not df_basic.empty:
               # 尝试不同的解析方式，这里假设是两列: item, value
               if 'item' in df_basic.columns and 'value' in df_basic.columns:
                   for _, row in df_basic.iterrows():
                       basic_info[row['item']] = row['value']
               # 如果是单行宽表
               elif len(df_basic) == 1:
                   basic_info = df_basic.iloc[0].to_dict()
        except Exception as e:
            print(f"Error fetching basic info: {e}")

        # 2. 获取净值走势
        df = ak.fund_open_fund_info_em(symbol=fund_code, indicator="单位净值走势")
        
        if df is None or df.empty:
            return {}
        
        # 标准化列名
        if '净值日期' not in df.columns:
            cols = list(df.columns)
            if len(cols) >= 3:
                df = df.rename(columns={
                    cols[0]: '净值日期',
                    cols[1]: '单位净值',
                    cols[2]: '日增长率',
                })
        
        # 核心修复：按日期倒序排序
        if '净值日期' in df.columns:
            df['净值日期'] = pd.to_datetime(df['净值日期'], errors='coerce')
            df = df.sort_values('净值日期', ascending=False).reset_index(drop=True)
            df['净值日期'] = df['净值日期'].dt.strftime('%Y-%m-%d')
        
        # 获取最新净值
        latest = df.iloc[0] if not df.empty else None
        
        # 获取最近 100 条历史数据
        history = df.head(100).to_dict('records') if not df.empty else []

        # 3. 获取持仓数据
        holdings = get_fund_holdings(fund_code)
        
        return {
            'code': fund_code,
            'latest_nav': float(latest.get('单位净值', 0)) if latest is not None else 0,
            'nav_date': str(latest.get('净值日期', '')) if latest is not None else '',
            'daily_growth': float(latest.get('日增长率', 0)) if latest is not None else 0,
            'manager': basic_info.get('基金经理', basic_info.get('Manager', '---')),
            'fund_size': basic_info.get('基金规模', basic_info.get('Asset Size', '---')),
            'rating': basic_info.get('晨星评级', basic_info.get('Rating', '---')),
            'history': history,
            'holdings': holdings
        }
        
    except Exception as e:
        print(f"Error fetching fund info for {fund_code}: {e}")
        return {}
