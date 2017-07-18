# 북마크 공유
> 여러 사람들과 북마크를 공유하기 위한 서비스  
> 인증(로그인) 없이 모든 사람들이 추가/삭제 가능

## 용어
 - 저장소 : 북마크가 저장되는 독립적인 공간
 - 폴더 : 저장소 내 북마크의 분류를 위한 공간
 - 북마크 : 이름, URL 정보를 가진 링크

## 상세 기능
 - 저장소,폴더,북마크 추가 및 삭제
 - 폴더,북마크 다중 삭제
 - 저장소내 데이터 실시간 업데이트 (타인이 수정시 즉시 반영)

## 사용 기술
 - HTML, SCSS, Javascript
 - Firebase

## 링크
  - [Sharing Bookmark](https://dleogh29.github.io/Sharing_Bookmark/)

## Firebase 저장소 구조
<pre>
ROOT
 ├ 저장소
 │   ├ 폴더
 │   │  ├ 북마크
 │   │  ├ 북마크
 │   │  └ 북마크
 │   └ 폴더
 │      ├ 북마크
 │      ├ 북마크
 │      └ 북마크
 │
 └ 저장소
     ├ 폴더
     │  ├ 북마크
     │  ├ 북마크
     │  └ 북마크
     └ 폴더
        ├ 북마크
        ├ 북마크
        └ 북마크
</pre>

