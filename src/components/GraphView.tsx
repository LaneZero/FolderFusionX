import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FileNode } from '../types/FileSystem';
import { saveOutput } from '../utils/fileSystem';
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GraphViewProps {
  data: FileNode;
  darkMode?: boolean;
}

export const GraphView: React.FC<GraphViewProps> = ({ data, darkMode = false }) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    svg.selectAll('*').remove();

    // Create a group for the graph
    const g = svg.append('g')
      .attr('transform', 'translate(100, 50)');

    // Create a zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    // Apply zoom behavior to the SVG
    svg.call(zoomBehavior as any);

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    const treeData = treeLayout(root);

    // Add links
    g.selectAll('.link')
      .data(treeData.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', darkMode ? '#4B5563' : '#CBD5E0')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

    // Add nodes
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Add node circles
    nodes.append('circle')
      .attr('r', d => d.data.type === 'directory' ? 6 : 4)
      .attr('fill', d => {
        if (d.data.type === 'directory') {
          return darkMode ? '#3B82F6' : '#4299e1';
        } else {
          // Different colors for different file types
          const extension = d.data.extension || '';
          if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) {
            return darkMode ? '#FBBF24' : '#F59E0B'; // JavaScript/TypeScript - yellow
          } else if (['html', 'css', 'scss', 'sass'].includes(extension)) {
            return darkMode ? '#EC4899' : '#D53F8C'; // Web - pink
          } else if (['json', 'yml', 'yaml', 'xml'].includes(extension)) {
            return darkMode ? '#10B981' : '#059669'; // Data - green
          } else if (['md', 'txt', 'pdf'].includes(extension)) {
            return darkMode ? '#8B5CF6' : '#6D28D9'; // Documents - purple
          } else {
            return darkMode ? '#9CA3AF' : '#A0AEC0'; // Other - gray
          }
        }
      })
      .attr('stroke', darkMode ? '#1F2937' : '#FFFFFF')
      .attr('stroke-width', 1.5);

    // Add node labels
    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -8 : 8)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('class', 'text-sm')
      .attr('fill', darkMode ? '#D1D5DB' : '#4A5568')
      .attr('font-weight', d => d.data.type === 'directory' ? 'bold' : 'normal')
      .attr('font-size', '12px');

    // Add hover effect
    nodes.on('mouseover', function() {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d => (d.data.type === 'directory' ? 8 : 6));
    })
    .on('mouseout', function() {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', d => (d.data.type === 'directory' ? 6 : 4));
    });

    // Initial zoom to fit
    const resetZoom = () => {
      const bounds = g.node().getBBox();
      const dx = bounds.width;
      const dy = bounds.height;
      const x = bounds.x + dx / 2;
      const y = bounds.y + dy / 2;
      const scale = 0.9 / Math.max(dx / width, dy / height);
      const translate = [width / 2 - scale * x, height / 2 - scale * y];
      
      svg.transition()
        .duration(750)
        .call(
          zoomBehavior.transform as any,
          d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale)
        );
    };

    // Call reset zoom initially
    resetZoom();

    // Expose reset zoom function
    (window as any).resetGraphZoom = resetZoom;

  }, [data, darkMode]);

  const handleSave = async () => {
    try {
      await saveOutput(data, 'graph', containerRef.current);
    } catch (error) {
      console.error('خطا در ذخیره نمای گراف:', error);
    }
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom().scaleExtent([0.1, 3]);
    svg.transition().call(
      (zoomBehavior.scaleBy as any),
      1.3
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom().scaleExtent([0.1, 3]);
    svg.transition().call(
      (zoomBehavior.scaleBy as any),
      0.7
    );
  };

  const handleReset = () => {
    if (typeof (window as any).resetGraphZoom === 'function') {
      (window as any).resetGraphZoom();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      className={`overflow-hidden border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} 
      ref={containerRef}
    >
      <div className={`p-3 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Graph View</h2>
        <div className="flex gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={handleZoomIn}
              className={`p-1.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
              title="Zoom in"
            >
              <ZoomIn className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={handleZoomOut}
              className={`p-1.5 border-l border-r ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
              title="Zoom out"
            >
              <ZoomOut className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={handleReset}
              className={`p-1.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
              title="Reset view"
            >
              <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}
            title="Toggle fullscreen"
          >
            <Maximize className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Save as image"
          >
            <Download className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
      <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-auto`}>
        <div className="flex justify-center">
          <svg ref={svgRef}></svg>
        </div>
      </div>
      <div className={`px-4 py-2 border-t text-xs ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        <div className="flex justify-between items-center">
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Directories</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
              <span>JavaScript/TypeScript</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-pink-500"></span>
              <span>HTML/CSS</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span>Data Files</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};