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
                label: 'Compatibility',
                data: dataValues,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
            },
            {
                label: 'Ideal Limit',
                data: [1, 1, 1, 1, 1, 1],
                backgroundColor: 'rgba(16, 185, 129, 0.0)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [5, 5],
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.08)' },
                ticks: { display: false, maxTicksLimit: 6 },
                suggestedMin: 0,
                suggestedMax: 1,
                pointLabels: {
                    font: { size: compact ? 9 : 11, weight: 'bold' },
                    color: 'rgba(255, 255, 255, 0.6)'
                }
            },
        },
        plugins: {
            legend: {
                display: !compact,
                position: 'bottom',
                labels: {
                    boxWidth: 10,
                    padding: 15,
                    color: 'rgba(255, 255, 255, 0.6)'
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
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col h-full">
            <h3 className="text-base font-bold text-white/80 mb-3 text-center">Compatibility Radar</h3>
            <div className="flex-grow min-h-[250px]">
                <Radar data={data} options={options} />
            </div>
        </div>
    );
}
