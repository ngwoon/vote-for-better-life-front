const MAP_LEVEL = 10;
const sgTypes = ["보궐", "대통령", "국회의원", "시도지사", "구시군장", "시도의원", "구시군의회의원", "국회의원비례대표", "광역의원비례대표", "기초의원비례대표", "교육의원", "교육감", "전국동시지방"];
const sdNames = ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"];
const sdToMarkers = [{}, {}];
let votePlaces = [{}, {}];
let clusterer, map;
let loadingInterval = null, count = 0;
let currentPlaceType = 0, currentSdName = "서울특별시";

function getMapBounds(positions) {
    const newBounds = new kakao.maps.LatLngBounds();

    for(position of positions)
        newBounds.extend(new kakao.maps.LatLng(position.lat, position.lng));

    return newBounds;
}

async function makePingOnMap(placeType, sdName) {
    
    if(loadingInterval === null)
        loadingInfoStart();

    let markers = null;
    let bounds = null;
    clusterer.clear();

    if(sdToMarkers[placeType][sdName] !== undefined) {
        markers = sdToMarkers[placeType][sdName].markers;
        bounds = sdToMarkers[placeType][sdName].bounds;
    }
    else {
        // 클러스터러 표현 위한 좌표 데이터 배열
        const data = {
            "positions": [],
        };

        for(let place of votePlaces[placeType][sdName]) {
            if(place.LAT === "0")
                continue;
            
            data.positions.push({
                "lat": +place.LAT,
                "lng": +place.LNG, 
                "infowindow": new kakao.maps.InfoWindow({
                    content: `<div class="placeInfo">${place.PLACE_NAME}</div>`,
                    position: new kakao.maps.LatLng(+place.LAT, +place.LNG),
                }),
            });
        }

        markers = data.positions.map(function(position) {
            
            const marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(position.lat, position.lng),
            });

            kakao.maps.event.addListener(marker, 'mouseover', function() {
                // 마커에 마우스오버 이벤트가 발생하면 인포윈도우를 표시합니다
                position.infowindow.open(map, marker);
            });
            kakao.maps.event.addListener(marker, 'mouseout', function() {
                // 마커에 마우스아웃 이벤트가 발생하면 인포윈도우를 제거합니다
                position.infowindow.close();
            });

            return marker;
        });

        sdToMarkers[placeType][sdName] = {};
        sdToMarkers[placeType][sdName].markers = markers;

        bounds = getMapBounds(data.positions); 
        sdToMarkers[placeType][sdName].bounds = bounds;
    }

    // 맵 범위 조정
    map.setBounds(bounds);

    // map.panTo(new kakao.maps.LatLng(center.lat, center.lng)); //지도 이동
    clusterer.addMarkers(markers); // 지도 마커 변경

    // 현재 지도 상태 정보 갱신
    currentPlaceType = placeType;
    currentSdName = sdName;

    // 로딩 인터벌 종료
    if(loadingInterval !== null)
        loadingInfoEnd();
}

function showInfo(sgInfo) {
    // 선거명
    const sgNameSpan = document.querySelector(".js-sgName");
    sgNameSpan.innerText = sgInfo.SG_NAME;

    // 선거 타입
    const sgTypeSpan = document.querySelector(".js-sgType");
    sgTypeSpan.innerText = sgTypes[sgInfo.SG_TYPECODE] + " 선거";

    // 선거 일자
    const sgVoteDate = document.querySelector(".js-sgVoteDate");
    const voteDate = sgInfo.SG_VOTEDATE.slice(0, 4) + "년 " + sgInfo.SG_VOTEDATE.slice(4, 6) + "월 " + sgInfo.SG_VOTEDATE.slice(6, 8) + "일";
    sgVoteDate.innerText = voteDate;
}

function apiRequest(sgId, sgTypecode, sdName) {
    const url = "https://5zzizo8bif.execute-api.us-east-1.amazonaws.com/link-test2/election/"+encodeURIComponent(sgId)+"/"+encodeURIComponent(sgTypecode)+"/"+encodeURIComponent(sdName);
    const type = "GET";

    if(loadingInterval === null)
        loadingInfoStart();

    $.ajax({
        url,
        type,
        dataType: "json",
        success: (data) => {
            const body = JSON.parse(data.body);
            if(body.resultCode === "00") {
                votePlaces[0][sdName] = body.item.votePlaces;
                votePlaces[1][sdName] = body.item.preVotePlaces;

                showInfo(body.item.sgInfo[0]);
                makePingOnMap(0, sdName);
            } else {
                alert("서버의 에러 응답");
            }
        },
        error: (xhr, status, error) => {
            alert("실패 응답");
            alert(status);
            console.log(error);
        },
    });
}

function judge(sgId, sgTypecode, sdName, placeType) {
    if(votePlaces[0][sdName] === undefined)
        apiRequest(sgId, sgTypecode, sdName);
    else
        makePingOnMap(placeType, sdName);
}

function loadingInfoStart() {
    const loadingInfoSpan = document.querySelector(".js-loadingInfo");
    
    console.log("로딩 인터벌 시작");
    loadingInfoSpan.style.display = "block";
    count = 0;
    loadingInterval = setInterval(() => {
        ++count;
        if(count < 4)
            loadingInfoSpan.innerText += ".";
        else {
            count = 0;
            loadingInfoSpan.innerText = loadingInfoSpan.innerText.slice(0, -3);
        }
    }, 500);
}

function loadingInfoEnd() {
    const loadingInfoSpan = document.querySelector(".js-loadingInfo");

    console.log("로딩 인터벌 종료");

    clearInterval(loadingInterval);
    loadingInterval = null;
    loadingInfoSpan.innerText = "지도를 로딩하고 있습니다.";
    loadingInfoSpan.style.display = "none";
}

function init() {
    const container = document.getElementsByClassName('map')[0]; //지도를 담을 영역의 DOM 레퍼런스
    const options = { //지도를 생성할 때 필요한 기본 옵션
        center: new kakao.maps.LatLng(37.5642135, 127.0016985), //지도의 중심좌표.
        level: MAP_LEVEL //지도의 레벨(확대, 축소 정도)
    };
    
    map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
    clusterer = new kakao.maps.MarkerClusterer({ // 클러스터러 생성
        map,
        averageCenter: true,
        minLevel: MAP_LEVEL,
    });

    // 현재 URL 분석하여 받아올 정보가 무엇인지 확인
    const currentUrl = document.location.href; 
    parsedUrl = currentUrl.split('/');
    
    const sgId = parsedUrl[4];
    const sgTypecode = parsedUrl[5];

    console.log("api request 직전");
    // API 요청
    apiRequest(sgId, sgTypecode, "서울특별시");

    console.log("api request 직후");

    // 적용 버튼 리스너
    const applyBtn = document.querySelector(".js-applyBtn")
    applyBtn.addEventListener('click', (event) => {
        event.preventDefault();

        const placeTypeSBox = document.querySelector(".js-placeTypeSBox");
        const areaSBox = document.querySelector(".js-areaSBox");
        
        const sdName = sdNames[areaSBox.value];
        const placeType = placeTypeSBox.value;

        if(currentPlaceType === placeType && currentSdName === sdName)
            return;
        if(loadingInterval !== null)
            return;

        console.log("투표소 타입 = " + placeType + ", 지역 = ", sdName);
        judge(sgId, sgTypecode, sdName, placeType);
    });
}

init();