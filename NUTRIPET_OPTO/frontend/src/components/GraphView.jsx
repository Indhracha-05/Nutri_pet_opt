import React from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

export default function GraphView({ graphData }) {
    if (!graphData || !graphData.elements || graphData.elements.length === 0) {
        return (
            <div className="bg-[#FAFAF9] border border-[#E7E5E4] p-6 h-full flex items-center justify-center">
                <p className="text-[#A8A29E] text-xs">No graph topology available for this inquiry.</p>
            </div>
        );
    }

    const layout = {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        padding: 20,
        componentSpacing: 80,
    };

    const stylesheet = [
        {
            selector: 'node',
            style: {
                'background-color': '#78716C',
                'label': 'data(label)',
                'font-family': 'Inter',
                'font-size': '11px',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': '48px',
                'height': '48px',
                'color': '#FAFAF9',
                'text-outline-width': 0,
                'text-wrap': 'wrap',
                'text-max-width': '75px',
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 1.5,
                'line-color': '#D6D3D1',
                'target-arrow-color': '#78716C',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-family': 'Inter',
                'font-size': '9px',
                'text-rotation': 'autorotate',
                'text-background-opacity': 1,
                'text-background-color': '#FAFAF9',
                'text-background-padding': '2px',
                'color': '#57534E'
            }
        },
        {
            selector: 'node[type="Species"]',
            style: {
                'shape': 'rectangle',
                'background-color': '#1C1917',
                'width': '60px',
                'height': '40px',
            }
        },
        {
            selector: 'node[type="Food"]',
            style: {
                'shape': 'ellipse',
                'background-color': '#78716C',
                'width': '52px',
                'height': '52px',
            }
        },
        {
            selector: 'node[type="Nutrient"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#A8A29E',
                'width': '45px',
                'height': '35px',
            }
        }
    ];

    return (
        <div className="bg-[#FAFAF9] border border-[#E7E5E4] p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4]">
                <div>
                    <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[#78716C]">
                        Knowledge Graph
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#1C1917] mt-0.5">
                        Biochemical Relationship Topology
                    </h3>
                </div>
                <span className="text-[11px] text-[#A8A29E] font-sans">
                  Interactive Node Canvas
                </span>
            </div>

            <div className="my-3 border border-[#E7E5E4] bg-[#F5F5F4] overflow-hidden relative" style={{ minHeight: '340px' }}>
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

            <p className="text-xs text-[#A8A29E] text-center font-sans">
                Drag nodes to inspect entity interactions and metabolic dependencies.
            </p>
        </div>
    );
}
