import globals from 'globals';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    js.configs.recommended,
    {
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: {
            globals: {
                ...globals.node
            },
        },
        rules: {
            'no-extra-bind': 'error',
            'no-shadow': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'quotes': [ 'error', 'single' ],
            'semi': [ 'error', 'always' ]
        }
    }
]);
