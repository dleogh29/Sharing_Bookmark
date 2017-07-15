var Bookmark = (function(global, DB) {
    'use strict';

    // 의존성 체크
    if(!DB) {
        throw 'db.js 모듈을 먼저 로드해야 합니다.';
    }

    var document = global.document;
    var body = document.body;
    var toString = Object.prototype.toString;
    var slice = Array.prototype.slice;
    var str_create_time = 'Created Time';
    var state = {
        current_archive : null,
        previous_archive : null,
        folder : null
    };

    var type = function(data) {
        return toString.call(data).slice(8, -1).toLowerCase();
    };
    var validate = function(data, compare_data_type, throw_message) {
        if( type(data) === compare_data_type ) {
            return true;
        } else {
            throw throw_message;
        }
    };
    var isType = function(data, data_type) {
        validate(data_type, 'string', 'data_type 전달 인자는 문자열이 전달되어야 합니다');
        return type(data) === data_type;
    };
    var makeArray = function(o) {
        return slice.call(o);
    };
    var mixin = function() {
        var args = makeArray(arguments);
        for (var i=0, l=args.length; i<l; i++) {
            if ( !isType(args[i], 'object') && !isType(args[i], 'function') ) {
                throw '전달인자로 객체만 허용합니다.';
            }
        }
        var mixin_obj = args.shift();
        var next = args.shift();
        do {
            for ( var prop in next ) {
                if ( next.hasOwnProperty(prop) ) {
                    mixin_obj[prop] = next[prop];
                }
            }
            next = args.shift();
        } while ( next );

        return mixin_obj;
    };
    var each = function(o, callback) {
        validate(callback, 'function');
        if ( !isType(o, 'object') && o.length ) {
            o = makeArray(o);
        }
        isType(o, 'array') && o.forEach(callback);
        if ( isType(o, 'object') ) {
            for ( var prop in o ) {
                o.hasOwnProperty(prop) && callback(prop, o[prop], o);
            }
        }
        if ( o.nodeType === 1 ) {
            for ( var prop in o ) {
                callback(prop, o[prop], o);
            }
        }
    };
    var radioClass = function(el, name){
        var node_with_class = el.parentNode.querySelector('.' + name);
        if(node_with_class) {
            node_with_class.classList.remove(name);
        } 
        el.classList.add(name);
    };
    var getParent = function(target, className) {
        do {
            target = target.parentNode;
        } while(!target.classList.contains(className) && !(target === body));

        return target;
    }

    var addArchiveListener = function(callback) {
        console.log('state.current_archive:', state.current_archive);
        console.log('state.previous_archive:', state.previous_archive);

        console.log('add');
        DB(state.current_archive).on('child_added', callback);
        DB(state.current_archive).on('child_changed', callback);
        DB(state.current_archive).on('child_removed', callback);

        (state.previous_archive) && removeArchiveListener();
    };
    var removeArchiveListener = function() {
        console.log('remove');
        DB(state.previous_archive).off();
        DB(state.previous_archive).off();
        DB(state.previous_archive).off();
    };
    var checkIconImage = function(url, callback) {
        var image = new Image();
        image.src = url;
        image.onerror = callback;
    }
    var setBookmarkIcon = function() {
        var icon_url_regex = /^http[s]*:\/\/[^/]+(?=\/)*/;
        each(this.bookmarks, function(key, array) {
            each(array, function(bookmark) {
                var url = bookmark.url;
                var icon_url = url.match(icon_url_regex)[0] + '/favicon.ico';
                bookmark.icon_url = icon_url;
                checkIconImage(icon_url, function() {
                    // console.log('not found');
                    bookmark.icon_url = '../images/bookmark.ico';
                });
            });
        });
        console.log('this.bookmarks:', this.bookmarks);
    };
    var renderBookmarkList = function(callback) {
        setBookmarkIcon.call(this);
        console.log('this.bookmarks:', this.bookmarks);
        callback(state.current_archive, this.bookmarks);
    };
    var correctURL = function(bookmark) {
        var url = bookmark.url;
        var url_check_regexp = /^http[s]*:\/\//;

        if(!url_check_regexp.test(url)) {
            bookmark.url = 'http://' + url;
            console.log('통과');
        }
    };
    var addBookmark = function(bookmark) {
        correctURL(bookmark);
        DB([state.current_archive, state.folder]).pushData(bookmark);
    };
    var getArchiveList = function(callback) {
        var archive_list = [];
        DB().getData(function(snapshot) {
            each(snapshot.val(), function(key) {
                archive_list.push(key);
            });
            callback(archive_list);
        });
    };
    var getBookmarks = function(callback) {
        if(state.current_archive && state.folder) {

            (new Promise(function(resolve, reject) {
                DB([state.current_archive, state.folder]).getData(function(snapshot) {
                    resolve(snapshot.val());
                });
            })).then(callback);

        }
    };
    var addArchive = function() {
        DB(state.current_archive).addReference();
        // addArchiveListener();
    };
    var deleteArchive = function() {
        console.log('delete');

        DB(state.current_archive).deleteReference();
    };
    var initFirebase = function(obj) {
        DB(obj);
    };
    var addFolder = function() {
        DB([state.current_archive, state.folder]).addReference();
    };

    var Bookmark = function(param1, param2) {
        if(!(this instanceof Bookmark)) {
            return new Bookmark(param1, param2);
        }

        // 1. 저장소 세팅
        if(isType(param1, 'string') && !param2) {
            if(state.current_archive !== param1) {
                state.previous_archive = state.current_archive;
                state.current_archive = param1;
            }
            return this;
        }

        // 2. 저장소 또는 폴더 추가/삭제 (param1 - 배열)
        if(isType(param1, 'array')) {
            // 1일 경우 저장소
            if(param1.length === 1) {

            }
            // 1보다 큰 경우 폴더
            else if(param1.length > 1) {
                state.current_archive = param1[0];
                state.folder = param1[1];
            }
            return this;
        }


        // 3. 저장소의 전체 북마크 데이터
        if(isType(param1, 'object')) {
            this.bookmarks = {};

            var that = this;
            each(param1, function(folder_name, key_obj) {
                console.log('folder_name:', folder_name);
                var arr = that.bookmarks[folder_name] = [];
                each(key_obj, function(key, value) {
                    mixin(value, {'key': key});
                    arr.push(value);
                });
            });

            return this;
        }

        // {
        //     "HTML": [
        //         {
        //             key: "asdad",
        //             name: "name",
        //             url: "url"
        //         },
        //     ]

        // }
        // 4. 폴더별 북마크 데이터
        if(isType(param1, 'string') && isType(param2, 'object')) {
            this.bookmarks = {};
            var arr = this.bookmarks[param1] = [];
            var that = this;
            each(param2, function(key, obj) {
                if(key !== str_create_time) {
                    mixin(obj, {'key': key});
                    arr.push(obj);
                }
            });
            console.log('this:', this);
            return this;
        }

        if(isType(param1, 'string') && isType(param2, 'string')) {
            this.bookmarks = {};
            return this;
        }

        // 5. 데이터가 없을 때
        if(!param1 && !param2) {
            this.bookmarks = {};
            return this;
        }

    };
    Bookmark.prototype = {
        constructor : Bookmark,
        renderBookmarkList : renderBookmarkList,
        addArchiveListener : addArchiveListener,
        removeArchiveListener : removeArchiveListener,
        addBookmark : addBookmark,
        getArchiveList : getArchiveList,
        addArchive : addArchive,
        deleteArchive : deleteArchive,
        getBookmarks : getBookmarks,
        addFolder : addFolder
    };
    Bookmark.include = function(obj) {
        mixin(Bookmark, obj);
    };
    Bookmark.include({
        each : each,
        isType : isType,
        radioClass : radioClass,
        getParent : getParent,
        initFirebase : initFirebase
    });
    
    return Bookmark;
})(window, window.DB);