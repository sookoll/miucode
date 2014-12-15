({
    mainConfigFile: '../src/ui/js/app.js',
    appDir: "../src",
    dir: "../dist",
    baseUrl: "ui/js",
    modules: [
        {
            name: "miucode"
        }
    ],
    optimize: "uglify2",
    optimizeCss: "standard",
    removeCombined: true
})