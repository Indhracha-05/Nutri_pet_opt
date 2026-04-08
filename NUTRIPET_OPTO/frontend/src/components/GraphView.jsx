import React from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

export default function GraphView({ graphData }) {
    if (!graphData || !graphData.elements || graphData.elements.length === 0) {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 h-full flex items-center justify-center">
                <p className="text-white/30">No graph data available for this analysis.</p>
            </div>
        );
    }

    const layout = {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        padding: 10,
        componentSpacing: 100,
    };

    const stylesheet = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(color)',
                'label': 'data(label)',
                'font-size': '11px',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': '50px',
                'height': '50px',
                'color': '#fff',
                'text-outline-width': 2,
                'text-outline-color': '#1a1a2e',
                'text-wrap': 'wrap',
                'text-max-width': '80px',
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': 'data(color)',
                'target-arrow-color': 'data(color)',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '9px',
                'text-rotation': 'autorotate',
                'text-background-opacity': 0.9,
                'text-background-color': '#1a1a2e',
                'text-background-padding': '2px',
                'color': '#aaa'
            }
        },
        {
            selector: 'node[type="Species"]',
            style: {
                'shape': 'star',
                'width': '60px',
                'height': '60px',
            }
        },
        {
            selector: 'node[type="Food"]',
            style: {
                'shape': 'ellipse',
                'width': '55px',
                'height': '55px',
            }
        }
    ];

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 h-full flex flex-col">
            <h3 className="text-base font-bold text-white/80 mb-3 px-2 border-b border-white/10 pb-2 flex items-center gap-2">
                <span className="bg-purple-600/30 p-1.5 rounded-lg">⚡</span>
                Knowledge Graph Context
            </h3>
            <div className="flex-grow border border-white/5 rounded-xl bg-gray-950/50 overflow-hidden relative" style={{ minHeight: '350px' }}>
                <CytoscapeComponent
                    elements={CytoscapeComponent.normalizeElements(graphData.elements)}
                    style={{ width: '100%', height: '100%' }}
                    layout={layout}
                    stylesheet={stylesheet}
                    cy={(cy) => {
                        cy.minZoom(0.5);
                        cy.maxZoom(2);
                        cy.fit();
                    }}
                    wheelSensitivity={0.2}
                />
            </div>
            <p className="text-xs text-white/25 mt-2 text-center">
                Visualizing relationships between species, food, and nutrients. Drag nodes to interact.
            </p>
        </div>
    );
}
