"""
Orderbook Heatmap Processor
Aggregates orderbook levels and detects large walls
"""
from typing import List, Tuple, Dict, Any
from collections import defaultdict
from backend.config import PRICE_STEP_SIZE, WALL_THRESHOLD_BTC
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


def aggregate_levels(
    levels: List[List[float]],
    step_size: float = PRICE_STEP_SIZE
) -> List[Dict[str, Any]]:
    """
    Aggregate orderbook levels into larger price steps

    Args:
        levels: List of [price, size] pairs
        step_size: Price step for aggregation (e.g., 10.0 for $10 steps)

    Returns:
        List of aggregated levels with price, size, and count
    """
    aggregated = defaultdict(lambda: {"size": 0.0, "count": 0, "prices": []})

    for price, size in levels:
        # Calculate bucket
        bucket = int(price / step_size) * step_size
        aggregated[bucket]["size"] += size
        aggregated[bucket]["count"] += 1
        aggregated[bucket]["prices"].append(price)

    # Convert to list
    result = []
    for bucket_price, data in aggregated.items():
        result.append({
            "price": bucket_price,
            "size": round(data["size"], 4),
            "count": data["count"],
            "avg_price": round(sum(data["prices"]) / len(data["prices"]), 2)
        })

    # Sort by price
    result.sort(key=lambda x: x["price"], reverse=True)

    return result


def detect_walls(
    bids: List[List[float]],
    asks: List[List[float]],
    threshold: float = WALL_THRESHOLD_BTC
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detect large orders (walls) in the orderbook

    Args:
        bids: List of [price, size] for bids
        asks: List of [price, size] for asks
        threshold: Minimum size in BTC to be considered a wall

    Returns:
        Dict with 'bid_walls' and 'ask_walls'
    """
    bid_walls = []
    ask_walls = []

    # Detect bid walls
    for price, size in bids:
        if size >= threshold:
            bid_walls.append({
                "price": price,
                "size": size,
                "side": "bid",
                "distance_from_mid": None  # Will be calculated later
            })

    # Detect ask walls
    for price, size in asks:
        if size >= threshold:
            ask_walls.append({
                "price": price,
                "size": size,
                "side": "ask",
                "distance_from_mid": None
            })

    # Calculate mid price if we have both bids and asks
    if bids and asks:
        mid_price = (bids[0][0] + asks[0][0]) / 2
        for wall in bid_walls:
            wall["distance_from_mid"] = round(mid_price - wall["price"], 2)
        for wall in ask_walls:
            wall["distance_from_mid"] = round(wall["price"] - mid_price, 2)

    logger.info(f"Detected {len(bid_walls)} bid walls and {len(ask_walls)} ask walls")

    return {
        "bid_walls": bid_walls,
        "ask_walls": ask_walls,
        "total_walls": len(bid_walls) + len(ask_walls)
    }


def track_wall_changes(
    current_walls: Dict[str, List[Dict[str, Any]]],
    previous_walls: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Track changes in walls (absorbed, pulled, moved)

    Args:
        current_walls: Current wall data
        previous_walls: Previous wall data

    Returns:
        Dict with wall changes
    """
    changes = {
        "new": [],
        "absorbed": [],
        "pulled": [],
        "moved": []
    }

    if not previous_walls:
        # All current walls are new
        changes["new"] = current_walls.get("bid_walls", []) + current_walls.get("ask_walls", [])
        return changes

    # Create price->wall mappings
    current_by_price = {}
    for wall in current_walls.get("bid_walls", []) + current_walls.get("ask_walls", []):
        current_by_price[wall["price"]] = wall

    previous_by_price = {}
    for wall in previous_walls.get("bid_walls", []) + previous_walls.get("ask_walls", []):
        previous_by_price[wall["price"]] = wall

    # Check for new walls
    for price, wall in current_by_price.items():
        if price not in previous_by_price:
            changes["new"].append(wall)

    # Check for removed walls (absorbed or pulled)
    for price, wall in previous_by_price.items():
        if price not in current_by_price:
            # TODO: Determine if absorbed (traded) or pulled (cancelled)
            # This requires trade data correlation
            changes["pulled"].append(wall)

    # Check for moved walls (same size, different price)
    # This is more complex and requires tracking wall IDs
    # Simplified version: just detect size changes at existing prices
    for price in set(current_by_price.keys()) & set(previous_by_price.keys()):
        current_size = current_by_price[price]["size"]
        previous_size = previous_by_price[price]["size"]
        if abs(current_size - previous_size) > 1.0:  # Significant change
            changes["moved"].append({
                "price": price,
                "previous_size": previous_size,
                "current_size": current_size,
                "change": current_size - previous_size
            })

    return changes


def process_orderbook(orderbook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process raw orderbook data into heatmap format

    Args:
        orderbook_data: Raw orderbook data from Binance

    Returns:
        Processed data ready for visualization
    """
    bids = orderbook_data.get("bids", [])
    asks = orderbook_data.get("asks", [])

    # Aggregate levels
    aggregated_bids = aggregate_levels(bids)
    aggregated_asks = aggregate_levels(asks)

    # Detect walls
    walls = detect_walls(bids, asks)

    # Calculate total liquidity
    total_bid_liquidity = sum(size for _, size in bids)
    total_ask_liquidity = sum(size for _, size in asks)

    # Calculate imbalance
    total_liquidity = total_bid_liquidity + total_ask_liquidity
    bid_percentage = (total_bid_liquidity / total_liquidity * 100) if total_liquidity > 0 else 50
    ask_percentage = (total_ask_liquidity / total_liquidity * 100) if total_liquidity > 0 else 50

    return {
        "timestamp": orderbook_data.get("timestamp", 0),
        "symbol": orderbook_data.get("symbol", ""),
        "bids": {
            "raw": bids[:100],  # Top 100 levels
            "aggregated": aggregated_bids[:50],  # Top 50 aggregated levels
            "total_liquidity": round(total_bid_liquidity, 4)
        },
        "asks": {
            "raw": asks[:100],
            "aggregated": aggregated_asks[:50],
            "total_liquidity": round(total_ask_liquidity, 4)
        },
        "walls": walls,
        "spread": round(asks[0][0] - bids[0][0], 2) if bids and asks else 0,
        "mid_price": round((bids[0][0] + asks[0][0]) / 2, 2) if bids and asks else 0,
        "imbalance": {
            "bid_percentage": round(bid_percentage, 2),
            "ask_percentage": round(ask_percentage, 2)
        }
    }
