define(['jquery', 'codemirror/lib/codemirror', 'jquery.bootstrap', 'codemirror/mode/markdown/markdown', 'jquery.explorer', 'jquery.ui.widget','jquery.upload'], function($, cm) {

    var MiuCode = function(){
        this.explorer = null;
        this.editor = null;
        this.current_file = null;
        this.changed = false;
        this.type = null;
    };

    MiuCode.prototype = {

        getFile : function(filename,clb){
            $.ajax({
                url:'?open_file',
                type:'POST',
                data: {
                    'file':filename
                },
                dataType:'text',
                context: this
            })
            .done(function(d) {
                if(typeof clb == 'function'){
                    clb(d);
                }
            })
            .fail(function(d) {
                alert(d.responseText);
            });
        },

        openFile : function(path, file, data){
            var _this = this;
            this.editor = cm.fromTextArea(document.getElementById("code"), {
                mode : 'markdown',
                lineNumbers : true,
                theme : "default",
                extraKeys : {
                    "Enter" : "newlineAndIndentContinueMarkdownList"
                }
            });

            this.current_file = file;
            this.editor.setValue(data);
            if(file === null){
                $('header .tools input').prop('readonly', false).val('').focus();
                setTimeout(function(){
                    $('header .tools input').focus();
                }, 10);
                $('header .tools .path span').html(path);
            }
            else {
                var names = file.split('/');
                $('header .tools input').val(names[names.length-1]);
                $('header .tools .path span').html(path);
            }

            this.editor.on("change", function (cm, change) {
                _this.changed = true;
                $('header .tools .save_file').removeClass('btn-success').addClass('btn-warning');
            });
        },

        closeFile: function(){
            $('#editor .CodeMirror').remove();
            $('header .tools input').prop('readonly', true);
            $('header .tools .save_file').removeClass('btn-warning').addClass('btn-success');
            this.current_file = null;
            this.changed = false;
            this.type = null;
        },

        saveFile: function(filename, content, clb){
            if(this.current_file !== null && this.current_file == filename) {
                var url = '?save_file';
                var file = this.current_file;
            } else if(this.current_file === null && filename.length > 0) {
                var url = '?create_file';
                var file = filename;
            } else
                return false;
            $.ajax({
                url: url,
                type:'POST',
                data: {
                    'file': file, 
                    'content':content
                },
                dataType:'json',
                context: this
            })
            .done(function(d) {
                if(typeof d == 'object' && d.status == 1 && typeof clb == 'function'){
                    clb(d);
                }
            })
            .fail(function(d) {
                alert(d.responseText);
            });
        },

        createDir: function(filename, clb){
            $.ajax({
                url: '?create_dir',
                type:'POST',
                data: {
                    'file': filename
                },
                dataType:'json',
                context: this
            })
            .done(function(d) {
                if(typeof d == 'object' && d.status == 1 && typeof clb == 'function'){
                    clb(d);
                }
            })
            .fail(function(d) {
                alert(d.responseText);
            });
        },

        deleteFile: function(file, clb){
            $.ajax({
                url:'?delete_file',
                type:'POST',
                data: {
                    'file': file
                },
                dataType:'json',
                context: this
            })
            .done(function(d) {
                if(typeof d == 'object' && d.status == 1 && typeof clb == 'function'){
                    clb(d);
                }
            })
            .fail(function(d) {
                alert(d.responseText);
            });
        }

    };

    (function() {

        'use strict';

        var app = new MiuCode();

        app.explorer = $('#explorer').explorer({
            root : '',
            script : '?explore',
            folderEvent : 'click',
            onafterexplore : function() {
                // if file was previously open
                this.el.find('li a[data-path="'+app.current_file+'"]').parent().addClass('active');
            },
            ondeleteclick : function(path) {
                if(!path)
                    return false;
                var c = confirm('Oled kindel, et soovid kustutada: ('+path+')?');
                if(c)
                    app.deleteFile(path, function(d){
                        if(app.current_file == path){
                            app.closeFile();
                            $('header .toggle').toggleClass('hidden');
                            $('header .tool').prop('disabled', true);
                        }
                        app.explorer.explorer('reload');
                    });
            }
        }, function(file) {
            app.closeFile();
            app.getFile(file,function(data){
                var path = app.explorer.explorer('getCurrentPath');
                app.openFile(path, file, data);
                if(!$('header .tools').is(':visible'))
                    $('header .toggle').toggleClass('hidden');
                $('header .tool').prop('disabled', false);
                app.type = 'file';
            });
        });

        $('#fileupload').fileupload({
            url: '?upload',
            dataType: 'json',
            autoUpload : true,
            submit: function(e, data){
                data.formData = {path: app.explorer.explorer('getCurrentPath')};
            },
            start: function(e){
                app.explorer.find('.bar').append('<div class="progress-wrapper"><div class="progress-bar"></div></div>');
            },
            progressall: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                app.explorer.find('.progress-bar').css(
                    'width',
                    progress + '%'
                );
                if(data.loaded == data.total){
                    setTimeout(function(){
                        app.explorer.find('.progress-wrapper').fadeOut('slow',function(){
                            app.explorer.explorer('reload');
                        });
                    }, 300);
                }
            }
        })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');

        $('header .new_file').on('click',function(e){
            e.preventDefault();
            //app.closeFile();
            var path = app.explorer.explorer('getCurrentPath');
            app.openFile(path, null, '');
            $('header .toggle').toggleClass('hidden');
            $('header .tool').prop('disabled', false);
            app.explorer.explorer('reload');
            app.type = 'file';
        });

        $('header .new_dir').on('click', function(e){
            e.preventDefault();
            //app.closeFile();
            var path = app.explorer.explorer('getCurrentPath');
            setTimeout(function(){
                $('header .tools input').prop('readonly', false).val('').focus();
            }, 10);
            $('header .tools .path span').html(path);
            $('header .toggle').toggleClass('hidden');
            $('header .tool').prop('disabled', false);
            app.type = 'directory';
        });

        $('header .tools .close_file').on('click',function(){
            app.closeFile();
            $('header .toggle').toggleClass('hidden');
            $('header .tool').prop('disabled', true);
            app.explorer.explorer('reload');
        });

        var saveHandler = function(){
            if (app.type === null)
                return false;
            if($.trim($('header .tools input').val()).length == 0){
                var text = app.type == 'file' ? 'Sisesta faili nimi!' : 'Sisesta kataloogi nimi!';
                alert(text);
                return false;
            }
            var file = [
                $('header .tools .path span').html(),
                $.trim($('header .tools input').val())
            ].join('');

            if(app.type == 'file'){
                app.saveFile(file,app.editor.getValue(),function(d){
                    app.changed = false;
                    app.current_file = file;
                    app.explorer.explorer('reload');
                    $('header .tools input').prop('readonly',true);
                    $('header .tools .save_file').removeClass('btn-warning').addClass('btn-success');
                });
            }
            else if(app.type == 'directory'){
                app.createDir(file,function(d){
                    app.explorer.explorer('reload');
                    $('header .toggle').toggleClass('hidden');
                    $('header .tool').prop('disabled', true);
                });
            }
        }

        $('header .tools .save_file').on('click',saveHandler);

        $(window).on('keydown', function(event) {
            if(event.which == 13 && $('header .tools input').is(':focus')){
                saveHandler();
            }
            if (event.ctrlKey || event.metaKey) {
                switch (String.fromCharCode(event.which).toLowerCase()) {
                    case 's':
                        event.preventDefault();
                        saveHandler();
                    break;
                }
            }
        });

    })();

});