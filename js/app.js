(function(global, Bookmark, DB) {
    'use strict';

    var firebase_info = {
        apiKey: "AIzaSyCd0maVjk2jpM_b9ykibBZXuumd5D1-nY4",
        authDomain: "visualbookmarks-e737f.firebaseapp.com",
        databaseURL: "https://visualbookmarks-e737f.firebaseio.com",
        projectId: "visualbookmarks-e737f",
        storageBucket: "visualbookmarks-e737f.appspot.com",
        messagingSenderId: "938177183529"
    };
    var document;
    var container, header_wrapper, panel_wrapper, main_wrapper;
    var archive_form, archive_select, archive_input_name;
    var folder_form, folder_name_input;
    var bookmark_form, folder_select, bookmark_name_input, bookmark_url_input;


    var setGridKeyboardListener = function() {
        window.onkeydown = function(e) {
            if (e.keyCode === 71 && e.shiftKey ) {
                container.classList.toggle('grid');
            }
        }
    };
    var showError = function(msg) {
        console.log(msg);
    };
    var addBookmarkValidation = function(bookmark_info) {
        if(bookmark_info.archive === "unselected") {
            showError('저장소를 선택해주세요.');
            return false;
        }
        if(bookmark_info.folder === "unselected") {
            showError('폴더를 선택해주세요.');
            return false;
        }
        if(bookmark_info.name.trim() === "") {
            showError('북마크명을 입력해주세요.');
            return false;
        }

        var url = bookmark_info.url.trim();
        if(url === "") {
            showError('북마크 URL을 입력해주세요.');
            return false;
        }

        return true;
    };
    var addBookmark = function(e) {
        e.preventDefault();
        e.stopPropagation();

        var bookmark_info = {
            archive : archive_select.value,
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
            
            bookmark_name_input.value = "";
            bookmark_url_input.value = "";
        }
    };
    var changeMainTab = function(e) {
        var id = e.target.parentNode.id;
        var active_panel = panel_wrapper.querySelector('[aria-labelledby="' + id + '"]');
        Bookmark.radioClass(active_panel, 'active');
    };
    var bindData = function(archive, bookmarks) {
        console.log('archive:', archive);
        var template = '';
        var data_folder;
        var is_empty = (main_wrapper.children.length === 0);
        
        console.log('is_empty:', is_empty);
        if(is_empty) {
            template += 
            '<h2 class="archive-heading">' +
                '<i class="fa fa-archive" aria-hidden="true"></i>' +
                archive +
            '</h2>';
        }
        Bookmark.each(bookmarks, function(folder, array) {
            data_folder = folder;
            template +=
            '<div class="folder-bookmark" data-folder="' + folder + '">' + 
                '<h3 class="a11y-hidden">' + folder + '</h3>' +
                '<ul class="bookmark-list">';
            Bookmark.each(array, function(obj) {
                template +=
                    '<li class="bookmark-item" data-key="' + obj.key + '">' +
                        '<a class="bookmark-link" href="' + obj.url + '" target="_blank">' +
                            '<img class="icon-img" alt src="' + obj.icon_url + 
                                '" onerror="this.onload=null;this.onerror=null;this.src=\'../images/bookmark.ico\'"' +
                                ' onload="this.onload=null;this.onerror=null;">' + obj.name +
                            // '<i class="fa fa-bookmark-o" aria-hidden="true"></i>' +
                            
                        '</a>' +
                        '<button type="button" class="check-button">' +
                            '<i class="fa fa-check fa-1x" aria-hidden="true"></i>' + 
                        '</button>' +
                        '<button type="button" class="delete-button">' +
                            '<i class="fa fa-trash fa-1x" aria-hidden="true"></i>' + 
                        '</button>' +
                    '</li>';
            });
            template +=
                '</ul>' +
                '<button class="folding-button" type="button" aria-label="폴더 접기">' +
                    '<i class="fa fa-folder-open-o" aria-hidden="true"></i>' +
                    folder +
                '</button>' +
            '</div>';
        });


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
        console.log('data.key:', data.key);
        console.log('data.val():', data.val());
        Bookmark(data.key, data.val()).renderBookmarkList(bindData);
    };
    var renderBookmarks = function() {
        console.log('renderBookmarks');
        var archive = this.value;
        console.log('archive:', archive);
        main_wrapper.innerHTML = '';
        if(archive === 'unselected') return;

        Bookmark(archive).addArchiveListener(renderList);
    };
    var deleteArchive = function() {
    };
    var addArchive = function() {
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
                Bookmark(archive_name).addArchive();
                var option = '<option value="' + archive_name + '">' + archive_name + '</option>';
                archive_select.insertAdjacentHTML('beforeend', option);
                archive_select.value = archive_name;
                viewArchive.call(archive_select);
                archive_input_name.value = '';
            }
            
        } else if(className === 'archive-del-btn') {
            var selected_archive = archive_select.value;
            if(selected_archive === 'unselected') {
                showError('삭제할 저장소를 선택해주세요.');
                return;
            } else {
                Bookmark(selected_archive).deleteArchive();
                archive_select.remove(archive_select.selectedIndex);
                archive_select.value = 'unselected';
                viewArchive.call(archive_select);
            }
        }
    };
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
    var validateFolderName = function() {

        if(archive_select.value === 'unselected') {
            showError('폴더를 추가할 저장소를 선택해주세요.');
            return false;
        }
        if(folder_name_input.value.trim() === '') {
            showError('추가할 폴더명을 입력해주세요.');
            return false;
        }

        return true;
    };
    var addFolder = function(e) {
        e.preventDefault();
        e.stopPropagation();

        var folder_name = folder_name_input.value;
        if(validateFolderName(folder_name)) {
            var bookmark = Bookmark([archive_select.value, folder_name]);
            bookmark.getBookmarks(function(data) {
                if(!data) {
                    bookmark.addFolder();
                } else {
                    showError('이미 존재하는 폴더명 입니다.');
                }
            });
        } else {

        }
    };
    var foldBookmarkList = function(e) {
        var target = e.target;
        var classList = target.classList;
        var getParent = Bookmark.getParent;

        console.log('target:', target);

        if(classList.contains('folding-button') || classList.contains('fa-folder-open-o')
            || classList.contains('fa-folder-o')) {
            // e.preventDefault();
            var parentNode = getParent(target, 'folder-bookmark');
            var p_classlist = parentNode.classList;
            var folding_button = parentNode.querySelector('.folding-button');
            var i_classList = folding_button.firstChild.classList;

            p_classlist.toggle('is-close');
            i_classList.toggle('fa-folder-open-o');
            i_classList.toggle('fa-folder-o');

            if(p_classlist.contains('is-close')) {
                folding_button.setAttribute('aria-label', '폴더 펼치기');
            } else {
                folding_button.setAttribute('aria-label', '폴더 접기');
            }
        } else if(classList.contains('delete-button') || classList.contains('fa-trash')) {
            if(global.confirm('해당 항목을 삭제하시겠습니까?')) {
                var list_item = getParent(target, 'bookmark-item');

                console.log('list_item.dataset.key:', list_item.dataset.key);
            } else {

            }
        } else if(classList.contains('check-button') || classList.contains('fa-check')) {

        }
    };

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
        main_wrapper.addEventListener('click', foldBookmarkList);

        // for toggling grid
        setGridKeyboardListener();
    };
    var init = function() {
        document = global.document;
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

        
        Bookmark.initFirebase(firebase_info);

        setArchiveList();
        setEventListener();
    };

    init();

})(window, window.Bookmark, window.DB);


/*var bindAllData = function(archive, bookmarks) {
        var template = 
            '<h2 class="archive-heading">' +
                '<i class="fa fa-archive" aria-hidden="true"></i>' +
                archive +
            '</h2>';

        Bookmark.each(bookmarks, function(folder, array) {
            template +=
            '<div class="folder-bookmark" data-folder="' + folder + '">' + 
                '<h3 class="a11y-hidden">' + folder + '</h3>' +
                '<ul class="bookmark-list">';
            Bookmark.each(array, function(obj) {
                template +=
                    '<li>' +
                        '<a class="bookmark-link" href="' + obj.url + '">' +
                            '<i class="fa fa-bookmark-o" aria-hidden="true"></i>' +
                            obj.name +
                        '</a>' +
                    '</li>';
            });
            template +=
                '</ul>' +
                '<button class="folding-button" type="button" aria-label="폴더 접기/펼치기">' +
                    '<i class="fa fa-folder-open-o" aria-hidden="true"></i>' +
                    folder +
                '</button>' +
            '</div>';
        });
        main_wrapper.innerHTML = template;
    };*/


        // var setDatabaseRefListener = function(archive) {
    //     DB(archive).on('child_added', function(data) {
    //         console.log('added: ', data.key, data.val());
    //         Bookmark(data.key, data.val()).renderBookmarkList(main_wrapper);
    //     });

    //     DB(archive).on('child_changed', function(data) {
    //         console.log('changed:', data.key, data.val());
    //     });

    //     DB(archive).on('child_removed', function(data) {
    //         console.log('removed:', data.key, data.val());
    //     });
    // };