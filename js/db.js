
var DB = (function(global, firebase) {
    'use strict';
    
    // 의존성 체크
    if(!firebase) {
        throw 'firebase.js 모듈을 먼저 로드해야 합니다.';
    }

    // private 변수 선언
    var is_initialized = false;
    var db_root_ref;

    // 함수 선언
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
    function isType(data, data_type) {
        validate(data_type, 'string', 'data_type 전달 인자는 문자열이 전달되어야 합니다');
        return type(data) === data_type;
    };
    var init = function(config) {
        validate(config, 'object', '전달인자로 객체만 허용합니다.');
        firebase.initializeApp(config);
        db_root_ref = firebase.database().ref();
    };
    var pushData = function(obj) {
        validate(obj, 'object', '전달인자로 객체만 허용합니다.');
        this.ref.push(obj);
    };
    var getData = function(callback) {
        validate(callback, 'function', '첫 번째 인자는 함수이어야 합니다.');
        this.ref.once('value').then(callback);
    };
    var getDate = function() {
        return (new Date()).toString().match(/.*(?=\sGMT)/)[0];
    };
    var addReference = function() {
        this.ref.set({'Created Time' : getDate()});
    };
    var removeReference = function(arr) {
        if(!arr) {
            this.ref.remove();
        } else {
            validate(arr, 'array', '전달인자로 배열만 허용합니다.');
            var updates = {};
            arr.forEach(function(obj) {
                var ref = '/' + obj.folder + '/' + (obj.key || '');
                updates[ref] = null;
                // console.log('ref:', ref);
            });
            // updates['/posts/' + newPostKey]

            this.ref.update(updates);
        }
    };
    var on = function(event, callback) {
        this.ref.on(event, callback);
    };
    var off = function(event, callback) {
        this.ref.off(event, callback);
    };

    var DB = function(arg) {
        // new 연산자 명시 안했을 경우의 처리(new 강제화하지 않는 패턴)
        // 'use strict'; 선언으로 new 연산자 사용없이 함수 호출시 this는 null
        // this가 null 일 경우 this.constructor !== DB 구문으로 객체 타입 체크 불가
        if(!(this instanceof DB)) {
            return new DB(arg);
        }

        // 1. 인자를 전달하지 않았을 경우
        if(!arg) {
            this.ref = db_root_ref;
            return this;
        }

        // 2. 인자가 객체인 경우(initialize)
        if(!is_initialized && isType(arg, 'object')) {
            init(arg);
            console.log('firebase initialized');
            is_initialized = true;
            return this;
        }

        // 3. 인자가 문자열인 경우
        if(isType(arg, 'string')) {
            this.ref = db_root_ref.child(arg);
            return this;
        }

        // 4. 인자가 배열인 경우
        if(isType(arg, 'array')) {
            var ref = db_root_ref;
            arg.forEach(function(item) {
                ref = ref.child(item);
            });
            this.ref = ref;
            return this;
        }
    };

    DB.prototype = {
        constructor : DB,
        pushData : pushData,
        getData : getData,
        addReference : addReference,
        removeReference : removeReference,
        on : on,
        off : off
    };

    return DB;

})(window, window.firebase);