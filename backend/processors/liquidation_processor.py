"""
Liquidation Processor
Estimates liquidation levels based on leverage assumptions
"""
from typing import List, Dict, Any
from backend.config import LEVERAGE_LEVELS, LIQUIDATION_ESTIMATE_DEPTH
from backend.utils.logger import setup_logger

logger = setup_logger(__name__)


def estimate_liquidation_price(
    entry_price: float,
    leverage: int,
    is_long: bool
) -> float:
    """
    Calculate liquidation price for a position

    Args:
        entry_price: Entry price of the position
        leverage: Leverage used (e.g., 10, 25, 50, 100)
        is_long: True for long position, False for short

    Returns:
        Estimated liquidation price
    """
    if is_long:
        # Long liquidation = Entry Price * (1 - 1/Leverage)
        # Add 0.5% buffer for fees
        liquidation_price = entry_price * (1 - (1 / leverage) - 0.005)
    else:
        # Short liquidation = Entry Price * (1 + 1/Leverage)
        # Add 0.5% buffer for fees
        liquidation_price = entry_price * (1 + (1 / leverage) + 0.005)

    return round(liquidation_price, 2)


def generate_liquidation_heatmap(
    current_price: float,
    price_range_percentage: float = 5.0
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Generate liquidation heatmap data

    Args:
        current_price: Current market price
        price_range_percentage: Percentage range to calculate (default 5%)

    Returns:
        Liquidation levels for longs and shorts
    """
    long_liquidations = []
    short_liquidations = []

    # Calculate price range
    price_range = current_price * (price_range_percentage / 100)
    min_price = current_price - price_range
    max_price = current_price + price_range

    # Generate liquidation levels for different leverages
    for leverage in LEVERAGE_LEVELS:
        # Long liquidations (below current price)
        long_liq_price = estimate_liquidation_price(current_price, leverage, is_long=True)
        if long_liq_price >= min_price:
            long_liquidations.append({
                "price": long_liq_price,
                "leverage": leverage,
                "type": "long",
                "distance_from_current": round(current_price - long_liq_price, 2),
                "distance_percentage": round((current_price - long_liq_price) / current_price * 100, 2)
            })

        # Short liquidations (above current price)
        short_liq_price = estimate_liquidation_price(current_price, leverage, is_long=False)
        if short_liq_price <= max_price:
            short_liquidations.append({
                "price": short_liq_price,
                "leverage": leverage,
                "type": "short",
                "distance_from_current": round(short_liq_price - current_price, 2),
                "distance_percentage": round((short_liq_price - current_price) / current_price * 100, 2)
            })

    return {
        "current_price": current_price,
        "long_liquidations": long_liquidations,
        "short_liquidations": short_liquidations,
        "leverage_levels": LEVERAGE_LEVELS
    }


def calculate_liquidation_clusters(
    current_price: float,
    orderbook_data: Dict[str, Any],
    price_step: float = 10.0
) -> List[Dict[str, Any]]:
    """
    Estimate liquidation clusters based on orderbook density

    This is a simplified estimation. In reality, you would need:
    - Open Interest data from exchange
    - Funding rate data
    - Historical volume patterns

    Args:
        current_price: Current market price
        orderbook_data: Orderbook data
        price_step: Price step for clustering

    Returns:
        List of estimated liquidation clusters
    """
    clusters = []

    # Generate clusters at key liquidation points
    for leverage in LEVERAGE_LEVELS:
        # Long liquidation cluster
        long_liq_price = estimate_liquidation_price(current_price, leverage, is_long=True)

        # Estimate intensity based on proximity to support levels
        # This is simplified - real implementation would use open interest
        intensity = 100 / leverage  # Higher leverage = more likely liquidations

        clusters.append({
            "price": long_liq_price,
            "intensity": round(intensity, 2),
            "leverage": leverage,
            "type": "long",
            "estimated_volume": None  # Would need open interest data
        })

        # Short liquidation cluster
        short_liq_price = estimate_liquidation_price(current_price, leverage, is_long=False)

        clusters.append({
            "price": short_liq_price,
            "intensity": round(intensity, 2),
            "leverage": leverage,
            "type": "short",
            "estimated_volume": None
        })

    # Sort by price
    clusters.sort(key=lambda x: x["price"])

    return clusters


def process_liquidations(current_price: float, orderbook_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Process and return all liquidation data

    Args:
        current_price: Current market price
        orderbook_data: Optional orderbook data for enhanced estimation

    Returns:
        Complete liquidation analysis
    """
    heatmap = generate_liquidation_heatmap(current_price)
    clusters = calculate_liquidation_clusters(current_price, orderbook_data or {})

    return {
        "timestamp": int(current_price * 1000),  # Placeholder timestamp
        "current_price": current_price,
        "heatmap": heatmap,
        "clusters": clusters,
        "nearest_long_liquidation": heatmap["long_liquidations"][0] if heatmap["long_liquidations"] else None,
        "nearest_short_liquidation": heatmap["short_liquidations"][0] if heatmap["short_liquidations"] else None
    }
