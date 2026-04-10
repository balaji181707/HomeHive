// ========================================
// OFFLINE-READY GRAPH EXPORT ENGINE
// ========================================

window.exportGraphSVG = function() {
    const svgEl = document.querySelector('#graph-container svg');
    if(!svgEl) {
        alert("Graph engine is still booting up!");
        return;
    }
    
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);

    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "HomeHive_Graph_Snapshot_" + Date.now() + ".svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

// ========================================
// GRAPH PHYSICS ENGINE CORE
// ========================================

async function renderGraph() {
  const container = document.getElementById('graph-container');
  container.innerHTML = '<p style="text-align:center; padding-top:200px; color:#E2E8F0;">Booting Graph Physics Engine...</p>';

  try {
      // Attempt Live Network Fetch
      const { nodes, links } = await api.get('/admin/graph');
      
      // Save mathematically perfect snapshot to browser cache for Offline Support!
      localStorage.setItem('hh_graph_cache', JSON.stringify({ nodes, links }));
      
      container.innerHTML = ''; 
      buildGraphPhysics(nodes, links, container);

  } catch(e) {
      console.warn("API Offline. Degrading gracefully to Local Cache Layer...");
      
      const cachedData = localStorage.getItem('hh_graph_cache');
      if (cachedData) {
          const { nodes, links } = JSON.parse(cachedData);
          container.innerHTML = '<div style="position:absolute; top:20px; left:50%; transform:translateX(-50%); background:rgba(230,57,70,0.85); color:white; padding:8px 20px; border-radius:20px; font-size:0.85rem; font-weight:bold; z-index:100; box-shadow: 0 4px 15px rgba(230,57,70,0.4); letter-spacing:0.5px;">⚡ OFFLINE MODE: Showing Cached Graph Layer</div>';
          buildGraphPhysics(nodes, links, container);
      } else {
          container.innerHTML = '<p style="text-align:center; color:#E63946; margin-top:200px; font-weight:bold;">Graph Engine Offline. No Cached Matrix Available.</p>';
      }
  }
}

function buildGraphPhysics(nodes, links, container) {
      const width = container.clientWidth;
      const height = container.clientHeight;

      const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');

      const g = svg.append('g');

      const zoom = d3.zoom()
        .scaleExtent([0.1, 5])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

      svg.call(zoom);

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(180))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));

      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', 'rgba(150, 150, 150, 0.4)')
        .attr('stroke-width', 2);

      const linkLabels = g.append('g')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .text(d => d.label)
        .attr('font-size', 10)
        .attr('font-family', 'Montserrat, sans-serif')
        .attr('font-weight', '500')
        .attr('fill', '#666')
        .attr('text-anchor', 'middle');

      const colorMap = { 'User': '#7F77DD', 'Property': '#1D9E75', 'Review': '#D85A30' };

      const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 24)
        .attr('fill', d => colorMap[d.label] || '#999')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
        );

      const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', 13)
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-weight', '500')
        .attr('fill', '#E2E8F0') 
        .attr('text-anchor', 'middle')
        .attr('dy', 40); 

      simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
            
        linkLabels
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2 - 5);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
            
        label
            .attr('x', d => d.x)
            .attr('y', d => d.y);
      });

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      }
      function dragged(event, d) {
        d.fx = event.x; d.fy = event.y;
      }
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      }
}

document.addEventListener('DOMContentLoaded', renderGraph);
