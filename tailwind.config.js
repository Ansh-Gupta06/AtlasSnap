export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Playfair Display', 'Georgia', 'serif'],
                handwriting: ['Caveat', 'cursive'],
            },
            colors: {
                paper: '#f5f0e8',
                'paper-dark': '#e8dfd2',
                cork: '#c4955a',
                'cork-dark': '#a07840',
                tape: 'rgba(173, 216, 230, 0.5)',
                'tape-pink': 'rgba(255, 182, 193, 0.5)',
                'tape-green': 'rgba(144, 238, 144, 0.45)',
                'tape-yellow': 'rgba(255, 255, 150, 0.5)',
                ink: '#2c1810',
            },
            rotate: {
                '1': '1deg',
                '2': '2deg',
                '3': '3deg',
                '-1': '-1deg',
                '-2': '-2deg',
                '-3': '-3deg',
            },
            boxShadow: {
                'polaroid': '2px 3px 8px rgba(0,0,0,0.3)',
                'paper': '1px 2px 6px rgba(0,0,0,0.15)',
                'lifted': '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.12)',
            }
        },
    },
    plugins: [],
}
