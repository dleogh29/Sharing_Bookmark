/*! @ 2017, dhlee(dleogh29.github.com) */

(function(global, Bookmark) {
    'use strict';
    
    // ——————————————————————————————————————
    // 변수 정의
    // ——————————————————————————————————————
    var firebase_info = {
        apiKey: 'AIzaSyCd0maVjk2jpM_b9ykibBZXuumd5D1-nY4',
        authDomain: 'visualbookmarks-e737f.firebaseapp.com',
        databaseURL: 'https://visualbookmarks-e737f.firebaseio.com',
        projectId: 'visualbookmarks-e737f',
        storageBucket: 'visualbookmarks-e737f.appspot.com',
        messagingSenderId: '938177183529'
    };
    var document, body, setTimeout;
    var getParent, each;
    var container, header_wrapper, panel_wrapper, main_wrapper;
    var archive_form, archive_select, archive_input_name;
    var folder_form, folder_name_input;
    var bookmark_form, folder_select, bookmark_name_input, bookmark_url_input;
    var delete_form, delete_selected_button, delete_cancel_button;
    var error_message_box, info_message_box, error_message, info_message;
    var archive;

    // ——————————————————————————————————————
    // 그리드 키보드 핸들러
    // ——————————————————————————————————————
    var setGridKeyboardListener = function() {
        window.onkeydown = function(e) {
            if (e.keyCode === 71 && e.shiftKey ) {
                container.classList.toggle('grid');
            }
        }
    };

    // ——————————————————————————————————————
    // 사용자 안내
    // ——————————————————————————————————————
    var showError = function(msg) {
        error_message.innerHTML = msg;
        var style = error_message_box.style;
        style.display = 'block';
        setTimeout(function() {
            style.display = 'none';
        }, 1500);
        throw msg;
    };
    var showInfo = function(msg) {
        info_message.innerHTML = msg;
        var style = info_message_box.style;
        style.display = 'block';
        setTimeout(function() {
            style.display = 'none';
        }, 1500);     
    }

    // ——————————————————————————————————————
    // 북마크 추가
    // ——————————————————————————————————————
    var addBookmarkValidation = function(bookmark_info) {
        if(bookmark_info.archive === 'unselected') {
            showError('저장소를 선택해주세요.');
            return false;
        }
        if(bookmark_info.folder === 'unselected') {
            showError('폴더를 선택해주세요.');
            return false;
        }
        if(bookmark_info.name.trim() === '') {
            showError('북마크명을 입력해주세요.');
            return false;
        }

        var url = bookmark_info.url.trim();
        if(url === '') {
            showError('북마크 URL을 입력해주세요.');
            return false;
        }

        return true;
    };
    var addBookmark = function(e) {
        e.preventDefault();
        e.stopPropagation();

        var bookmark_info = {
            archive : archive,
            folder : folder_select.value,
            name : bookmark_name_input.value,
            url : bookmark_url_input.value
        }

        if(addBookmarkValidation(bookmark_info)) {
            // pushDataToDatabase(archive, folder_select, bookmark_name, bookmark_url);
            var bookmark = {
                name: bookmark_info.name,
                url: bookmark_info.url
            };
            Bookmark([bookmark_info.archive, bookmark_info.folder]).addBookmark(bookmark);
            
            bookmark_name_input.value = '';
            bookmark_url_input.value = '';
        }
    };

    // ——————————————————————————————————————
    // 북마크 데이터 렌더링
    // ——————————————————————————————————————
    var bindData = function(archive, bookmarks, action) {
        var template = '';
        var data_folder;
        var is_empty = (main_wrapper.children.length === 0);
        
        // console.log('bookmarks:', bookmarks);

        // console.log('is_empty:', is_empty);
        if(is_empty) {
            template += 
            '<h2 class="archive-heading">' +
                '<i class="fa fa-archive" aria-hidden="true"></i>' +
                archive +
            '</h2>';
        }
        each(bookmarks, function(folder, array) {
            data_folder = folder;
            template +=
            '<div class="folder-bookmark" data-folder="' + folder + '">' + 
                '<h3 class="a11y-hidden">' + folder + '</h3>' +
                '<ul class="bookmark-list">';
            each(array, function(obj) {
                template +=
                    '<li class="bookmark-item" data-key="' + obj.key + '">' +
                        '<a class="bookmark-link" href="' + obj.url + '" target="_blank">' +
                            '<img class="icon-img" alt src="' + obj.icon_url + 
                                '" onerror="this.onload=null;this.onerror=null;this.src=\'images/bookmark.ico\'"' +
                                ' onload="this.onload=null;this.onerror=null;">' + obj.name +
                        '</a>' +
                        '<button type="button" class="delete-button" aria-label="북마크 삭제">' +
                            '<i class="fa fa-trash fa-1x" aria-hidden="true"></i>' + 
                        '</button>' +
                        '<button type="button" class="check-button" aria-label="삭제할 북마크 선택">' +
                            '<i class="fa fa-check fa-1x" aria-hidden="true"></i>' + 
                        '</button>' +
                    '</li>';
            });
            template +=
                '</ul>' +
                '<div class="folding-wrapper">' +
                    '<button class="folding-button" type="button" aria-label="폴더 접기">' +
                        '<i class="fa fa-folder-open-o" aria-hidden="true"></i>' +
                        folder +
                    '</button>' +
                    '<button type="button" class="delete-button" aria-label="폴더 삭제">' +
                        '<i class="fa fa-trash fa-1x" aria-hidden="true"></i>' + 
                    '</button>' +
                    '<button type="button" class="check-button" aria-label="삭제할 폴더 선택">' +
                        '<i class="fa fa-check fa-1x" aria-hidden="true"></i>' + 
                    '</button>' +
                '</div>'
            '</div>';
        });

        if(action === 'removed') {
            (data_folder) && (template = '');
            (!data_folder) && (main_wrapper.innerHTML = '');
        }

        if(is_empty) {
            main_wrapper.innerHTML = template;
        } else {

            var div = main_wrapper.querySelector('[data-folder="' + data_folder + '"]');
            if(div) {
                div.outerHTML = template;
            } else {
                main_wrapper.insertAdjacentHTML('beforeend', template);
            }

        }
    };
    var renderList = function(data) {
        // console.log('data.key:', data.key);
        // console.log('data.val():', data.val());
        var action = this;
        // console.log('action:', action);
        Bookmark(data.key, data.val()).renderBookmarkList(bindData, action);
        setFolderList(data.key, action);
    };
    var renderBookmarks = function() {
        archive = this.value;

        main_wrapper.innerHTML = '';
        setDeleteMode(false);
        // (archive === 'unselected') && setFolderList(null);
        setFolderList(null);

        var selected_archive = (archive === 'unselected') ? null : archive;
        Bookmark(selected_archive).setArchiveListener(renderList);
    };

    // ——————————————————————————————————————
    // 저장소 추가/삭제
    // ——————————————————————————————————————
    var deleteArchive = function() {
        Bookmark(archive).deleteArchive();
        archive = 'unselected';
        archive_select.remove(archive_select.selectedIndex);
        archive_select.value = 'unselected';
    };
    var addArchive = function(archive_name) {
        Bookmark(archive_name).getBookmarks(function(data) {
            if(!data.val()) {
                Bookmark(archive_name).addArchive();
                var option = '<option value="' + archive_name + '">' + archive_name + '</option>';
                archive_select.insertAdjacentHTML('beforeend', option);
                archive_select.value = 'unselected';
                showInfo(archive_name + ' 저장소가 생성되었습니다.');
            }
            else showError('이미 존재하는 저장소명 입니다.');
        });
        
    };
    var manageArchive = function(e) {
        e.preventDefault();
        // var form = e.currentTarget;
        var className = e.target.className;

        // console.log('e.target:', e.target);
        var archive_name = archive_input_name.value.trim();
        if(className === 'archive-add-btn') {
            if(archive_name === '') {
                showError('저장소명을 입력해야합니다.');
                return;
            } else {
                addArchive(archive_name);
                archive_input_name.value = '';
            }
            
        } else if(className === 'archive-del-btn') {
            if(archive === 'unselected') showError('삭제할 저장소를 선택해주세요.');
            else deleteArchive();
        }
    };
    /* var addArchive = function(archive_name) {
        Bookmark(archive_name).addArchive();
        var option = '<option value="' + archive_name + '">' + archive_name + '</option>';
        archive_select.insertAdjacentHTML('beforeend', option);
        archive_select.value = 'unselected';
        showInfo(archive_name + ' 저장소가 생성되었습니다.');
    };
    var manageArchive = function(e) {
        e.preventDefault();
        // var form = e.currentTarget;
        var className = e.target.className;

        var archive_name = archive_input_name.value.trim();
        if(className === 'archive-add-btn') {
            if(archive_name === '') {
                showError('저장소명을 입력해야합니다.');
                return;
            } else {
                Bookmark(archive_name).getBookmarks(function(data) {
                    if(!data) addArchive(archive_name);
                    else showError('이미 존재하는 저장소명 입니다.');
                });
                archive_input_name.value = '';
            }
            
        } else if(className === 'archive-del-btn') {
            if(archive === 'unselected') showError('삭제할 저장소를 선택해주세요.');
            else deleteArchive();
        }
    }; */

    // ——————————————————————————————————————
    // 폴더 추가
    // ——————————————————————————————————————
    var validateFolderName = function(folder_name) {

        if(archive === 'unselected') {
            showError('폴더를 추가할 저장소를 선택해주세요.');
            return false;
        }
        if(folder_name === '') {
            showError('추가할 폴더명을 입력해주세요.');
            return false;
        }

        return true;
    };
    var addFolder = function(e) {
        e.preventDefault();
        e.stopPropagation();

        var folder_name = folder_name_input.value.trim();
        folder_name_input.value = '';
        if(validateFolderName(folder_name)) {
            var bookmark = Bookmark([archive, folder_name]);
            bookmark.getBookmarks(function(data) {
                // console.log('----------------data.val():', data.val());
                if(!data.val()) {
                    bookmark.addFolder();
                } else {
                    showError('이미 존재하는 폴더명 입니다.');
                }
            });
        }
    };
    var setFolderList = function(folder_name, action) {
        if(!folder_name) {
            var options = folder_select.querySelectorAll('option');
            each(options, function(item, index) {
                (index !== 0) && folder_select.removeChild(item);
            });
        }
        if(folder_name === 'Created Time') return;
        if(action === 'added') {
            var template = '<option value="' + folder_name + '">' + folder_name + '</option>';
            folder_select.insertAdjacentHTML('beforeend', template);
        } 
        if(action === 'removed') {
            var option = folder_select.querySelector('option[value="' + folder_name + '"]');
            folder_select.removeChild(option);
        }
    }
    
    // ——————————————————————————————————————
    // 북마크 삭제
    // ——————————————————————————————————————
    var setDeleteMode = function(is_delete_mode) {
        var m_classList = main_wrapper.classList;
        if(is_delete_mode) {
            m_classList.add('is-delete-mode');
        } else {
            m_classList.remove('is-delete-mode');
            var checked_list = main_wrapper.querySelectorAll('.is-checked');
            cancelCheckedList(checked_list);
        }
    }
    var isDeleteMode = function() {
        return main_wrapper.classList.contains('is-delete-mode');
    }
    var cancelCheckedList = function(list) {
        each(list, function(item) {
            item.classList.remove('is-checked');
        });
    }
    var deleteCheckedBookmarks = function(e) {
        e.preventDefault();
        e.stopPropagation();

        var className = e.target.className;
        var checked_list = main_wrapper.querySelectorAll('.folder-bookmark .is-checked');
        if(className === 'delete-selected-button' && isDeleteMode()) {
            (checked_list.length === 0) && showError('삭제할 북마크를 선택해주세요.')

            var deleted_bookmarks = [];
            each(checked_list, function(item) {
                deleted_bookmarks.push({
                    key : item.dataset.key,
                    folder : getParent(item, 'folder-bookmark').dataset.folder
                });
            });
            Bookmark(archive).deleteBookmarks(deleted_bookmarks);
        } else if(className === 'delete-cancel-button') {
            cancelCheckedList(checked_list);
        }
    }
    var deleteBookmark = function(delete_button) {
        var key = getParent(delete_button, 'bookmark-item').dataset.key;
        var folder = getParent(delete_button, 'folder-bookmark').dataset.folder;
        // console.log('key: %s, folder: %s', key, folder);
        if(!key) {
            Bookmark([archive, folder]).deleteFolder();
        } else {
            Bookmark([archive, folder]).deleteBookmarks(key);
        }
    }

    // ——————————————————————————————————————
    // 북마크 리스트 접기/펼치기
    // ——————————————————————————————————————
    var foldBookmarkList = function(fold_button) {
        var folder_wrapper = getParent(fold_button, 'folder-bookmark');
        var p_classlist = folder_wrapper.classList;
        var folding_button = folder_wrapper.querySelector('.folding-button');
        var i_classList = folding_button.firstChild.classList;

        p_classlist.toggle('is-close');
        i_classList.toggle('fa-folder-open-o');
        i_classList.toggle('fa-folder-o');

        if(p_classlist.contains('is-close')) {
            folding_button.setAttribute('aria-label', '폴더 펼치기');
        } else {
            folding_button.setAttribute('aria-label', '폴더 접기');
        }
    }

    // ——————————————————————————————————————
    // 메인 컨텐츠 이벤트 핸들러(동적 컨텐츠)
    // ——————————————————————————————————————
    var mainContentsEventHandler = function(e) {
        e.stopPropagation();
        var target = e.target;
        var classList = target.classList;

        // 북마크 리스트 접기/펼치기 버튼
        if(classList.contains('folding-button') || classList.contains('fa-folder-open-o')
            || classList.contains('fa-folder-o')) {
            foldBookmarkList(target);
        }
        // 북마크 삭제 버튼
        else if(classList.contains('delete-button') || classList.contains('fa-trash')) {
            deleteBookmark(target);
        }
        // 북마크 체크 버튼(삭제를 위한 체크)
        else if(classList.contains('check-button') || classList.contains('fa-check')) {
            var bookmark_item = getParent(target, 'bookmark-item');

            // 폴더 체크시
            if(bookmark_item === body) {
                var folder_bookmark = getParent(target, 'folder-bookmark');
                folder_bookmark.querySelector('.folding-wrapper').classList.toggle('is-checked');
                each(folder_bookmark.querySelectorAll('.bookmark-item'), function(item) {
                    item.classList.toggle('is-checked'); 
                });
            }
            // 북마크 체크시
            else {
                bookmark_item.classList.toggle('is-checked');
            }
        }
    };

    // ——————————————————————————————————————
    // 저장소 목록 초기화(input select)
    // ——————————————————————————————————————
    var setArchiveList = function() {
        Bookmark().getArchiveList(function(list) {
            // <option value="FDS">FDS</option>
            var template = '';
            list.forEach(function(item) {
                template += '<option value="' + item + '">' + item + '</option>';
            });
            archive_select.insertAdjacentHTML('beforeend', template);
        });
    };

    // ——————————————————————————————————————
    // 메인 탭 핸들러
    // ——————————————————————————————————————
    var changeMainTab = function(e) {
        var id = e.target.parentNode.id;
        var active_panel = panel_wrapper.querySelector('[aria-labelledby="' + id + '"]');
        Bookmark.radioClass(active_panel, 'active');

        (id === 'delete' && archive !== 'unselected') && setDeleteMode(true);

        (id !== 'delete' && isDeleteMode()) && setDeleteMode(false);
    };

    // ——————————————————————————————————————
    // 리스너 설정
    // ——————————————————————————————————————
    var setEventListener = function() {
        // for managing archive
        archive_form.addEventListener('click', manageArchive);
        archive_select.addEventListener('change', renderBookmarks);

        // for adding folder
        folder_form.addEventListener('submit', addFolder);

        // for adding bookmark
        bookmark_form.addEventListener('submit', addBookmark);

        // for main tab
        var menu_list = header_wrapper.querySelector('.menu-list');
        menu_list.addEventListener('click', changeMainTab);

        // for fold button
        // for delete bookmark
        main_wrapper.addEventListener('click', mainContentsEventHandler);

        delete_form.addEventListener('click', deleteCheckedBookmarks);

        // for toggling grid
        setGridKeyboardListener();
    };

    // ——————————————————————————————————————
    // 초기화
    // ——————————————————————————————————————
    var init = function() {
        document = global.document;
        body = document.body;
        setTimeout = global.setTimeout;

        getParent = Bookmark.getParent;
        each = Bookmark.each;

        container = document.querySelector('.container');
        panel_wrapper = container.querySelector('.panel-wrapper');
        header_wrapper = container.querySelector('.header-wrapper');
        main_wrapper = container.querySelector('.main-wrapper');

        archive_form = panel_wrapper.querySelector('.archive-form');
        archive_select = archive_form.querySelector('.archive-select');
        archive_input_name = archive_form.querySelector('.archive-name-input');

        folder_form = panel_wrapper.querySelector('.folder-form');
        folder_name_input = folder_form.querySelector('.folder-name-input');

        bookmark_form = panel_wrapper.querySelector('.bookmark-form');
        folder_select = bookmark_form.querySelector('.folder-select');
        bookmark_name_input = bookmark_form.querySelector('.bookmark-name-input');
        bookmark_url_input = bookmark_form.querySelector('.bookmark-url-input');

        delete_form = panel_wrapper.querySelector('.delete-form');
        delete_selected_button = delete_form.querySelector('.delete-selected-button');
        delete_cancel_button = delete_form.querySelector('.delete-cancel-button');

        var info_container = container.querySelector('.info-container');
        error_message_box = info_container.querySelector('.error-message-box');
        info_message_box = info_container.querySelector('.info-message-box');
        error_message = info_container.querySelector('.error-message');
        info_message = info_container.querySelector('.info-message');

        archive = 'unselected';
        
        Bookmark.initFirebase(firebase_info);

        setArchiveList();
        setEventListener();
    };

    init();

})(window, window.Bookmark);