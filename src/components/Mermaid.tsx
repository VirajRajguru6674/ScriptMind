
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

interface MermaidProps {
    chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && chart) {
            ref.current.removeAttribute('data-processed');
            mermaid.contentLoaded();

            // Force render
            try {
                mermaid.render('mermaid-chart-' + Math.random().toString(36).substr(2, 9), chart)
                    .then(({ svg }) => {
                        if (ref.current) {
                            ref.current.innerHTML = svg;
                        }
                    })
                    .catch(err => {
                        console.error('Mermaid render error:', err);
                        if (ref.current) {
                            ref.current.innerHTML = '<p class="text-sm text-destructive p-4">Error rendering diagram. Please try regenerating.</p>';
                        }
                    });
            } catch (e) {
                console.error('Mermaid exception:', e);
            }
        }
    }, [chart]);

    return (
        <div className="mermaid-container w-full overflow-x-auto p-4 flex justify-center bg-background/50 rounded-xl border border-border/50">
            <div ref={ref} className="mermaid flex justify-center w-full" />
        </div>
    );
};
