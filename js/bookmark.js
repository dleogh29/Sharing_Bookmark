/*! @ 2017, dhlee(dleogh29.github.com) */

var Bookmark = (function(global, DB) {
    'use strict';

    // 의존성 체크
    if(!DB) {
        throw 'db.js 모듈을 먼저 로드해야 합니다.';
    }

    // ——————————————————————————————————————
    // 변수 정의
    // ——————————————————————————————————————
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

    // ——————————————————————————————————————
    // 유틸함수 정의
    // ——————————————————————————————————————
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

    // ——————————————————————————————————————
    // Firebase reference 리스너 추가/삭제
    // ——————————————————————————————————————
    var addArchiveListener = function(callback) {
        DB(state.current_archive).on('child_added', callback.bind("added"));
        DB(state.current_archive).on('child_changed', callback.bind("changed"));
        DB(state.current_archive).on('child_removed', callback.bind("removed"));
    };
    var removeArchiveListener = function() {
        DB(state.previous_archive).off();
    };
    var setArchiveListener = function(callback) {
        validate(callback, 'function', '전달인자로 함수만 허용합니다.');
        // console.log('state.current_archive:', state.current_archive);
        // console.log('state.previous_archive:', state.previous_archive);

        (state.current_archive) && addArchiveListener(callback);
        (state.previous_archive) && removeArchiveListener();
    };

    // ——————————————————————————————————————
    // 북마크 리스트 렌더링
    // ——————————————————————————————————————
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
                // checkIconImage(icon_url, function() {
                //     bookmark.icon_url = '../images/bookmark.ico';
                // });
            });
        });
    };
    var renderBookmarkList = function(callback, action) {
        validate(callback, 'function', '전달인자로 함수만 허용합니다.');

        setBookmarkIcon.call(this);
        callback(state.current_archive, this.bookmarks, action);
    };
    
    // ——————————————————————————————————————
    // 북마크 리스트 getter
    // ——————————————————————————————————————
    var getBookmarks = function(callback) {
        validate(callback, 'function', '전달인자로 함수만 허용합니다.');
        (state.current_archive && state.folder) &&
            DB([state.current_archive, state.folder]).getData(callback);
        

        (state.current_archive && !state.folder) &&
            DB(state.current_archive).getData(callback);
    };
    /* var getBookmarks = function(callback) {
        validate(callback, 'function', '전달인자로 함수만 허용합니다.');
        if(state.current_archive && state.folder) {
            (new Promise(function(resolve, reject) {
                DB([state.current_archive, state.folder]).getData(function(snapshot) {
                    resolve(snapshot.val());
                });
            })).then(callback);

        }

        if(state.current_archive && !state.folder) {
            (new Promise(function(resolve, reject) {
                DB(state.current_archive).getData(function(snapshot) {
                    resolve(snapshot.val());
                });
            })).then(callback);

        }
    }; */

    // ——————————————————————————————————————
    // 북마크 추가/삭제
    // ——————————————————————————————————————
    var checkURL = function(url) {
        var url_check_regexp = /\w+[.]\w+/;
        if(url_check_regexp.test(url)) return true;
        else return false;
    };
    var correctURL = function(bookmark) {
        var url = bookmark.url;
        var url_check_regexp = /^http[s]*:\/\//;

        if(!url_check_regexp.test(url)) {
            bookmark.url = 'http://' + url;
        }
    };
    var addBookmark = function(bookmark) {
        correctURL(bookmark);
        DB([state.current_archive, state.folder]).pushData(bookmark);
    };
    var filterFolder = function(key) {
        var i, o_length = key.length;
        var folders = [];
        for(i = 0; i < o_length; i++) {
            if(!key[i].key) folders.push(key[i].folder);
        }

        var filtered_arr = [];
        var j, f_length = folders.length;

        for(i = 0; i < o_length; i ++) {
            if(!key[i].key) {
                filtered_arr.push(key[i]);
            } else {
                var filter = false;
                for(j = 0; j < f_length; j++) {
                    if(key[i].folder === folders[j]) {
                        filter = true;
                        break;
                    }
                }
                !filter && filtered_arr.push(key[i]);
            }
        }

        return filtered_arr;
    }
    var deleteBookmarks = function(key) {
        if(state.current_archive && state.folder) {
            validate(key, 'string', 'key 값은 문자열이어야 합니다.');
            DB([state.current_archive, state.folder, key]).removeReference();
        } else if(state.current_archive && !state.folder) {
            validate(key, 'array', 'key 값은 배열이어야 합니다.');
            key = filterFolder(key);
            DB(state.current_archive).removeReference(key);
        }
    }

    // ——————————————————————————————————————
    // 저장소 리스트 getter
    // ——————————————————————————————————————
    var getArchiveList = function(callback) {
        validate(callback, 'function', '전달인자로 함수만 허용합니다.');
        var archive_list = [];
        DB().getData(function(snapshot) {
            var all_data = snapshot.val();
            if(all_data) {
                each(all_data, function(key) {
                    archive_list.push(key);
                });

            }
            callback(archive_list);
        });
    };

    // ——————————————————————————————————————
    // 저장소 추가/삭제
    // ——————————————————————————————————————
    var addArchive = function() {
        DB(state.current_archive).addReference();
    };
    var deleteArchive = function() {
        DB(state.current_archive).removeReference();
        state.previous_archive = state.current_archive;
        state.current_archive = null;
        removeArchiveListener();
    };

    // ——————————————————————————————————————
    // 폴더 추가/삭제
    // ——————————————————————————————————————
    var addFolder = function() {
        DB([state.current_archive, state.folder]).addReference();
    };
    var deleteFolder = function() {
        DB([state.current_archive, state.folder]).removeReference();
    }

    // ——————————————————————————————————————
    // Firebase 초기화
    // ——————————————————————————————————————
    var initFirebase = function(obj) {
        DB(obj);
    };

    // ——————————————————————————————————————
    // 생성자 함수 정의
    // ——————————————————————————————————————
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
            state.folder = null;
            return this;
        }

        // 2. 폴더 세팅
        if(isType(param1, 'array')) {
            state.current_archive = param1[0];
            state.folder = param1[1];

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
        // 3. 북마크 데이터 세팅
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
            return this;
        }

        // 4. 데이터가 없을 때
        if(!param1 && !param2) {
            this.bookmarks = {};
            state.previous_archive = state.current_archive;
            state.current_archive = null;
            return this;
        }

        // 5. key값이 'Create Time' 인 경우
        if(param1 === str_create_time) {
            this.bookmarks = {};
            return this;
        }

    };

    // ——————————————————————————————————————
    // prototype 속성 정의
    // ——————————————————————————————————————
    Bookmark.prototype = {
        constructor : Bookmark,
        renderBookmarkList : renderBookmarkList,
        setArchiveListener : setArchiveListener,
        removeArchiveListener : removeArchiveListener,
        addBookmark : addBookmark,
        deleteBookmarks : deleteBookmarks,
        addArchive : addArchive,
        deleteArchive : deleteArchive,
        getArchiveList : getArchiveList,
        getBookmarks : getBookmarks,
        addFolder : addFolder,
        deleteFolder : deleteFolder
    };

    // ——————————————————————————————————————
    // static method 정의
    // ——————————————————————————————————————
    Bookmark.include = function(obj) {
        mixin(Bookmark, obj);
    };
    Bookmark.include({
        each : each,
        isType : isType,
        radioClass : radioClass,
        getParent : getParent,
        initFirebase : initFirebase,
        checkURL : checkURL
    });
    
    // 노출 패턴
    return Bookmark;
})(window, window.DB);