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
    
    // Adjust padding and fonts for smaller canvas dimensions (e.g. in 3D explorer)
    if (this.width < 300) {
      this.padding = { top: 20, right: 15, bottom: 35, left: 45 };
      this.smallMode = true;
    } else {
      this.padding = { top: 30, right: 30, bottom: 50, left: 60 };
      this.smallMode = false;
    }
    
    // Plot configuration
    this.xAxis = 'CD45';
    this.yAxis = 'SSC_A';
    this.scaleType = 'log'; // 'linear' or 'log'
    
    // Data and Filtering
    this.events = [];         // All events for the case
    this.filteredEvents = []; // Events that passed the parent gate
    this.gates = [];          // User gates: [{ id, name, type: 'rect'|'poly', xAttr, yAttr, color, points: [...] }]
    this.temporaryPoints = []; // Temporary interrogated cell indicator points

    // Cached grid + point-cloud bitmap, and a token bumped whenever the event
    // list is replaced so the cache knows to rebuild.
    this.staticCanvas = null;
    this.staticCtx = null;
    this.staticKey = null;
    this.dataToken = 0;
    
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

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.draw();
  }

  // Set the current data
  setData(events, filteredEvents, gates) {
    this.events = events;
    this.filteredEvents = filteredEvents;
    this.gates = gates;
    this.dataToken++;
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

    if (this.activeTool === 'auto') {
      const candidates = this.getCandidateAutoGates();
      let clickedCand = null;
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (this.isPointInGate(dataPt, candidates[i])) {
          clickedCand = candidates[i];
          break;
        }
      }
      if (clickedCand) {
        const autoGateEvent = new CustomEvent('flow-auto-gate-clicked', {
          detail: clickedCand
        });
        document.dispatchEvent(autoGateEvent);
      }
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
    
    if (this.activeTool === 'auto') {
      const isInsidePlot = (mouse.x >= this.padding.left && mouse.x <= this.width - this.padding.right &&
                            mouse.y >= this.padding.top && mouse.y <= this.height - this.padding.bottom);
      if (isInsidePlot) {
        const mouseDataPt = {
          x: this.toDataX(mouse.x),
          y: this.toDataY(mouse.y)
        };
        const candidates = this.getCandidateAutoGates();
        const isHovered = candidates.some(cand => this.isPointInGate(mouseDataPt, cand));
        this.canvas.style.cursor = isHovered ? 'pointer' : 'default';
      } else {
        this.canvas.style.cursor = 'default';
      }
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

  // Identity of everything the grid and the point cloud depend on. When this
  // is unchanged the cached bitmap is still valid.
  staticLayerKey() {
    let gateSig = '';
    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i];
      gateSig += g.id + ':' + g.parentId + ':' + g.color + ':' + g.xAttr + ':' + g.yAttr + ':';
      const pts = g.points || [];
      for (let j = 0; j < pts.length; j++) gateSig += pts[j].x + ',' + pts[j].y + ';';
    }
    return this.xAxis + '|' + this.yAxis + '|' + this.scaleType + '|' +
      (this.zoomX ? this.zoomX[0] + ',' + this.zoomX[1] : '-') + '|' +
      (this.zoomY ? this.zoomY[0] + ',' + this.zoomY[1] : '-') + '|' +
      this.width + 'x' + this.height + '|' +
      this.dataToken + '|' + this.filteredEvents.length + '|' + gateSig;
  }

  // Grid + point cloud rendered once into an offscreen canvas and blitted
  // thereafter. Colouring 6000 events means a gate hit-test each — far too
  // expensive to repeat 60 times a second for a picture that rarely changes.
  drawStaticLayer() {
    if (!this.staticCanvas || this.staticCanvas.width !== this.width || this.staticCanvas.height !== this.height) {
      this.staticCanvas = document.createElement('canvas');
      this.staticCanvas.width = this.width;
      this.staticCanvas.height = this.height;
      this.staticCtx = this.staticCanvas.getContext('2d');
      this.staticKey = null;
    }

    const key = this.staticLayerKey();
    if (this.staticKey !== key) {
      this.staticKey = key;
      this.staticCtx.clearRect(0, 0, this.width, this.height);
      // drawGrid/drawCells render through this.ctx; point it at the cache for
      // the rebuild so neither has to know about the offscreen canvas.
      const liveCtx = this.ctx;
      this.ctx = this.staticCtx;
      try {
        this.drawGrid();
        this.drawCells();
      } finally {
        this.ctx = liveCtx;
      }
    }

    this.ctx.drawImage(this.staticCanvas, 0, 0);
  }

  // Force the cached grid/point cloud to be rebuilt on the next draw.
  invalidateStaticLayer() {
    this.staticKey = null;
  }

  // Draw plot
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background grid & axes, and the cell cloud, from the cached layer
    this.drawStaticLayer();

    // Interrogation flashes animate, so they go on top of the cache
    this.drawTemporaryPoints();

    // Draw established gates for the CURRENT active axes
    this.drawGates();
    
    // Draw candidate auto gates
    if (this.activeTool === 'auto') {
      this.drawCandidateAutoGates();
    }
    
    // Draw actively drawing gate
    this.drawActiveGateDrawing();
    
    // Draw active zoom selection dashed box
    this.drawActiveZoomBox();
    
    // Draw cell highlight ring & HUD tooltip
    this.drawHoveredCellHighlight();
    
    // Draw persistent target highlight for explorer view
    this.drawPersistentHighlight();
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
    this.ctx.font = this.smallMode ? '8px sans-serif' : '11px sans-serif';
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
        this.ctx.fillText(label, this.padding.left - (this.smallMode ? 6 : 10), yPx);
      }
    }
    
    // Draw Axis Labels
    this.ctx.fillStyle = '#f8fafc'; // Off-white
    this.ctx.font = this.smallMode ? 'bold 9.5px sans-serif' : 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    
    // X Axis Label
    this.ctx.fillText(this.xAxis, this.padding.left + plotWidth / 2, this.height - (this.smallMode ? 6 : 12));
    
    // Y Axis Label (rotated)
    this.ctx.save();
    this.ctx.translate(this.smallMode ? 10 : 15, this.padding.top + plotHeight / 2);
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

  // Interrogated-cell flashes animate frame by frame, so they are drawn live
  // on top of the cached point cloud rather than baked into it.
  drawTemporaryPoints() {
    if (!this.temporaryPoints || this.temporaryPoints.length === 0) return;

    const plotWidth = this.width - this.padding.left - this.padding.right;
    const plotHeight = this.height - this.padding.top - this.padding.bottom;
    const xMin = this.zoomX ? this.zoomX[0] : 0;
    const xMax = this.zoomX ? this.zoomX[1] : 1000;
    const yMin = this.zoomY ? this.zoomY[0] : 0;
    const yMax = this.zoomY ? this.zoomY[1] : 1000;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.padding.left, this.padding.top, plotWidth, plotHeight);
    this.ctx.clip();

    this.temporaryPoints.forEach(pt => {
      const px = this.toPixelX(pt.x);
      const py = this.toPixelY(pt.y);

      // Skip drawing if outside crop
      if (pt.x < xMin || pt.x > xMax || pt.y < yMin || pt.y > yMax) return;

      this.ctx.save();
      this.ctx.strokeStyle = pt.color;
      this.ctx.fillStyle = pt.color;
      this.ctx.globalAlpha = pt.alpha;

      // Expanding ring
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(px, py, pt.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Core dot
      this.ctx.beginPath();
      this.ctx.arc(px, py, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });

    this.ctx.restore();
  }

  addInterrogatedPoint(cellType) {
    let cx = 500;
    let cy = 500;
    
    // Approximate gating positions based on clinical panels in data.js
    if (cellType === 'CD4_TCell' || cellType === 'CD8_TCell' || cellType === 'gd_TCell' || cellType === 'BCell' || cellType === 'NKCell') {
      if (this.xAxis === 'CD45') cx = 740 + Math.random() * 50;
      else if (this.xAxis === 'FSC_A') cx = 350 + Math.random() * 60;
      else if (this.xAxis === 'CD3') cx = (cellType === 'BCell' || cellType === 'NKCell') ? 120 : 750 + Math.random() * 60;
      else if (this.xAxis === 'CD4') cx = (cellType === 'CD4_TCell') ? 700 + Math.random() * 60 : 100;
      else if (this.xAxis === 'CD8') cx = (cellType === 'CD8_TCell') ? 680 + Math.random() * 60 : 100;
      
      if (this.yAxis === 'SSC_A') cy = 180 + Math.random() * 30;
      else if (this.yAxis === 'CD19') cy = (cellType === 'BCell') ? 720 + Math.random() * 60 : 90;
      else if (this.yAxis === 'CD8') cy = (cellType === 'CD8_TCell') ? 680 + Math.random() * 60 : 100;
      else if (this.yAxis === 'CD38') cy = 200 + Math.random() * 50;
    } else if (cellType === 'Monocyte') {
      if (this.xAxis === 'CD45') cx = 780 + Math.random() * 40;
      else if (this.xAxis === 'FSC_A') cx = 650 + Math.random() * 60;
      else if (this.xAxis === 'CD3') cx = 90;
      else if (this.xAxis === 'CD14') cx = 720 + Math.random() * 60;
      
      if (this.yAxis === 'SSC_A') cy = 350 + Math.random() * 45;
      else if (this.yAxis === 'HLA_DR') cy = 600 + Math.random() * 50;
    } else if (cellType === 'Granulocyte') {
      if (this.xAxis === 'CD45') cx = 550 + Math.random() * 50;
      else if (this.xAxis === 'FSC_A') cx = 600 + Math.random() * 60;
      
      if (this.yAxis === 'SSC_A') cy = 760 + Math.random() * 80;
    } else if (cellType === 'AML_Blast' || (typeof cellType === 'string' && cellType.startsWith('AML_Blast_'))) {
      if (this.xAxis === 'CD45') cx = 460 + Math.random() * 50;
      else if (this.xAxis === 'FSC_A') cx = 480 + Math.random() * 50;
      else if (this.xAxis === 'CD34') cx = 680 + Math.random() * 60;
      
      if (this.yAxis === 'SSC_A') cy = 250 + Math.random() * 45;
      else if (this.yAxis === 'CD117') cy = 650 + Math.random() * 65;
      else if (this.yAxis === 'HLA_DR') cy = 550 + Math.random() * 50;
    } else if (cellType === 'NormalProgenitor') {
      if (this.xAxis === 'CD45') cx = 510 + Math.random() * 40;
      else if (this.xAxis === 'FSC_A') cx = 460 + Math.random() * 40;
      
      if (this.yAxis === 'SSC_A') cy = 230 + Math.random() * 30;
      else if (this.yAxis === 'CD34') cy = 640 + Math.random() * 50;
    } else if (cellType === 'Debris') {
      cx = 60 + Math.random() * 40;
      cy = 60 + Math.random() * 40;
    }
    
    const pt = {
      x: cx,
      y: cy,
      alpha: 1.0,
      radius: 6,
      color: '#00e5ff'
    };
    
    this.temporaryPoints.push(pt);
    
    const animatePoint = () => {
      pt.alpha -= 0.04;
      pt.radius += 0.7;
      this.draw();
      
      if (pt.alpha > 0) {
        requestAnimationFrame(animatePoint);
      } else {
        this.temporaryPoints = this.temporaryPoints.filter(p => p !== pt);
        this.draw();
      }
    };
    
    requestAnimationFrame(animatePoint);
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

  getCandidateAutoGates() {
    const candidates = [];
    const isAML = this.canvas.id.includes('aml') || (typeof currentCase !== 'undefined' && currentCase === 'aml');
    const axesKey = `${this.xAxis}_${this.yAxis}`;
    
    if (axesKey === 'FSC_A_FSC_H') {
      candidates.push({
        name: 'Singlets',
        desc: 'Excludes doublets/aggregates by selecting cells with a linear area-to-height ratio.',
        type: 'poly',
        color: '#795548',
        points: isAML ? 
          [{ x: 150, y: 140 }, { x: 800, y: 760 }, { x: 950, y: 910 }, { x: 900, y: 950 }, { x: 740, y: 810 }, { x: 100, y: 190 }] :
          [{ x: 200, y: 180 }, { x: 850, y: 800 }, { x: 960, y: 910 }, { x: 900, y: 960 }, { x: 760, y: 840 }, { x: 150, y: 220 }]
      });
    }
    else if (axesKey === 'FSC_A_SSC_A') {
      candidates.push({
        name: 'Cells',
        desc: 'Selects viable leukocyte populations while excluding low-FSC cellular debris.',
        type: 'rect',
        color: '#607d8b',
        points: isAML ?
          [{ x: 200, y: 50 }, { x: 950, y: 950 }] :
          [{ x: 250, y: 50 }, { x: 950, y: 950 }]
      });
    }
    else if (axesKey === 'CD45_SSC_A') {
      candidates.push({
        name: 'Lymphocytes',
        desc: 'CD45-bright, SSC-low population comprising T, B, and NK cells.',
        type: 'poly',
        color: '#ff2a2a',
        points: [{ x: 700, y: 40 }, { x: 960, y: 40 }, { x: 960, y: 240 }, { x: 800, y: 240 }, { x: 700, y: 140 }]
      });
      candidates.push({
        name: 'Monocytes',
        desc: 'CD45-bright, SSC-intermediate population. Express CD14 and CD64.',
        type: 'poly',
        color: '#4caf50',
        points: [{ x: 620, y: 280 }, { x: 850, y: 280 }, { x: 850, y: 540 }, { x: 720, y: 580 }, { x: 620, y: 450 }]
      });
      candidates.push({
        name: 'Granulocytes',
        desc: 'CD45-dim/moderate, SSC-high granulocytic myeloid subset.',
        type: 'poly',
        color: '#2196f3',
        points: [{ x: 420, y: 620 }, { x: 780, y: 620 }, { x: 820, y: 980 }, { x: 420, y: 980 }]
      });
      if (isAML) {
        candidates.push({
          name: 'Blasts',
          desc: 'CD45-dim, SSC-low expanded leukemic myeloblast population.',
          type: 'poly',
          color: '#9c27b0',
          points: [{ x: 300, y: 100 }, { x: 560, y: 100 }, { x: 560, y: 360 }, { x: 420, y: 400 }, { x: 300, y: 250 }]
        });
      } else {
        candidates.push({
          name: 'Blasts / Progenitors',
          desc: 'CD45-dim, SSC-low rare hematopoietic progenitor cells in normal blood.',
          type: 'poly',
          color: '#9c27b0',
          points: [{ x: 300, y: 100 }, { x: 550, y: 100 }, { x: 550, y: 300 }, { x: 300, y: 300 }]
        });
      }
    }
    else if (axesKey === 'CD3_CD4') {
      candidates.push({
        name: 'CD3+ T Cells',
        desc: 'Mature T-lymphocytes expressing CD3.',
        type: 'rect',
        color: '#00e5ff',
        points: [{ x: 600, y: 40 }, { x: 980, y: 980 }]
      });
      candidates.push({
        name: 'CD4+ Helper T Cells',
        desc: 'CD3+ CD4+ helper T-cells.',
        type: 'rect',
        color: '#ff9800',
        points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
      });
    }
    else if (axesKey === 'CD3_CD8') {
      candidates.push({
        name: 'CD8+ Cytotoxic T Cells',
        desc: 'CD3+ CD8+ cytotoxic T-cells.',
        type: 'rect',
        color: '#ff2a2a',
        points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
      });
    }
    else if (axesKey === 'CD34_CD117') {
      candidates.push({
        name: 'CD34+ CD117+ Blasts',
        desc: 'Myeloblasts co-expressing early progenitor CD34 and myeloid precursor CD117.',
        type: 'rect',
        color: '#9c27b0',
        points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
      });
    }
    else if (axesKey === 'CD33_CD13') {
      if (isAML) {
        candidates.push({
          name: 'Aberrant Blasts',
          desc: 'CD33-positive blasts showing aberrant loss (negativity) of CD13.',
          type: 'rect',
          color: '#e91e63',
          points: [{ x: 600, y: 40 }, { x: 980, y: 250 }]
        });
      } else {
        candidates.push({
          name: 'Normal Myeloid Progenitors',
          desc: 'Normal myeloid precursors co-expressing CD33 and CD13.',
          type: 'rect',
          color: '#4caf50',
          points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
        });
      }
    }
    else if (axesKey === 'CD34_CD7') {
      candidates.push({
        name: 'Aberrant CD7+ Blasts',
        desc: 'Leukemic blasts expressing progenitor CD34 and aberrantly expressing lymphoid marker CD7.',
        type: 'rect',
        color: '#ff2a2a',
        points: [{ x: 600, y: 600 }, { x: 980, y: 980 }]
      });
    }
    else if (axesKey === 'CD19_SSC_A') {
      candidates.push({
        name: 'B Cells',
        desc: 'CD19+ B-lymphocyte lineage.',
        type: 'rect',
        color: '#ff9800',
        points: [{ x: 600, y: 40 }, { x: 980, y: 250 }]
      });
    }
    else if (axesKey === 'CD3_SSC_A') {
      candidates.push({
        name: 'T Cells',
        desc: 'CD3+ T-lymphocyte lineage.',
        type: 'rect',
        color: '#00e5ff',
        points: [{ x: 600, y: 40 }, { x: 980, y: 250 }]
      });
    }
    else if (axesKey === 'CD56_SSC_A') {
      candidates.push({
        name: 'NK Cells',
        desc: 'CD56+ NK-lymphocyte lineage.',
        type: 'rect',
        color: '#ff2a2a',
        points: [{ x: 600, y: 40 }, { x: 980, y: 250 }]
      });
    }
    else if (axesKey === 'Kappa_Lambda') {
      candidates.push({
        name: 'Kappa B Cells',
        desc: 'B-lymphocytes expressing Kappa light chains.',
        type: 'rect',
        color: '#ff9800',
        points: [{ x: 600, y: 40 }, { x: 980, y: 300 }]
      });
      candidates.push({
        name: 'Lambda B Cells',
        desc: 'B-lymphocytes expressing Lambda light chains.',
        type: 'poly',
        color: '#ff2a2a',
        points: [{ x: 40, y: 600 }, { x: 320, y: 600 }, { x: 320, y: 980 }, { x: 40, y: 980 }]
      });
    }
    
    if (candidates.length === 0) {
      const cleanMarker = m => m.replace('_A', '').replace('_H', '');
      const labelX = cleanMarker(this.xAxis);
      const labelY = cleanMarker(this.yAxis);
      
      candidates.push({
        name: `${labelX}+ ${labelY}+ Cells`,
        desc: `Double-positive population expressing positive levels of both ${labelX} and ${labelY}.`,
        type: 'rect',
        color: '#00e5ff',
        points: [{ x: 500, y: 500 }, { x: 980, y: 980 }]
      });
      candidates.push({
        name: `${labelX}+ ${labelY}- Cells`,
        desc: `Single-positive population expressing ${labelX} but negative for ${labelY}.`,
        type: 'rect',
        color: '#ff9800',
        points: [{ x: 500, y: 40 }, { x: 980, y: 500 }]
      });
      candidates.push({
        name: `${labelX}- ${labelY}+ Cells`,
        desc: `Single-positive population expressing ${labelY} but negative for ${labelX}.`,
        type: 'rect',
        color: '#ff2a2a',
        points: [{ x: 40, y: 500 }, { x: 500, y: 980 }]
      });
    }
    
    candidates.forEach(c => {
      c.xAttr = this.xAxis;
      c.yAttr = this.yAxis;
    });
    
    return candidates;
  }

  drawCandidateAutoGates() {
    const candidates = this.getCandidateAutoGates();
    
    candidates.forEach(cand => {
      const mouseDataPt = {
        x: this.toDataX(this.currentMousePos.x),
        y: this.toDataY(this.currentMousePos.y)
      };
      
      const isHovered = this.isPointInGate(mouseDataPt, cand);
      
      this.ctx.save();
      
      let strokeColor = cand.color || '#e2e8f0';
      let fillColor = cand.color || '#e2e8f0';
      let fillAlpha = isHovered ? 0.18 : 0.04;
      this.ctx.lineWidth = isHovered ? 2.5 : 1.5;
      
      if (!isHovered) {
        this.ctx.setLineDash([4, 4]);
      } else {
        this.ctx.setLineDash([]);
      }
      
      this.ctx.beginPath();
      if (cand.type === 'rect') {
        const p1 = cand.points[0];
        const p2 = cand.points[1];
        const x1 = this.toPixelX(p1.x);
        const y1 = this.toPixelY(p1.y);
        const x2 = this.toPixelX(p2.x);
        const y2 = this.toPixelY(p2.y);
        this.ctx.rect(x1, y1, x2 - x1, y2 - y1);
      } else if (cand.type === 'poly' && cand.points.length >= 3) {
        const start = cand.points[0];
        this.ctx.moveTo(this.toPixelX(start.x), this.toPixelY(start.y));
        for (let i = 1; i < cand.points.length; i++) {
          const pt = cand.points[i];
          this.ctx.lineTo(this.toPixelX(pt.x), this.toPixelY(pt.y));
        }
        this.ctx.closePath();
      }
      
      this.ctx.globalAlpha = fillAlpha;
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      
      this.ctx.globalAlpha = 0.8;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
      
      let centerX, centerY;
      if (cand.type === 'rect') {
        const p1 = cand.points[0];
        const p2 = cand.points[1];
        centerX = (p1.x + p2.x) / 2;
        centerY = (p1.y + p2.y) / 2;
      } else {
        const centroid = cand.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        centerX = centroid.x / cand.points.length;
        centerY = centroid.y / cand.points.length;
      }
      
      const px = this.toPixelX(centerX);
      const py = this.toPixelY(centerY);
      
      const text = (isHovered ? 'Click to Gate: ' : 'Auto: ') + cand.name;
      this.ctx.font = '600 11px sans-serif';
      const textWidth = this.ctx.measureText(text).width;
      const paddingX = 8;
      const paddingY = 4;
      const badgeW = textWidth + paddingX * 2;
      const badgeH = 18 + paddingY * 2;
      
      this.ctx.globalAlpha = 0.85;
      this.ctx.fillStyle = isHovered ? strokeColor : '#0f172a';
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 1;
      
      this.drawRoundedRect(px - badgeW / 2, py - badgeH / 2, badgeW, badgeH, 6, true, true);
      
      this.ctx.globalAlpha = 1.0;
      this.ctx.fillStyle = isHovered ? '#0f172a' : '#f8fafc';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, px, py);
      
      this.ctx.restore();
    });
  }

  drawRoundedRect(x, y, width, height, radius, fill, stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    if (fill) this.ctx.fill();
    if (stroke) this.ctx.stroke();
  }

  restoreContext() {
    this.ctx.restore();
  }

  getCellTypeCenter(cellType, xAxis, yAxis) {
    let cx = 500;
    let cy = 500;
    
    if (cellType === 'CD4_TCell' || cellType === 'CD8_TCell' || cellType === 'gd_TCell' || cellType === 'BCell' || cellType === 'NKCell') {
      if (xAxis === 'CD45') cx = 765;
      else if (xAxis === 'FSC_A') cx = 380;
      else if (xAxis === 'CD3') cx = (cellType === 'BCell' || cellType === 'NKCell') ? 120 : 780;
      else if (xAxis === 'CD4') cx = (cellType === 'CD4_TCell') ? 730 : 100;
      else if (xAxis === 'CD8') cx = (cellType === 'CD8_TCell') ? 710 : 100;
      
      if (yAxis === 'SSC_A') cy = 195;
      else if (yAxis === 'CD19') cy = (cellType === 'BCell') ? 750 : 90;
      else if (yAxis === 'CD8') cy = (cellType === 'CD8_TCell') ? 710 : 100;
      else if (yAxis === 'CD38') cy = 225;
    } else if (cellType === 'Monocyte') {
      if (xAxis === 'CD45') cx = 800;
      else if (xAxis === 'FSC_A') cx = 680;
      else if (xAxis === 'CD3') cx = 90;
      else if (xAxis === 'CD14') cx = 750;
      
      if (yAxis === 'SSC_A') cy = 372.5;
      else if (yAxis === 'HLA_DR') cy = 625;
    } else if (cellType === 'Granulocyte') {
      if (xAxis === 'CD45') cx = 575;
      else if (xAxis === 'FSC_A') cx = 630;
      
      if (yAxis === 'SSC_A') cy = 800;
    } else if (cellType === 'AML_Blast' || (typeof cellType === 'string' && cellType.startsWith('AML_Blast_'))) {
      if (xAxis === 'CD45') cx = 485;
      else if (xAxis === 'FSC_A') cx = 505;
      else if (xAxis === 'CD34') cx = 710;
      
      if (yAxis === 'SSC_A') cy = 272.5;
      else if (yAxis === 'CD117') cy = 682.5;
      else if (yAxis === 'HLA_DR') cy = 575;
    } else if (cellType === 'NormalProgenitor') {
      if (xAxis === 'CD45') cx = 530;
      else if (xAxis === 'FSC_A') cx = 480;
      
      if (yAxis === 'SSC_A') cy = 245;
      else if (yAxis === 'CD34') cy = 665;
    } else if (cellType === 'Debris') {
      cx = 80;
      cy = 80;
    }
    
    return { x: cx, y: cy };
  }

  drawPersistentHighlight() {
    if (!this.highlightedCellType) return;
    
    const center = this.getCellTypeCenter(this.highlightedCellType, this.xAxis, this.yAxis);
    const px = this.toPixelX(center.x);
    const py = this.toPixelY(center.y);
    
    const xMin = this.zoomX ? this.zoomX[0] : 0;
    const xMax = this.zoomX ? this.zoomX[1] : 1000;
    const yMin = this.zoomY ? this.zoomY[0] : 0;
    const yMax = this.zoomY ? this.zoomY[1] : 1000;
    
    if (center.x < xMin || center.x > xMax || center.y < yMin || center.y > yMax) return;
    
    const time = Date.now() / 1000;
    const pulseRadius = 13 + Math.sin(time * 6) * 3;
    const opacity = 0.65 + Math.sin(time * 6) * 0.2;
    
    let color = '#00e5ff'; // aqua
    if (this.highlightedCellType === 'BCell') color = '#ff9800'; // orange
    else if (this.highlightedCellType === 'NKCell') color = '#ff2a2a'; // red
    else if (this.highlightedCellType === 'Monocyte') color = '#4caf50'; // green
    else if (this.highlightedCellType === 'Granulocyte') color = '#2196f3'; // blue
    else if (this.highlightedCellType === 'AML_Blast' || (typeof this.highlightedCellType === 'string' && this.highlightedCellType.startsWith('AML_Blast_'))) color = '#9c27b0'; // purple
    
    this.ctx.save();
    
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1.8;
    this.ctx.globalAlpha = opacity;
    this.ctx.setLineDash([4, 3]);
    
    this.ctx.translate(px, py);
    this.ctx.rotate(time * 0.5);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.rotate(-time * 0.5);
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1.2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, -pulseRadius - 3);
    this.ctx.lineTo(0, -pulseRadius + 1);
    this.ctx.moveTo(0, pulseRadius - 1);
    this.ctx.lineTo(0, pulseRadius + 3);
    this.ctx.moveTo(-pulseRadius - 3, 0);
    this.ctx.lineTo(-pulseRadius + 1, 0);
    this.ctx.moveTo(pulseRadius - 1, 0);
    this.ctx.lineTo(pulseRadius + 3, 0);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.font = 'bold 8px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText("TARGET", 0, -pulseRadius - 5);
    
    this.ctx.restore();
  }
}

// Export for browser/Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowPlot;
} else {
  window.FlowPlot = FlowPlot;
}
