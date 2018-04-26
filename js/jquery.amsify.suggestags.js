/**
 * Amsify Jquery Select 1.1
 * https://github.com/amsify42/jquery.amsify.suggestags
 * http://www.amsify42.com
 */
(function($) {

    $.fn.amsifySuggestags = function(options) {
        /**
         * Merging default settings with custom
         * @type {object}
         */
        var settings = $.extend({
            type        : 'bootstrap',
            tagLimit    : 5,
            whiteList   : [],
        }, options);

        /**
         * Initialization begins from here
         * @type {Object}
         */
        var AmsifySuggestags = function() {
            this.selector      = null;
            this.name          = null;
            this.defaultLabel  = 'Type here to add';
            this.classes       = {
              sTagsArea     : '.amsify-suggestags-area',
              inputArea     : '.amsify-suggestags-input-area',
              inputAreaDef  : '.amsify-suggestags-input-area-default',
              focus         : '.amsify-focus',
              sTagsInput    : '.amsify-suggestags-input',
              listArea      : '.amsify-suggestags-list',
              list          : '.amsify-list',
              listItem      : '.amsify-list-item',
              itemPad       : '.amsify-item-pad',
              inputType     : '.amsify-select-input',
              tagItem       : '.amsify-select-tag',
              removeTag     : '.amsify-remove-tag',
              readyToRemove : '.ready-to-remove',
           };
           this.selectors     = {
              sTagsArea     : null,
              inputArea     : null,
              inputAreaDef  : null,
              sTagsInput    : null,
              listArea      : null,
              list          : null,
              listGroup     : null,
              listItem      : null,
              itemPad       : null,
              inputType     : null,
           };
           this.tagNames = [];
        };

        AmsifySuggestags.prototype = {
            /**
             * Executing all the required settings
             * @param  {selector} form
             */
            _init : function(selector) {
                this.selector   = selector;
                this.name       = ($(selector).attr('name'))? $(selector).attr('name')+'_amsify': 'amsify_suggestags';
                this.createHTML();
                this.setEvents();
                $(this.selector).hide();
                this.setDefault();
            },

            createHTML : function() {
              var HTML                      = '<div class="'+this.classes.sTagsArea.substring(1)+'"></div>';
              this.selectors.sTagsArea      = $(HTML).insertAfter(this.selector);
              var labelHTML                 = '<div class="'+this.classes.inputArea.substring(1)+'"></div>';
              this.selectors.inputArea      = $(labelHTML).appendTo(this.selectors.sTagsArea);

              var sTagsInput                = '<input type="text" class="'+this.classes.sTagsInput.substring(1)+'" placeholder="'+this.defaultLabel+'">';
              this.selectors.sTagsInput     = $(sTagsInput).appendTo(this.selectors.inputArea);

              var listArea              = '<div class="'+this.classes.listArea.substring(1)+'"></div>';
              this.selectors.listArea   = $(listArea).appendTo(this.selectors.sTagsArea);
              $(this.selectors.listArea).width($(this.selectors.sTagsArea).width()-3);

              /**
               * If searchable
               */
              if(this.isSearchable) {
                var searchArea            = '<div class="'+this.classes.searchArea.substring(1)+'"></div>';
                this.selectors.searchArea = $(searchArea).appendTo(this.selectors.listArea);

                var search                = '<input type="text" class="'+this.classes.search.substring(1)+'" placeholder="Search here..."/>';
                this.selectors.search     = $(search).appendTo(this.selectors.searchArea);
              }

              var list                  = '<ul class="'+this.classes.list.substring(1)+'"></ul>';
              this.selectors.list       = $(list).appendTo(this.selectors.listArea);
              $(this.createList()).appendTo(this.selectors.list);
              this.fixCSS();
            },           

            setEvents : function() {
              var _self = this;
              $(this.selectors.inputArea).attr('style', $(this.selector).attr('style'))
                                         .addClass($(this.selector).attr('class'));
              $(this.selectors.sTagsInput).focus(function(){
                $(this).closest(_self.classes.inputArea).addClass(_self.classes.focus.substring(1));
                if(settings.type == 'materialize') {
                  $(this).css({
                    'border-bottom': 'none',
                    '-webkit-box-shadow': 'none',
                    'box-shadow': 'none',
                  });
                }
              });
              $(this.selectors.sTagsInput).blur(function(){
                $(this).closest(_self.classes.inputArea).removeClass(_self.classes.focus.substring(1));
              });
              $(this.selectors.sTagsInput).keyup(function(e){
                var keycode = (e.keyCode ? e.keyCode : e.which);
                if(keycode == '13' || keycode == '188') {
                   var value = $.trim($(this).val().replace(/,/g , ''));
                   $(this).val('');
                  _self.addTag(value);
                } else if(keycode == '8' && !$(this).val()) {
                  var removeClass = _self.classes.readyToRemove.substring(1);
                  if($(this).hasClass(removeClass)) {
                    $item = $(this).closest(_self.classes.inputArea).find(_self.classes.tagItem+':last');
                    _self.removeTag($item);
                    $(this).removeClass(removeClass);
                  } else {
                    $(this).addClass(removeClass);
                  }
                } else if(settings.whiteList.length) {
                  _self.processWhiteList(keycode, $(this).val());
                }
              });
              $(window).resize(function(){
                $(_self.selectors.listArea).width($(_self.selectors.sTagsArea).width()-3);
              });
              $(this.selectors.sTagsArea).click(function(){
                $(_self.selectors.sTagsInput).focus();
              });
              $(this.selectors.listArea).find(this.classes.listItem).hover(function(){
                $(_self.selectors.listArea).find(_self.classes.listItem).removeClass('active');
                $(this).addClass('active');
                $(_self.selectors.sTagsInput).val($(this).data('val'));
              }, function() {
                 $(this).removeClass('active');
              });
              $(this.selectors.listArea).find(this.classes.listItem).click(function(){
                 _self.addTag($(this).data('val'));
                 $(_self.selectors.sTagsInput).val('').focus();
              });
              this.setRemoveEvent();
            },

            processWhiteList : function(keycode, value) {
              if(keycode == '40' || keycode == '38') {
                var type = (keycode == '40')? 'down': 'up';
                this.upDownSuggestion(value, type);
              } else {
                this.suggestWhiteList(value);
              }
            },

            upDownSuggestion : function(value, type) {
              var _self     = this;
              var isActive  = false;
              $(this.selectors.listArea).find(this.classes.listItem+':visible').each(function(){
                   if($(this).hasClass('active')) {
                    $(this).removeClass('active');
                      if(type == 'up') {
                        $item = $(this).prevAll(_self.classes.listItem+':visible:first');
                      } else {
                        $item = $(this).nextAll(_self.classes.listItem+':visible:first');
                      }
                      if($item.length) {
                        isActive = true;
                        $item.addClass('active');
                        $(_self.selectors.sTagsInput).val($item.data('val'));
                      }
                    return false;
                   }
              });
              if(!isActive) {
                var childItem = (type == 'down')? 'first': 'last';
                $item = $(this.selectors.listArea).find(this.classes.listItem+':visible:'+childItem);
                if($item.length) {
                  $item.addClass('active');
                  $(_self.selectors.sTagsInput).val($item.data('val'));
                }
              }
            },

            suggestWhiteList(value) {
              var found = false;
              $(this.selectors.listArea).find(this.classes.listItem).each(function(){
                if(~$(this).text().toLowerCase().indexOf(value)) {
                  $(this).show();
                  found = true;
                } else {
                  $(this).hide();
                }
              });
              if(found)
                $(this.selectors.listArea).show();
              else
                $(this.selectors.listArea).hide();
            },

            setDefault : function() {
              var _self = this;
              var items = $(this.selector).val().split(',');
              if(items.length) {
                $.each(items, function(index, item){
                  _self.addTag($.trim(item));
                });
              }
            },

            setRemoveEvent: function() {
              var _self = this;
              $(this.selectors.inputArea).find(this.classes.removeTag).click(function(e){
                  e.stopImmediatePropagation();
                  $tagItem = $(this).closest(_self.classes.tagItem);
                  _self.removeTag($tagItem);
              });
            },

            createList : function() {
              var _self     = this;
              var listHTML  = '';
              $.each(settings.whiteList, function(index, item){
                  listHTML += '<li class="'+_self.classes.listItem.substring(1)+'" data-val="'+item+'">'+item+'</li>';
              });
              return listHTML;
            },

            addTag : function(value) {
              if(!value) return;
              this.tagNames.push(value);
              var html  = '<span class="'+this.classes.tagItem.substring(1)+'">'+value+' '+this.setIcon()+'</span>';
              $(html).insertBefore($(this.selectors.sTagsInput));
              this.setRemoveEvent();
              this.setInputValue();
              $(this.selectors.listArea).find(this.classes.listItem).removeClass('active');
              $(this.selectors.listArea).hide();
            },

            removeTag : function(item) {
              this.tagNames.splice($(item).index(), 1);
              $(item).remove();
              this.setInputValue();
            },

            setIcon : function() {
              var removeClass = this.classes.removeTag.substring(1);
              if(settings.type == 'bootstrap') {
                return '<span class="fa fa-times '+removeClass+'"></span>';
              } else if(settings.type == 'materialize') {
                return '<i class="material-icons right '+removeClass+'">clear</i>';
              } else {
                return '<b class="'+removeClass+'">X</b>';
              }
            },

            setInputValue: function() {
              $(this.selector).val(this.tagNames.join(','));
              console.info(this.tagNames, $(this.selector).val());
            },

            fixCSS : function() {
              if(settings.type == 'amsify') {
                $(this.selectors.inputArea).addClass(this.classes.inputAreaDef.substring(1)).css({'padding': '5px 5px'});
              } else if(settings.type == 'materialize') {
                $(this.selectors.inputArea).addClass(this.classes.inputAreaDef.substring(1)).css({'height': 'auto', 'padding': '5px 5px'});
                $(this.selectors.sTagsInput).css({'margin': '0', 'height': 'auto'});
              }
            },
           
        };
        
        /**
         * Initializing each instance of selector
         * @return {object}
         */
        return this.each(function() {
            (new AmsifySuggestags)._init(this);
        });

    };

}(jQuery));