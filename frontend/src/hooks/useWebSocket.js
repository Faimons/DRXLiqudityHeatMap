/**
 * WebSocket connection hook
 * Handles connection to backend WebSocket server
 */
import { useEffect, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { WS_URL } from '../utils/constants';

const useWebSocket = () => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const initialReconnectDelay = 1000;

  const {
    setConnectionState,
    setOrderbook,
    setWalls,
    setRecentTrades,
    setFootprint,
    setLiquidations,
  } = useStore();

  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'orderbook':
        case 'initial_snapshot':
          if (message.data) {
            setOrderbook(message.data);
            if (message.data.walls) {
              setWalls(message.data.walls, message.wall_changes);
            }
          }
          break;

        case 'trade':
          // Individual trade update
          break;

        case 'footprint':
          if (message.data) {
            setFootprint(message.data);
          }
          break;

        case 'liquidations':
          if (message.data) {
            setLiquidations(message.data);
          }
          break;

        case 'candle':
          // Real-time candle update
          // TODO: Update chart with new candle
          break;

        case 'pong':
          // Heartbeat response
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [setOrderbook, setWalls, setFootprint, setLiquidations]);

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState(true);
        reconnectAttempts.current = 0;

        // Request initial snapshot
        wsRef.current.send(JSON.stringify({ type: 'request_snapshot' }));

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        wsRef.current.heartbeatInterval = heartbeatInterval;
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(false, 'Connection error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState(false, 'Disconnected');

        // Clear heartbeat interval
        if (wsRef.current?.heartbeatInterval) {
          clearInterval(wsRef.current.heartbeatInterval);
        }

        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = initialReconnectDelay * Math.pow(2, reconnectAttempts.current);
          console.log(`Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        } else {
          setConnectionState(false, 'Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionState(false, error.message);
    }
  }, [handleMessage, setConnectionState]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ws: wsRef.current,
    reconnect: connect,
    disconnect,
  };
};

export default useWebSocket;
