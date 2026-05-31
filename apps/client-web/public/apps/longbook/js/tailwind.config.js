
        // Use a safer check for Tailwind config
        window.addEventListener('DOMContentLoaded', () => {
            if (typeof tailwind !== 'undefined') {
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                accent: '#ffd700',
                                dim: '#888888',
                                main: '#f2f2f2',
                                panel: 'rgba(18, 18, 20, 0.7)',
                                border: 'rgba(255, 255, 255, 0.08)'
                            },
                            fontFamily: {
                                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                            },
                            animation: {
                                'fade-in': 'fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                'spin-slow': 'spin 3s linear infinite',
                            },
                            keyframes: {
                                fadeIn: {
                                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                                    '100%': { opacity: '1', transform: 'translateY(0)' },
                                }
                            }
                        }
                    }
                }
            } else {
                console.warn('Tailwind not loaded, relying on fallback CSS');
                const warning = document.createElement('div');
                warning.style.cssText = "position:fixed;bottom:10px;right:10px;background:rgba(255,0,0,0.8);color:white;padding:10px;border-radius:5px;z-index:9999;font-size:12px;pointer-events:none;";
                warning.innerHTML = "<i class='fa-solid fa-triangle-exclamation'></i> Offline Mode";
                document.body.appendChild(warning);
            }
        });
    