import React, { useState, useEffect, useRef, useMemo } from 'react';
import Box from '@mui/material/Box';

/**
 * Componente di virtual scrolling ottimizzato per liste grandi
 * 
 * Props:
 * - items: array degli elementi da renderizzare
 * - itemHeight: altezza fissa di ogni elemento (in px)
 * - containerHeight: altezza del container (default: 400px)
 * - renderItem: funzione per renderizzare ogni elemento (item, index) => ReactElement
 * - overscan: numero di elementi extra da renderizzare fuori dalla vista (default: 5)
 * - className: classe CSS per il container
 */
function VirtualScrollList({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  ...props
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calcola quali elementi sono visibili
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Gestisce lo scroll
  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Calcola l'altezza totale della lista
  const totalHeight = items.length * itemHeight;

  // Genera gli elementi visibili
  const visibleItems = [];
  for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
    if (i < items.length) {
      visibleItems.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight
      });
    }
  }

  return (
    <Box
      ref={containerRef}
      className={className}
      onScroll={handleScroll}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        ...props.sx
      }}
      {...props}
    >
      {/* Container di altezza totale per mantenere la scrollbar corretta */}
      <Box
        sx={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {/* Elementi visibili posizionati assolutamente */}
        {visibleItems.map(({ index, item, offsetTop }) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default VirtualScrollList;
