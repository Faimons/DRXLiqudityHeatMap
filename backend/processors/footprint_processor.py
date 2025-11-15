"""
Volume Footprint Processor
Calculates buy/sell delta per price level
"""
from typing import List, Dict, Any
from collections import defaultdict
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


def calculate_volume_delta(trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate volume delta (buy volume - sell volume) per price level

    Args:
        trades: List of recent trades

    Returns:
        List of price levels with volume delta
    """
    volume_by_price = defaultdict(lambda: {
        "buy_volume": 0.0,
        "sell_volume": 0.0,
        "trade_count": 0,
        "timestamps": []
    })

    for trade in trades:
        price = round(trade["price"], 0)  # Round to nearest dollar
        quantity = trade["quantity"]

        if trade["is_buy"]:
            volume_by_price[price]["buy_volume"] += quantity
        else:
            volume_by_price[price]["sell_volume"] += quantity

        volume_by_price[price]["trade_count"] += 1
        volume_by_price[price]["timestamps"].append(trade["timestamp"])

    # Convert to list with delta calculation
    result = []
    for price, data in volume_by_price.items():
        delta = data["buy_volume"] - data["sell_volume"]
        result.append({
            "price": price,
            "buy_volume": round(data["buy_volume"], 4),
            "sell_volume": round(data["sell_volume"], 4),
            "delta": round(delta, 4),
            "trade_count": data["trade_count"],
            "imbalance_ratio": round(
                data["buy_volume"] / (data["buy_volume"] + data["sell_volume"]),
                 3
            ) if (data["buy_volume"] + data["sell_volume"]) > 0 else 0.5
        })

    # Sort by price descending
    result.sort(key=lambda x: x["price"], reverse=True)

    return result


def calculate_cumulative_delta(footprint_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate cumulative delta across price levels

    Args:
        footprint_data: Volume delta data

    Returns:
        Footprint data with cumulative delta
    """
    cumulative = 0.0
    result = []

    # Sort by timestamp/price for proper cumulative calculation
    sorted_data = sorted(footprint_data, key=lambda x: x["price"])

    for level in sorted_data:
        cumulative += level["delta"]
        result.append({
            **level,
            "cumulative_delta": round(cumulative, 4)
        })

    return result


def detect_absorption(
    footprint_data: List[Dict[str, Any]],
    threshold_volume: float = 50.0
) -> List[Dict[str, Any]]:
    """
    Detect absorption zones (large volume without significant price movement)

    Args:
        footprint_data: Volume delta data
        threshold_volume: Minimum volume to consider for absorption

    Returns:
        List of absorption zones
    """
    absorptions = []

    for level in footprint_data:
        total_volume = level["buy_volume"] + level["sell_volume"]

        if total_volume >= threshold_volume:
            # Check if there's an imbalance
            if abs(level["imbalance_ratio"] - 0.5) > 0.2:  # More than 70/30 split
                absorptions.append({
                    "price": level["price"],
                    "total_volume": round(total_volume, 4),
                    "imbalance_ratio": level["imbalance_ratio"],
                    "dominant_side": "buy" if level["imbalance_ratio"] > 0.5 else "sell",
                    "strength": round(abs(level["imbalance_ratio"] - 0.5) * 2, 3)  # 0-1 scale
                })

    # Sort by strength
    absorptions.sort(key=lambda x: x["strength"], reverse=True)

    return absorptions


def calculate_vwap(trades: List[Dict[str, Any]]) -> float:
    """
    Calculate Volume-Weighted Average Price

    Args:
        trades: List of trades

    Returns:
        VWAP value
    """
    if not trades:
        return 0.0

    total_volume = sum(t["quantity"] for t in trades)
    if total_volume == 0:
        return 0.0

    weighted_sum = sum(t["price"] * t["quantity"] for t in trades)
    vwap = weighted_sum / total_volume

    return round(vwap, 2)


def process_footprint(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process trades into complete footprint analysis

    Args:
        trades: List of recent trades

    Returns:
        Complete footprint data
    """
    if not trades:
        return {
            "timestamp": 0,
            "footprint": [],
            "cumulative_delta": [],
            "absorptions": [],
            "vwap": 0,
            "total_buy_volume": 0,
            "total_sell_volume": 0,
            "net_delta": 0
        }

    # Calculate volume delta
    footprint_data = calculate_volume_delta(trades)

    # Calculate cumulative delta
    cumulative_data = calculate_cumulative_delta(footprint_data)

    # Detect absorptions
    absorptions = detect_absorption(footprint_data)

    # Calculate VWAP
    vwap = calculate_vwap(trades)

    # Calculate totals
    total_buy = sum(t["quantity"] for t in trades if t["is_buy"])
    total_sell = sum(t["quantity"] for t in trades if not t["is_buy"])
    net_delta = total_buy - total_sell

    return {
        "timestamp": trades[-1]["timestamp"] if trades else 0,
        "footprint": footprint_data[:100],  # Top 100 levels
        "cumulative_delta": cumulative_data[-1]["cumulative_delta"] if cumulative_data else 0,
        "absorptions": absorptions[:10],  # Top 10 absorption zones
        "vwap": vwap,
        "total_buy_volume": round(total_buy, 4),
        "total_sell_volume": round(total_sell, 4),
        "net_delta": round(net_delta, 4),
        "buy_sell_ratio": round(total_buy / total_sell, 3) if total_sell > 0 else 0
    }
