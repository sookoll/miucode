requirejs.config({
    "baseUrl": "ui/js",
    "paths": {
        "jquery": "../libs/jquery-2.1.1.min",
        "jquery.bootstrap": "../libs/bootstrap-3.3.1/js/bootstrap.min",
        "codemirror": "../libs/codemirror-4.8",
        "jquery.explorer": "../libs/jquery.explorer/jquery.explorer",
        "jquery.ui.widget": "../libs/jQuery-File-Upload-9.8.1/js/vendor/jquery.ui.widget",
        "jquery.upload": "../libs/jQuery-File-Upload-9.8.1/js/jquery.fileupload",
        "miucode": "miucode"
    },
    "shim": {
        "jquery.bootstrap": {
            deps: ['jquery']
        },
        "jquery.explorer": {
            deps: ['jquery']
        },
        "jquery.upload": {
            deps: ['jquery','jquery.ui.widget']
        }
    }
});

// Load the main app module to start the app
requirejs(['miucode']);