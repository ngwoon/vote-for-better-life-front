const MAP_LEVEL = 10;
const sgTypes = ["보궐", "대통령", "국회의원", "시도지사", "구시군장", "시도의원", "구시군의회의원", "국회의원비례대표", "광역의원비례대표", "기초의원비례대표", "교육의원", "교육감", "전국동시지방"];
const sdNames = ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"];
const sdToMarkers = [{}, {}];
let votePlaces = [{}, {}];
let clusterer, map;
let loadingInterval = {
    sg: {interval: null, count: 0},
    map: {interval: null, count: 0},
    cand: {interval: null, count: 0},
};
let currentPlaceType = -1, currentSdName = "undefined";

let candidators = {};


function getMapBounds(positions) {
    const newBounds = new kakao.maps.LatLngBounds();

    for(position of positions)
        newBounds.extend(new kakao.maps.LatLng(position.lat, position.lng));

    return newBounds;
}

function makePingOnMap(placeType, sdName) {

    return new Promise((resolve, reject) => {
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
        if(loadingInterval["map"].interval !== null)
            endLoadingInterval();

        resolve();
    });
}





function showSgInfo(sgInfo) {
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

    endLoadingInterval("sg");
}

function classifyCandidators(uCandidators) {
    const temp = {};
    
    for(let candidator of uCandidators) {
        if(temp[candidator.JD_NAME] === undefined)
            temp[candidator.JD_NAME] = [];
        temp[candidator.JD_NAME].push(candidator);
    }

    const jdNames = Object.keys(temp).sort();

    // 정당별로 분류
    for(let jdName of jdNames)
        candidators[jdName] = temp[jdName];

    console.log("후보자 정보 가공 완료");
}

function onCandidatorNameClicked(candidator) {
    const modal = document.querySelector(".js-modal");

    const closeModal = document.querySelector(".js-closeModal");
    closeModal.addEventListener("click", (event) => {
        event.preventDefault();
        modal.style.display = "none";
    });

    const modalBody = document.querySelector(".js-modalBody");
    modalBody.innerHTML = "";

    // 모달 내용 채우기
    let h3 = document.createElement("h3");
    h3.innerText = "이름";
    modalBody.append(h3);

    let content = document.createElement("p");
    content.innerText = candidator["NAME"];
    modalBody.append(content);

    let br = document.createElement("br");
    modalBody.append(br);
    
    
    h3 = document.createElement("h3");
    h3.innerText = "성별";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["GENDER"]+"성";
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "나이";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["AGE"] + "세";
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "주소";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["ADDR"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "직업";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["JOB"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "학력";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["EDU"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "선거구";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["SGG_NAME"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "시도 / 구시군";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["SD_NAME"] + " " + candidator["WIW_NAME"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "기호";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = "기호 " + candidator["GIHO"] + "번";
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "정당";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["JD_NAME"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "경력";
    modalBody.append(h3);

    for(career of candidator["CAREER"]) {
        content = document.createElement("p");
        content.innerText = career;
        modalBody.append(content);
    }

    br = document.createElement("br");
    modalBody.append(br);


    h3 = document.createElement("h3");
    h3.innerText = "후보 상태";
    modalBody.append(h3);

    content = document.createElement("p");
    content.innerText = candidator["STATUS"];
    modalBody.append(content);

    br = document.createElement("br");
    modalBody.append(br);


    

    if(candidator["PRMS"].length > 0) {
        h3 = document.createElement("h3");
        h3.innerText = "공약";
        modalBody.append(h3);

        let idx = 1;
        for(prm of candidators["PRMS"]) {
            const prmIdx = document.createElement("div");
            prmIdx.style = "font-size: 20px; font: bold;";
            prmIdx.innerText = "공약 " + idx + ".";
            ++idx;
            modalBody.append(prmIdx);

            
            let prmTitle = document.createElement("div");
            prmTitle.style = "fond-size: 15px; font: bold";
            prmTitle.innerText = "공약분야";
            modalBody.append(prmTitle);

            let prmContent = document.createElement("p");
            prmContent.innerText = prm["REALM"];
            modalBody.append(prmContent);


            prmTitle = document.createElement("div");
            prmTitle.style = "fond-size: 15px; font: bold";
            prmTitle.innerText = "공약제목";
            modalBody.append(prmTitle);

            prmContent = document.createElement("p");
            prmContent.innerText = prm["TITLE"];
            modalBody.append(prmContent);


            prmTitle = document.createElement("div");
            prmTitle.style = "fond-size: 15px; font: bold";
            prmTitle.innerText = "공약내용";
            modalBody.append(prmTitle);

            prmContent = document.createElement("p");
            prmContent.innerText = prm["CONTENT"];
            modalBody.append(prmContent);
        }
       
        br = document.createElement("br");
        modalBody.append(br);
    }

    // 모달 창 띄우기
    modal.style.display = "block";
}

// 선거에 참여한 후보자들을 정당 기준으로 화면에 나열하는 함수 
function showCandNames() {
    const listDiv = document.querySelector(".js-candidatorList");
    listDiv.style.display = "none";

    console.log(candidators);

    console.log("후보자 정보 화면띄우기 시작");
    for(let jdName of Object.keys(candidators)) {
        const jdNameHeader = document.createElement("h3");
        jdNameHeader.innerText = jdName;
        listDiv.append(jdNameHeader);

        const ONE_LINE_LIMIT = 10;
        let count = 0;
        let table = document.createElement("table");
        let tr = document.createElement("tr");
        for(let candidator of candidators[jdName]){
            console.log("후보자명 = ", candidator.NAME);

            const td = document.createElement("td");
            const cNameSpan = document.createElement("span");
            cNameSpan.innerText = candidator.NAME;

            //후보자 모달 창 리스너 등록
            cNameSpan.addEventListener("click", (event) => {
                event.preventDefault();
                onCandidatorNameClicked(candidator);
            });

            cNameSpan.classList.add("clickable");

            td.append(cNameSpan);
            tr.append(td);
            ++count;

            if(count === ONE_LINE_LIMIT) {
                count = 0;
                table.append(tr);
                tr = document.createElement("tr");
            }
        }

        if(count !== 0)
            table.append(tr);

        listDiv.append(table);
        listDiv.append(document.createElement("br"));
    }

    listDiv.style.display = "block";

    // 인터벌 종료
    endLoadingInterval("cand");
    console.log("후보자 정보 화면띄우기 종료");
}





function goHome() {
    location.href = "/";
}

function placeApiRequest(sgId, sdName) {

    const url = "https://5zzizo8bif.execute-api.us-east-1.amazonaws.com/deploy/vote-places/"+encodeURIComponent(sgId)+"/"+encodeURIComponent(sdName);
    const type = "GET";

    $.ajax({
        url,
        type,
        dataType: "json",
        success: async (data) => {
            const body = JSON.parse(data.body);
            if(body.resultCode === "00") {
                votePlaces[0][sdName] = body.item.votePlaces;
                votePlaces[1][sdName] = body.item.preVotePlaces;
                makePingOnMap(0, sdName)
                    .then(() => {console.log("지도 로딩 완료");})
                    .catch((error) => {console.log("지도 로딩 실패"); goHome();});
            } else {
                alert("투표소 정보를 불러오는데 실패했습니다.");
                goHome();
            }
        },
        error: (xhr, status, error) => {
            alert("비동기 요청 실패 : place");
            alert(status);
            console.log(error);
            goHome();
        },
    });
}


function sgApiRequest(sgId, sgTypecode) {

    const url = "https://5zzizo8bif.execute-api.us-east-1.amazonaws.com/deploy/election/"+encodeURIComponent(sgId)+"/"+encodeURIComponent(sgTypecode);
    const type = "GET";

    $.ajax({
        url,
        type,
        dataType: "json",
        success: (data) => {
            const body = JSON.parse(data.body);
            if(body.resultCode === "00") {
                if(body.item.sgInfo.length === 0) {
                    alert("존재하지 않는 선거입니다.");
                    goHome();
                }
                showSgInfo(body.item.sgInfo[0]);
            } else {
                alert("선거 정보를 불러오는데 실패했습니다.");
                goHome();
            }
        },
        error: (xhr, status, error) => {
            alert("비동기 요청 실패 : sg");
            alert(status);
            console.log(error);
            goHome();
        },
    });
}

function candApiRequest(sgId, sgTypecode) {
    const url = "https://5zzizo8bif.execute-api.us-east-1.amazonaws.com/deploy/candidators/"+encodeURIComponent(sgId)+"/"+encodeURIComponent(sgTypecode);
    const type = "GET";

    $.ajax({
        url,
        type,
        dataType: "json",
        success: (data) => {
            const body = JSON.parse(data.body);
            if(body.resultCode === "00") {
                classifyCandidators(body.item.candidators);
                showCandNames();
            } else {
                alert("후보자 정보를 불러오는데 실패했습니다.");
                goHome();
            }
        },
        error: (xhr, status, error) => {
            alert("비동기 요청 실패 : cand");
            alert(status);
            console.log(error);
            goHome();
        },
    });
}

// 지도 적용 버튼 클릭 시 API 요청, 혹은 이미 저장된 데이터를 사용할건지 분기하는 함수 
function judge(sgId, sdName, placeType) {
    
    // 버튼 클릭했을 때 로딩 안내 문구 띄우기
    startLoadingInterval("map");

    if(votePlaces[0][sdName] === undefined)
        placeApiRequest(sgId, sdName);
    else
        makePingOnMap(placeType, sdName);
}


function changeLoadingInfo(type) {
    const loadingInfoSpan = document.querySelector(".js-"+type+"LoadingInfo");

    ++loadingInterval[type].count;
    if(loadingInterval[type].count < 4)
        loadingInfoSpan.innerText += ".";
    else {
        loadingInterval[type].count = 0;
        loadingInfoSpan.innerText = loadingInfoSpan.innerText.slice(0, -3);
    }
}

function startLoadingInterval(type) {
    const loadingInfoSpan = document.querySelector(".js-"+type+"LoadingInfo");
    
    console.log("로딩 인터벌 시작");
    if(type === "map")
        loadingInfoSpan.style.display = "block";
    
    loadingInterval[type].count = 0;
    
    changeLoadingInfo(type);
    loadingInterval[type].interval = setInterval(() => {
        changeLoadingInfo(type); 
    }, 500);
}

function endLoadingInterval(type) {
    const loadingInfoSpan = document.querySelector(".js-"+type+"LoadingInfo");

    console.log("로딩 인터벌 종료");

    clearInterval(loadingInterval[type].interval);
    loadingInterval["map"].interval = null;
    loadingInterval["map"].count = 0;
    loadingInfoSpan.style.display = "none";

    if(type === "map")
        loadingInfoSpan.innerText = "지도를 로딩하고 있습니다.";
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
    

    // 선거 정보 API 요청
    sgApiRequest(sgId, sgTypecode, "서울특별시");
    startLoadingInterval("sg");

    // 후보자 정보 API 요청
    candApiRequest(sgId, sgTypecode);
    startLoadingInterval("cand");


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
        judge(sgId, sdName, placeType);
    });
}

init();