import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FileNode } from '../types/FileSystem';
import { saveOutput } from '../utils/fileSystem';

interface GraphViewProps {
  data: FileNode;
}

export const GraphView: React.FC<GraphViewProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    const treeData = treeLayout(root);

    const g = svg.append('g')
      .attr('transform', 'translate(100, 50)');

    // Add links
    g.selectAll('.link')
      .data(treeData.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

    // Add nodes
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    nodes.append('circle')
      .attr('r', 4)
      .attr('fill', d => d.data.type === 'directory' ? '#4299e1' : '#a0aec0');

    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -6 : 6)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('class', 'text-sm fill-current text-gray-700');
  }, [data]);

  const handleSave = async () => {
    if (containerRef.current) {
      await saveOutput(data, 'graph', containerRef.current);
    }
  };

  return (
    <div className="overflow-auto border rounded-lg bg-white" ref={containerRef}>
      <div className="p-4 border-b">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Save as Image
        </button>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};