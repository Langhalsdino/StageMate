module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "parserOptions": {
        "ecmaVersion": 8, // or 2017
        "sourceType": "module",
    },
    "rules": {
        "indent": [
            "error",
            2,
            { "SwitchCase": 1 } // 2 spaces for "case" indentation
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single",
            { "allowTemplateLiterals": true }
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars": "warn",
        "no-console":     "warn",
        "no-var":         "error",
    }
};
