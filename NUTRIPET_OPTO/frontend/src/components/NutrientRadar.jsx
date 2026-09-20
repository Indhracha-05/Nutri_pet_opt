import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function NutrientRadar({ features, compact }) {
    if (!features) return null;

    const labels = [
        'Protein Match',
        'Fat Match',
        'Carb Tol.',
        'Omega Bal.',
        'Bioavail.',
        'Fiber Comp.'
    ];

    const dataValues = [
        features.protein_match || 0,
        features.fat_match || 0,
        features.carb_tolerance || 0,
        features.omega_balance || 0,
        features.bioavailability_match || 0,
        features.fiber_compatibility || 0
    ];

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Ingredient Score',
                data: dataValues,
                backgroundColor: 'rgba(120, 113, 108, 0.15)',
                borderColor: '#78716C',
                borderWidth: 1.5,
                pointBackgroundColor: '#78716C',
                pointBorderColor: '#FAFAF9',
                pointBorderWidth: 1,
                pointRadius: 3,
            },
            {
                label: 'Optimal Threshold',
                data: [1, 1, 1, 1, 1, 1],
                backgroundColor: 'transparent',
                borderColor: '#65A30D',
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [4, 4],
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: { color: '#E7E5E4' },
                grid: { color: '#E7E5E4' },
                ticks: { display: false, maxTicksLimit: 5 },
                suggestedMin: 0,
                suggestedMax: 1,
                pointLabels: {
                    font: { size: compact ? 9 : 11, family: 'Inter', weight: '500' },
                    color: '#57534E'
                }
            },
        },
        plugins: {
            legend: {
                display: !compact,
                position: 'bottom',
                labels: {
                    boxWidth: 8,
                    padding: 12,
                    color: '#57534E',
                    font: { size: 11, family: 'Inter' }
                }
            },
        }
    };

    if (compact) {
        return (
            <div className="w-full h-full">
                <Radar data={data} options={options} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-[220px]">
                <Radar data={data} options={options} />
            </div>
        </div>
    );
}
