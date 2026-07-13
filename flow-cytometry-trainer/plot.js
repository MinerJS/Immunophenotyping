/**
 * plot.js
 * HTML5 Canvas Scatter Plot & Gating Engine.
 * Handles rendering, coordinates, and interactive gate drawing.
 */

class FlowPlot {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Canvas sizing
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.padding = { top: 30, right: 30, bottom: 50, left: 60 };
    
    // Plot configuration
    this.xAxis = 'CD45';
    this.yAxis = 'SSC_A';
    this.scaleType = 'log'; // 'linear' or 'log'
    
    // Data and Filtering
    this.events = [];         // All events for the case
    this.filteredEvents = []; // Events that passed the parent gate
    this.gates = [];          // User gates: [{ id, name, type: 'rect'|'poly', xAttr, yAttr, color, points: [...] }]
    
    // Gating drawing state
    this.activeTool = null;   // 'rect', 'poly', or 'zoom'
    this.drawPoints = [];     // Temporary points while drawing
    this.isDrawing = false;
    this.currentMousePos = { x: 0, y: 0 };
    this.guidanceGate = null; // Guidance overlay gate for tutorial
    this.selectedGateId = null; // Selected gate ID on the canvas
    
    // Zoom range
    this.zoomX = [0, 1000];
    this.zoomY = [0, 1000];
    
    // Zoom dragging state
    this.isZooming = false;
    this.zoomStart = null;
    this.zoomEnd = null;
    
    // Hover state
    this.hoveredCell = null;
    
    // Color mapping based on precedence (standard clinical flow gating colors)
    this.colorPrecedence = [
      { name: 'CD19+ B Cells', color: '#ff9800' }, // orange
      { name: 'CD3+ T Cells', color: '#00e5ff' },  // aqua
      { name: 'NK Cells', color: '#ff2a2a' },      // red
      { name: 'Monocytes', color: '#4caf50' },     // green
      { name: 'Granulocytes', color: '#2196f3' },  // blue
      { name: 'Blasts / CD45dim', color: '#9c27b0' }, // purple / CD45dim
      { name: 'Singlets', color: '#795548' },      // brown
      { name: 'Cells', color: '#607d8b' }          // grey
    ];

    this.initEvents();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    
    // Window-level mouseup finishes drag zoom
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDrawing) {
        this.cancelDrawing();
      }
      if (e.key === 'Escape' && this.isZooming) {
        this.cancelZooming();
      }
    });
  }

  // Set the current data
  setData(events, filteredEvents, gates) {
    this.events = events;
    this.filteredEvents = filteredEvents;
    this.gates = gates;
    this.draw();
  }

  setAxes(x, y) {
    this.xAxis = x;
    this.yAxis = y;
    this.cancelDrawing();
    this.draw();
  }

  setTool(tool) {
    this.activeTool = tool;
    this.cancelDrawing();
    this.draw();
  }

  cancelDrawing() {
    this.isDrawing = false;
    this.drawPoints = [];
    document.dispatchEvent(new CustomEvent('flow-draw-cancelled'));
  }

  // Convert flow data space (0-1000) to canvas pixel coordinates
  toPixelX(val) {
    const plotWidth = this.width - this.padding.left - this.padding.right;
    let fraction = 0;
    const xMin = this.zoomX ? this.zoomX[0] : 0;
    const xMax = this.zoomX ? this.zoomX[1] : 1000;
    
    if (this.scaleType === 'log' && !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(this.xAxis)) {
      const logMin = Math.log10(Math.max(1, xMin));
      const logMax = Math.log10(Math.max(1, xMax));
      const adjustedVal = Math.max(1, val);
      const logVal = Math.log10(adjustedVal);
      const denom = logMax - logMin;
      fraction = denom === 0 ? 0 : (logVal - logMin) / denom;
    } else {
      const denom = xMax - xMin;
      fraction = denom === 0 ? 0 : (val - xMin) / denom;
    }
    
    return this.padding.left + fraction * plotWidth;
  }

  toPixelY(val) {
    const plotHeight = this.height - this.padding.top - this.padding.bottom;
    let fraction = 0;
    const yMin = this.zoomY ? this.zoomY[0] : 0;
    const yMax = this.zoomY ? this.zoomY[1] : 1000;
    
    if (this.scaleType === 'log' && !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(this.yAxis)) {
      const logMin = Math.log10(Math.max(1, yMin));
      const logMax = Math.log10(Math.max(1, yMax));
      const adjustedVal = Math.max(1, val);
      const logVal = Math.log10(adjustedVal);
      const denom = logMax - logMin;
      fraction = denom === 0 ? 0 : (logVal - logMin) / denom;
    } else {
      const denom = yMax - yMin;
      fraction = denom === 0 ? 0 : (val - yMin) / denom;
    }
    
    // Invert Y axis for screen space
    return this.height - this.padding.bottom - fraction * plotHeight;
  }

  // Convert canvas pixel coordinates to flow data space (0-1000)
  toDataX(pixelX) {
    const plotWidth = this.width - this.padding.left - this.padding.right;
    const fraction = (pixelX - this.padding.left) / plotWidth;
    const xMin = this.zoomX ? this.zoomX[0] : 0;
    const xMax = this.zoomX ? this.zoomX[1] : 1000;
    
    if (this.scaleType === 'log' && !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(this.xAxis)) {
      const logMin = Math.log10(Math.max(1, xMin));
      const logMax = Math.log10(Math.max(1, xMax));
      return Math.pow(10, logMin + fraction * (logMax - logMin));
    } else {
      return xMin + fraction * (xMax - xMin);
    }
  }

  toDataY(pixelY) {
    const plotHeight = this.height - this.padding.top - this.padding.bottom;
    // Invert back
    const fraction = (this.height - this.padding.bottom - pixelY) / plotHeight;
    const yMin = this.zoomY ? this.zoomY[0] : 0;
    const yMax = this.zoomY ? this.zoomY[1] : 1000;
    
    if (this.scaleType === 'log' && !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(this.yAxis)) {
      const logMin = Math.log10(Math.max(1, yMin));
      const logMax = Math.log10(Math.max(1, yMax));
      return Math.pow(10, logMin + fraction * (logMax - logMin));
    } else {
      return yMin + fraction * (yMax - yMin);
    }
  }

  // Get mouse position relative to canvas
  getMouseCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.width / rect.width);
    const y = (e.clientY - rect.top) * (this.height / rect.height);
    return { x, y };
  }

  handleMouseDown(e) {
    const mouse = this.getMouseCoords(e);
    // Ignore clicks outside the plotting area
    if (mouse.x < this.padding.left || mouse.x > this.width - this.padding.right ||
        mouse.y < this.padding.top || mouse.y > this.height - this.padding.bottom) {
      return;
    }
    
    const dataPt = {
      x: this.toDataX(mouse.x),
      y: this.toDataY(mouse.y)
    };

    if (this.activeTool === 'zoom') {
      this.isZooming = true;
      this.zoomStart = { x: mouse.x, y: mouse.y };
      this.zoomEnd = { x: mouse.x, y: mouse.y };
      return;
    }

    if (!this.activeTool) {
      // Check if click is inside an existing gate on the current axes
      const activeGatesOnAxes = this.gates.filter(g => g.xAttr === this.xAxis && g.yAttr === this.yAxis);
      let clickedGate = null;
      
      // Loop backwards to check top-most gates first (e.g. child gates drawn inside parent gates)
      for (let i = activeGatesOnAxes.length - 1; i >= 0; i--) {
        const gate = activeGatesOnAxes[i];
        if (this.isPointInGate(dataPt, gate)) {
          clickedGate = gate;
          break;
        }
      }
      
      if (clickedGate) {
        this.selectedGateId = clickedGate.id;
        const highlightEvent = new CustomEvent('flow-gate-highlighted', {
          detail: { gateId: clickedGate.id }
        });
        document.dispatchEvent(highlightEvent);
      } else {
        this.selectedGateId = null;
        const highlightEvent = new CustomEvent('flow-gate-highlighted', {
          detail: { gateId: null }
        });
        document.dispatchEvent(highlightEvent);
      }
      
      this.draw();
      return;
    }

    if (this.activeTool === 'rect') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.drawPoints = [dataPt];
      } else {
        // Double-click or click again finishes the rectangle
        this.drawPoints.push(dataPt);
        this.finishGating();
      }
    } 
    else if (this.activeTool === 'poly') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.drawPoints = [dataPt];
      } else {
        // Check if close to the first point (closes the polygon)
        const firstPtPx = {
          x: this.toPixelX(this.drawPoints[0].x),
          y: this.toPixelY(this.drawPoints[0].y)
        };
        const dist = Math.hypot(mouse.x - firstPtPx.x, mouse.y - firstPtPx.y);
        
        if (dist < 12 && this.drawPoints.length >= 3) {
          // Close polygon
          this.finishGating();
        } else {
          // Add new point
          this.drawPoints.push(dataPt);
          this.draw();
        }
      }
    }
  }

  handleDoubleClick(e) {
    if (this.activeTool) return;
    
    const mouse = this.getMouseCoords(e);
    // Ignore clicks outside the plotting area
    if (mouse.x < this.padding.left || mouse.x > this.width - this.padding.right ||
        mouse.y < this.padding.top || mouse.y > this.height - this.padding.bottom) {
      return;
    }
    
    const dataPt = {
      x: this.toDataX(mouse.x),
      y: this.toDataY(mouse.y)
    };
    
    const activeGatesOnAxes = this.gates.filter(g => g.xAttr === this.xAxis && g.yAttr === this.yAxis);
    for (let i = activeGatesOnAxes.length - 1; i >= 0; i--) {
      const gate = activeGatesOnAxes[i];
      if (this.isPointInGate(dataPt, gate)) {
        // Trigger double-click to drill down into gate tree
        const selEvent = new CustomEvent('flow-gate-selected', {
          detail: { gateId: gate.id }
        });
        document.dispatchEvent(selEvent);
        break;
      }
    }
  }

  handleMouseMove(e) {
    const mouse = this.getMouseCoords(e);
    this.currentMousePos = mouse;
    
    if (this.isZooming) {
      const xMinPx = this.padding.left;
      const xMaxPx = this.width - this.padding.right;
      const yMinPx = this.padding.top;
      const yMaxPx = this.height - this.padding.bottom;
      
      this.zoomEnd = {
        x: Math.max(xMinPx, Math.min(xMaxPx, mouse.x)),
        y: Math.max(yMinPx, Math.min(yMaxPx, mouse.y))
      };
      this.draw();
      return;
    }
    
    if (this.isDrawing) {
      this.draw();
      return;
    }

    // Hover inspect functionality
    if (this.activeTool === 'zoom' || !this.activeTool) {
      const isInsidePlot = (mouse.x >= this.padding.left && mouse.x <= this.width - this.padding.right &&
                            mouse.y >= this.padding.top && mouse.y <= this.height - this.padding.bottom);
      if (isInsidePlot) {
        const closest = this.findClosestCell(mouse);
        if (closest) {
          this.hoveredCell = closest;
          this.canvas.style.cursor = 'pointer';
        } else {
          this.hoveredCell = null;
          this.canvas.style.cursor = 'default';
        }
        this.draw();
      } else if (this.hoveredCell) {
        this.hoveredCell = null;
        this.canvas.style.cursor = 'default';
        this.draw();
      }
    }
  }

  finishGating() {
    this.isDrawing = false;
    let gatePoints = [...this.drawPoints];
    this.drawPoints = [];
    
    if (this.activeTool === 'rect' && gatePoints.length === 2) {
      // Re-order points to get top-left and bottom-right
      const xMin = Math.min(gatePoints[0].x, gatePoints[1].x);
      const xMax = Math.max(gatePoints[0].x, gatePoints[1].x);
      const yMin = Math.min(gatePoints[0].y, gatePoints[1].y);
      const yMax = Math.max(gatePoints[0].y, gatePoints[1].y);
      gatePoints = [
        { x: xMin, y: yMin },
        { x: xMax, y: yMax }
      ];
    }
    
    // Dispatch event to app to prompt for gate name
    const gateEvent = new CustomEvent('flow-gate-created', {
      detail: {
        type: this.activeTool,
        xAttr: this.xAxis,
        yAttr: this.yAxis,
        points: gatePoints
      }
    });
    document.dispatchEvent(gateEvent);
    this.activeTool = null;
  }

  // Draw plot
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw background grid & axes
    this.drawGrid();
    
    // Draw cells
    this.drawCells();
    
    // Draw established gates for the CURRENT active axes
    this.drawGates();
    
    // Draw actively drawing gate
    this.drawActiveGateDrawing();
    
    // Draw active zoom selection dashed box
    this.drawActiveZoomBox();
    
    // Draw cell highlight ring & HUD tooltip
    this.drawHoveredCellHighlight();
  }

  drawGrid() {
    const plotWidth = this.width - this.padding.left - this.padding.right;
    const plotHeight = this.height - this.padding.top - this.padding.bottom;
    
    // Draw plot background card
    this.ctx.fillStyle = '#0f172a'; // Deep dark slate
    this.ctx.fillRect(this.padding.left, this.padding.top, plotWidth, plotHeight);
    
    // Draw grid border
    this.ctx.strokeStyle = '#334155'; // Medium slate
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(this.padding.left, this.padding.top, plotWidth, plotHeight);
    
    // Draw grid lines and labels
    this.ctx.fillStyle = '#94a3b8'; // Light slate
    this.ctx.font = '11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    const xMin = this.zoomX ? this.zoomX[0] : 0;
    const xMax = this.zoomX ? this.zoomX[1] : 1000;
    const xRange = xMax - xMin;
    
    const yMin = this.zoomY ? this.zoomY[0] : 0;
    const yMax = this.zoomY ? this.zoomY[1] : 1000;
    const yRange = yMax - yMin;

    const getStepSize = (range) => {
      if (range < 50) return 10;
      if (range < 150) return 20;
      if (range < 300) return 50;
      if (range < 600) return 100;
      return 200;
    };

    const formatLogLabel = (val) => {
      if (val === 1) return '10⁰';
      if (val === 10) return '10¹';
      if (val === 100) return '10²';
      if (val === 1000) return '10³';
      return Math.round(val).toString();
    };
    
    // --- X Axis Ticks & Grid ---
    if (this.scaleType === 'log' && !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(this.xAxis)) {
      const decades = [1, 10, 100, 1000];
      const visibleDecades = decades.filter(d => d >= xMin && d <= xMax);
      if (visibleDecades.length >= 2 && xRange > 300) {
        visibleDecades.forEach(val => {
          const xPx = this.toPixelX(val);
          
          this.ctx.strokeStyle = '#1e293b';
          this.ctx.beginPath();
          this.ctx.moveTo(xPx, this.padding.top);
          this.ctx.lineTo(xPx, this.height - this.padding.bottom);
          this.ctx.stroke();
          
          this.ctx.strokeStyle = '#475569';
          this.ctx.beginPath();
          this.ctx.moveTo(xPx, this.height - this.padding.bottom);
          this.ctx.lineTo(xPx, this.height - this.padding.bottom + 6);
          this.ctx.stroke();
          
          this.ctx.fillText(formatLogLabel(val), xPx, this.height - this.padding.bottom + 10);
        });
      } else {
        const step = getStepSize(xRange);
        const startVal = Math.ceil(xMin / step) * step;
        for (let val = startVal; val <= xMax; val += step) {
          if (val < xMin || val > xMax) continue;
          const xPx = this.toPixelX(val);
          
          this.ctx.strokeStyle = '#1e293b';
          this.ctx.beginPath();
          this.ctx.moveTo(xPx, this.padding.top);
          this.ctx.lineTo(xPx, this.height - this.padding.bottom);
          this.ctx.stroke();
          
          this.ctx.strokeStyle = '#475569';
          this.ctx.beginPath();
          this.ctx.moveTo(xPx, this.height - this.padding.bottom);
          this.ctx.lineTo(xPx, this.height - this.padding.bottom + 6);
          this.ctx.stroke();
          
          this.ctx.fillText(formatLogLabel(val), xPx, this.height - this.padding.bottom + 10);
        }
      }
    } else {
      const step = getStepSize(xRange);
      const startVal = Math.ceil(xMin / step) * step;
      for (let val = startVal; val <= xMax; val += step) {
        if (val < xMin || val > xMax) continue;
        const xPx = this.toPixelX(val);
        
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.moveTo(xPx, this.padding.top);
        this.ctx.lineTo(xPx, this.height - this.padding.bottom);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#475569';
        this.ctx.beginPath();
        this.ctx.moveTo(xPx, this.height - this.padding.bottom);
        this.ctx.lineTo(xPx, this.height - this.padding.bottom + 6);
        this.ctx.stroke();
        
        let label = Math.round(val).toString();
        if (['FSC_A', 'FSC_H', 'SSC_A'].includes(this.xAxis)) {
          label = Math.round(val * 250).toLocaleString();
        }
        this.ctx.fillText(label, xPx, this.height - this.padding.bottom + 10);
      }
    }
    
    // --- Y Axis Ticks & Grid ---
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    if (this.scaleType === 'log' && !['FSC_A', 'FSC_H', 'SSC_A', 'Time'].includes(this.yAxis)) {
      const decades = [1, 10, 100, 1000];
      const visibleDecades = decades.filter(d => d >= yMin && d <= yMax);
      if (visibleDecades.length >= 2 && yRange > 300) {
        visibleDecades.forEach(val => {
          const yPx = this.toPixelY(val);
          
          this.ctx.strokeStyle = '#1e293b';
          this.ctx.beginPath();
          this.ctx.moveTo(this.padding.left, yPx);
          this.ctx.lineTo(this.width - this.padding.right, yPx);
          this.ctx.stroke();
          
          this.ctx.strokeStyle = '#475569';
          this.ctx.beginPath();
          this.ctx.moveTo(this.padding.left, yPx);
          this.ctx.lineTo(this.padding.left - 6, yPx);
          this.ctx.stroke();
          
          this.ctx.fillText(formatLogLabel(val), this.padding.left - 10, yPx);
        });
      } else {
        const step = getStepSize(yRange);
        const startVal = Math.ceil(yMin / step) * step;
        for (let val = startVal; val <= yMax; val += step) {
          if (val < yMin || val > yMax) continue;
          const yPx = this.toPixelY(val);
          
          this.ctx.strokeStyle = '#1e293b';
          this.ctx.beginPath();
          this.ctx.moveTo(this.padding.left, yPx);
          this.ctx.lineTo(this.width - this.padding.right, yPx);
          this.ctx.stroke();
          
          this.ctx.strokeStyle = '#475569';
          this.ctx.beginPath();
          this.ctx.moveTo(this.padding.left, yPx);
          this.ctx.lineTo(this.padding.left - 6, yPx);
          this.ctx.stroke();
          
          this.ctx.fillText(formatLogLabel(val), this.padding.left - 10, yPx);
        }
      }
    } else {
      const step = getStepSize(yRange);
      const startVal = Math.ceil(yMin / step) * step;
      for (let val = startVal; val <= yMax; val += step) {
        if (val < yMin || val > yMax) continue;
        const yPx = this.toPixelY(val);
        
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, yPx);
        this.ctx.lineTo(this.width - this.padding.right, yPx);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#475569';
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, yPx);
        this.ctx.lineTo(this.padding.left - 6, yPx);
        this.ctx.stroke();
        
        let label = Math.round(val).toString();
        if (['FSC_A', 'FSC_H', 'SSC_A'].includes(this.yAxis)) {
          label = Math.round(val * 250).toLocaleString();
        }
        this.ctx.fillText(label, this.padding.left - 10, yPx);
      }
    }
    
    // Draw Axis Labels
    this.ctx.fillStyle = '#f8fafc'; // Off-white
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    
    // X Axis Label
    this.ctx.fillText(this.xAxis, this.padding.left + plotWidth / 2, this.height - 12);
    
    // Y Axis Label (rotated)
    this.ctx.save();
    this.ctx.translate(15, this.padding.top + plotHeight / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillText(this.yAxis, 0, 0);
    this.ctx.restore();
  }

  // Point containment logic
  isPointInGate(event, gate) {
    const px = event[gate.xAttr] !== undefined ? event[gate.xAttr] : event.x;
    const py = event[gate.yAttr] !== undefined ? event[gate.yAttr] : event.y;
    
    if (gate.type === 'rect') {
      const p1 = gate.points[0];
      const p2 = gate.points[1];
      return px >= p1.x && px <= p2.x && py >= p1.y && py <= p2.y;
    } 
    else if (gate.type === 'poly') {
      // Ray-casting / PNPOLY
      let x = px, y = py;
      let inside = false;
      const vs = gate.points;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    return false;
  }

  // Get the depth of a gate recursively in the hierarchy
  getGateDepth(gateId) {
    if (gateId === 'root' || !gateId) return 0;
    const gate = this.gates.find(g => g.id === gateId);
    if (!gate) return 0;
    return 1 + this.getGateDepth(gate.parent);
  }

  // Check if a cell is inside a gate geometrically
  isCellInGate(cell, gate) {
    if (!gate) return false;
    return this.isPointInGate(cell, gate);
  }

  // Get the display color of an event based on dynamic gating hierarchy
  getEventColor(event) {
    let bestGate = null;
    let maxDepth = -1;
    
    // Find the deepest gate in the hierarchy that contains the cell
    this.gates.forEach(gate => {
      if (gate.id !== 'root' && this.isCellInGate(event, gate)) {
        const depth = this.getGateDepth(gate.id);
        if (depth > maxDepth) {
          maxDepth = depth;
          bestGate = gate;
        }
      }
    });
    
    if (bestGate) {
      return bestGate.color;
    }
    
    // Default color if it doesn't fall into any gate (except root)
    return 'rgba(148, 163, 184, 0.4)';
  }

  drawCells() {
    const list = this.filteredEvents;
    const len = list.length;
    
    this.ctx.save();
    // Clip drawing area to plotting card only
    const plotWidth = this.width - this.padding.left - this.padding.right;
    const plotHeight = this.height - this.padding.top - this.padding.bottom;
    this.ctx.beginPath();
    this.ctx.rect(this.padding.left, this.padding.top, plotWidth, plotHeight);
    this.ctx.clip();
    
    const xMin = this.zoomX ? this.zoomX[0] : 0;
    const xMax = this.zoomX ? this.zoomX[1] : 1000;
    const yMin = this.zoomY ? this.zoomY[0] : 0;
    const yMax = this.zoomY ? this.zoomY[1] : 1000;
    const xRange = xMax - xMin;
    
    // Determine dynamic dot size
    const dotSize = xRange < 150 ? 3.5 : (xRange < 350 ? 2.5 : 1.5);
    const halfSize = dotSize / 2;
    
    const colorGroups = {};
    
    for (let i = 0; i < len; i++) {
      const cell = list[i];
      const cx = cell[this.xAxis];
      const cy = cell[this.yAxis];
      
      if (cx === undefined || cy === undefined) continue;
      
      // Skip drawing cells that lie outside the zoomed viewport to optimize performance
      if (cx < xMin || cx > xMax || cy < yMin || cy > yMax) continue;
      
      const px = this.toPixelX(cx);
      const py = this.toPixelY(cy);
      const col = this.getEventColor(cell);
      
      if (!colorGroups[col]) {
        colorGroups[col] = [];
      }
      colorGroups[col].push({ x: px, y: py });
    }
    
    // Draw each color group
    for (const [color, pts] of Object.entries(colorGroups)) {
      this.ctx.fillStyle = color;
      const ptsLen = pts.length;
      for (let j = 0; j < ptsLen; j++) {
        const pt = pts[j];
        this.ctx.fillRect(pt.x - halfSize, pt.y - halfSize, dotSize, dotSize);
      }
    }
    
    this.ctx.restore();
  }

  // Draw current established gates
  drawGates() {
    const activeGates = this.gates.filter(g => g.xAttr === this.xAxis && g.yAttr === this.yAxis);
    
    activeGates.forEach(gate => {
      this.ctx.save();
      
      let strokeColor, fillColor, fillAlpha;
      if (gate.id === this.selectedGateId) {
        strokeColor = '#f43f5e'; // Bright rose border for selected gate
        this.ctx.lineWidth = 3;
        fillColor = '#f43f5e';
        fillAlpha = 0.15;
      } else {
        strokeColor = gate.color || '#e2e8f0';
        this.ctx.lineWidth = 2;
        fillColor = gate.color || '#e2e8f0';
        fillAlpha = 0.12; // 12% opacity fill
      }
      
      this.ctx.beginPath();
      if (gate.type === 'rect') {
        const p1 = gate.points[0];
        const p2 = gate.points[1];
        
        const x1 = this.toPixelX(p1.x);
        const y1 = this.toPixelY(p1.y);
        const x2 = this.toPixelX(p2.x);
        const y2 = this.toPixelY(p2.y);
        
        this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
      } 
      else if (gate.type === 'poly' && gate.points.length >= 3) {
        const start = gate.points[0];
        this.ctx.moveTo(this.toPixelX(start.x), this.toPixelY(start.y));
        for (let i = 1; i < gate.points.length; i++) {
          const pt = gate.points[i];
          this.ctx.lineTo(this.toPixelX(pt.x), this.toPixelY(pt.y));
        }
        this.ctx.closePath();
      }
      
      // Fill the path using globalAlpha for native opacity
      this.ctx.globalAlpha = fillAlpha;
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      
      // Stroke the path using full opacity
      this.ctx.globalAlpha = 1.0;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
      
      // Draw the text tag
      this.ctx.fillStyle = strokeColor;
      this.ctx.font = 'bold 11px sans-serif';
      if (gate.type === 'rect') {
        const p1 = gate.points[0];
        const x1 = this.toPixelX(p1.x);
        const y1 = this.toPixelY(p1.y);
        this.ctx.fillText(gate.name, x1 + 5, y1 + 15);
      } else if (gate.type === 'poly' && gate.points.length >= 3) {
        const centroid = gate.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        centroid.x /= gate.points.length;
        centroid.y /= gate.points.length;
        this.ctx.fillText(gate.name, this.toPixelX(centroid.x), this.toPixelY(centroid.y));
      }
      
      this.ctx.restore();
    });

    // Draw guidance gate if active and axis markers match
    if (this.guidanceGate && this.guidanceGate.xAttr === this.xAxis && this.guidanceGate.yAttr === this.yAxis) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)'; // Semi-transparent green
      this.ctx.lineWidth = 2.5;
      this.ctx.setLineDash([6, 4]); // Dashed line
      this.ctx.fillStyle = 'rgba(76, 175, 80, 0.08)'; // 8% green fill
      
      if (this.guidanceGate.type === 'rect') {
        const p1 = this.guidanceGate.points[0];
        const p2 = this.guidanceGate.points[1];
        
        const x1 = this.toPixelX(p1.x);
        const y1 = this.toPixelY(p1.y);
        const x2 = this.toPixelX(p2.x);
        const y2 = this.toPixelY(p2.y);
        
        this.ctx.beginPath();
        this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#4caf50';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Target Area Guide', x1 + 5, y1 + 15);
      } 
      else if (this.guidanceGate.type === 'poly' && this.guidanceGate.points.length >= 3) {
        this.ctx.beginPath();
        const start = this.guidanceGate.points[0];
        this.ctx.moveTo(this.toPixelX(start.x), this.toPixelY(start.y));
        for (let i = 1; i < this.guidanceGate.points.length; i++) {
          const pt = this.guidanceGate.points[i];
          this.ctx.lineTo(this.toPixelX(pt.x), this.toPixelY(pt.y));
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        const centroid = this.guidanceGate.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        centroid.x /= this.guidanceGate.points.length;
        centroid.y /= this.guidanceGate.points.length;
        this.ctx.fillStyle = '#4caf50';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText('Target Area Guide', this.toPixelX(centroid.x) - 40, this.toPixelY(centroid.y));
      }
      this.ctx.restore();
    }
  }

  // Draw the active shape currently being dragged or constructed by user
  drawActiveGateDrawing() {
    if (!this.isDrawing || this.drawPoints.length === 0) return;
    
    this.ctx.strokeStyle = '#38bdf8'; // Active drawing border color (sky-400)
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]); // dashed lines for drawing
    
    if (this.activeTool === 'rect') {
      const p1 = this.drawPoints[0];
      const x1 = this.toPixelX(p1.x);
      const y1 = this.toPixelY(p1.y);
      const x2 = this.currentMousePos.x;
      const y2 = this.currentMousePos.y;
      
      this.ctx.beginPath();
      this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
      this.ctx.stroke();
    } 
    else if (this.activeTool === 'poly') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.toPixelX(this.drawPoints[0].x), this.toPixelY(this.drawPoints[0].y));
      for (let i = 1; i < this.drawPoints.length; i++) {
        const pt = this.drawPoints[i];
        this.ctx.lineTo(this.toPixelX(pt.x), this.toPixelY(pt.y));
      }
      // Line to mouse pointer
      this.ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y);
      this.ctx.stroke();
      
      // Highlight initial point to show closing target
      const firstPtPx = {
        x: this.toPixelX(this.drawPoints[0].x),
        y: this.toPixelY(this.drawPoints[0].y)
      };
      const dist = Math.hypot(this.currentMousePos.x - firstPtPx.x, this.currentMousePos.y - firstPtPx.y);
      
      this.ctx.fillStyle = dist < 12 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(56, 189, 248, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(firstPtPx.x, firstPtPx.y, 6, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]); // Reset line dash
  }

  cancelZooming() {
    this.isZooming = false;
    this.zoomStart = null;
    this.zoomEnd = null;
    this.draw();
  }

  handleMouseUp(e) {
    if (!this.isZooming) return;
    this.isZooming = false;
    
    const dragDist = Math.hypot(this.zoomEnd.x - this.zoomStart.x, this.zoomEnd.y - this.zoomStart.y);
    
    if (dragDist > 15) {
      // Zoom in to the dragged box
      const dataX1 = this.toDataX(this.zoomStart.x);
      const dataX2 = this.toDataX(this.zoomEnd.x);
      const dataY1 = this.toDataY(this.zoomStart.y);
      const dataY2 = this.toDataY(this.zoomEnd.y);
      
      const minX = Math.min(dataX1, dataX2);
      const maxX = Math.max(dataX1, dataX2);
      const minY = Math.min(dataY1, dataY2);
      const maxY = Math.max(dataY1, dataY2);
      
      const zoomEvent = new CustomEvent('flow-zoom-changed', {
        detail: {
          zoomX: [minX, maxX],
          zoomY: [minY, maxY]
        }
      });
      document.dispatchEvent(zoomEvent);
    } else {
      // Click event - inspect closest cell
      const mouse = this.zoomStart;
      const cell = this.findClosestCell(mouse);
      if (cell) {
        const cellClickEvent = new CustomEvent('flow-cell-clicked', {
          detail: { cell }
        });
        document.dispatchEvent(cellClickEvent);
      }
    }
    
    this.zoomStart = null;
    this.zoomEnd = null;
    this.draw();
  }

  findClosestCell(mousePx) {
    let closest = null;
    let minDist = 12; // 12px threshold
    const len = this.filteredEvents.length;
    
    for (let i = 0; i < len; i++) {
      const cell = this.filteredEvents[i];
      const cx = cell[this.xAxis];
      const cy = cell[this.yAxis];
      if (cx === undefined || cy === undefined) continue;
      
      const px = this.toPixelX(cx);
      const py = this.toPixelY(cy);
      
      const dist = Math.hypot(mousePx.x - px, mousePx.y - py);
      if (dist < minDist) {
        minDist = dist;
        closest = cell;
      }
    }
    return closest;
  }

  drawActiveZoomBox() {
    if (!this.isZooming || !this.zoomStart || !this.zoomEnd) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = '#38bdf8'; // Cyan
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    
    const x = this.zoomStart.x;
    const y = this.zoomStart.y;
    const w = this.zoomEnd.x - this.zoomStart.x;
    const h = this.zoomEnd.y - this.zoomStart.y;
    
    this.ctx.fillRect(x, y, w, h);
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.restore();
  }

  drawHoveredCellHighlight() {
    if (!this.hoveredCell) return;
    
    const cx = this.hoveredCell[this.xAxis];
    const cy = this.hoveredCell[this.yAxis];
    if (cx === undefined || cy === undefined) return;
    
    const px = this.toPixelX(cx);
    const py = this.toPixelY(cy);
    
    this.ctx.save();
    
    // Outer circle
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(px, py, 6, 0, 2 * Math.PI);
    this.ctx.stroke();
    
    // Inner dot
    this.ctx.fillStyle = this.getEventColor(this.hoveredCell);
    this.ctx.beginPath();
    this.ctx.arc(px, py, 3, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Tooltip Card
    const boxW = 160;
    const boxH = 75;
    
    let tx = px + 10;
    let ty = py - boxH - 10;
    if (tx + boxW > this.width - this.padding.right) {
      tx = px - boxW - 10;
    }
    if (ty < this.padding.top) {
      ty = py + 10;
    }
    
    this.ctx.fillStyle = 'rgba(11, 19, 41, 0.9)';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    if (typeof this.ctx.roundRect === 'function') {
      this.ctx.roundRect(tx, ty, boxW, boxH, 6);
    } else {
      this.ctx.rect(tx, ty, boxW, boxH);
    }
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    const rawType = this.hoveredCell.type || 'Cell';
    let cleanType = rawType.replace('_', ' ');
    if (cleanType === 'BCell') cleanType = 'B Cell';
    if (cleanType === 'NKCell') cleanType = 'NK Cell';
    
    this.ctx.fillText(cleanType, tx + 8, ty + 8);
    
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '10px sans-serif';
    
    let xVal = Math.round(cx);
    if (['FSC_A', 'FSC_H', 'SSC_A'].includes(this.xAxis)) {
      xVal = Math.round(xVal * 250).toLocaleString();
    }
    let yVal = Math.round(cy);
    if (['FSC_A', 'FSC_H', 'SSC_A'].includes(this.yAxis)) {
      yVal = Math.round(yVal * 250).toLocaleString();
    }
    
    this.ctx.fillText(`${this.xAxis}: ${xVal}`, tx + 8, ty + 26);
    this.ctx.fillText(`${this.yAxis}: ${yVal}`, tx + 8, ty + 40);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = 'italic 9px sans-serif';
    this.ctx.fillText('Click to Inspect Cell 3D', tx + 8, ty + 56);
    
    this.ctx.restore();
  }
}

// Export for browser/Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowPlot;
} else {
  window.FlowPlot = FlowPlot;
}
