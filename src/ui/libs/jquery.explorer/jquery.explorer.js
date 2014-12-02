;(function($){
    
    var defaults = {
        root : '/',
        script : 'jqueryFileTree.php',
        folderEvent : 'click',
        onafterexplore : function(){},
        ondeleteclick : function(){}
    };
    
    function Explorer(){
        
        this.options = {};
        this.clb = null;
        this.el = null;
        
        this._init = function(arguments) {
            
            _this = this;
            
            this.options = $.extend(defaults, arguments[0]);
            this.clb = arguments[1];
            this.el.addClass('jq-explorer');
            this.el.data({
                'jq-explorer-options': this.options,
                'jq-explorer-clb': this.clb,
                'jq-explorer-path': this.options.root
            });
            this.el.html('<div class="bar directory"></div><ul></ul>');
            
            // Get the initial file list
            this.explore(this.options.root);
            
            this.el.on('mouseover', 'li', function(e){
                $(this).addClass('hover').find('a.tool').stop().removeClass('hidden');
            });
            this.el.on('mouseout', 'li', function(e){
                $(this).removeClass('hover').find('a.tool').addClass('hidden');
            });
            this.el.on('click', 'li a.tool', function(e){
                e.preventDefault();
                _this.options.ondeleteclick.call(_this, $(this).closest('li').find('a[data-path]').attr('data-path'));
            });
            this.el.on(this.options.folderEvent, 'a[data-path]', function(e){
                e.preventDefault();
                $(this).closest('ul').find('li').removeClass('active');
                if( $(this).parent().hasClass('directory') ) {
                    _this.explore($(this).attr('data-path'));
                } else {
                    $(this).parent().addClass('active');
                    _this.clb($(this).attr('data-path'));
                }
            });
            
        };
        
        this.explore = function( t ) {
            
            $.ajax({
                url:this.options.script,
                type:'POST',
                data: {
                    dir: t
                },
                context: this
            })
            .done(function(data){
                this._bindTree(t, data)
            })
            .fail(function() {
                console.log('Unknown error');
            });
            
        };
        
        this._bindTree = function( t, data ) {
            
            _this = this;
            
            if(typeof data == 'object'){
                
                var html = '',
                    links = '',
                    path = '',
                    bar = t.replace(/^\/|\/$/g, '').split('/');
                
                links += '<a href="#" data-path="'+path+'"><i class="glyphicon glyphicon-home"></i></a> /';
                
                for(var i=0, len=bar.length; i<len; i++){
                    if(bar[i].length > 0){
                        path += bar[i] + '/';
                        links += ' <a href="#" data-path="'+path+'">'+bar[i]+'</a> /';
                    }
                }
                   
                this.el.find('div.bar').html(links);
                
                bar.splice(-1,1);
                if(t !== this.options.root){
                    html += '<li class="directory"><a href="#" data-path="'+(bar.length>0?(bar.join('/')+'/'):'')+'">..</a></li>';
                }
                for(var i=0, len=data.length; i<len; i++){
                    html += '<li class="'+data[i].type+' '+data[i].ext+'"><a href="#" data-path="'+data[i].path+'">'+data[i].name+'</a><a href="#" class="tool delete hidden glyphicon glyphicon-trash"></a></li>';
                }
                
            }
            
            this.el.find('ul').html(html?html:data);
            this.el.data({
                'jq-explorer-path': t
            });
            this.options.onafterexplore.apply(this);
            
        };

        this.reload = function(){
            this.options = $(this.el).data('jq-explorer-options');
            this.clb = $(this.el).data('jq-explorer-clb');
            
            this.explore( this.getCurrentPath() );
        };
        
        this.getCurrentPath = function(){
            return $(this.el).data('jq-explorer-path');
        }

    };
    
    $.fn.explorer = function(method) {

        var args = arguments;
        var exp = new Explorer();
        exp.el = $(this);
        
        // call method
        if( exp[method] ) {
            return exp[method]( Array.prototype.slice.call( args, 1 ) );
        }

        return this.each(function() {
            
            // default init
            if( typeof method === 'object' || ! method ){
                return exp._init( args );
            }
            // else
            else {
                $.error( 'Method ' +  method + ' does not exist' );
            }
            
        });

    };
    
}(jQuery));