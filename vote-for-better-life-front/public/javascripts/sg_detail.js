const sgTypes = ["보궐", "대통령", "국회의원", "시도지사", "구시군장", "시도의원", "구시군의회의원", "국회의원비례대표", "광역의원비례대표", "기초의원비례대표", "교육의원", "교육감", "전국동시지방"];
const sdNames = ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "인천광역시", "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"];

async function makePingOnMap(votePlaces, preVotePlaces, map) {
    const geocoder = new kakao.maps.services.Geocoder();

    const data = {
        "positions": [],
    };

    const addrSearchPromises = [];

    // 선거일 투표소 정보
    for(let votePlace of votePlaces) {
        const parsedAddr = votePlace.ADDR.split('(');
        addrSearchPromises.push(new Promise((resolve, reject) => {
            geocoder.addressSearch(parsedAddr[0], function(result, status) {

                // 정상적으로 검색이 완료됐으면 
                if (status === kakao.maps.services.Status.OK) {

                    data.positions.push({
                        "lat": result[0].y, 
                        "lng": result[0].x, 
                        "infowindow": new kakao.maps.InfoWindow({
                            content: `<div class="placeInfo">${votePlace.PLACE_NAME}</div>`,
                            position: new kakao.maps.LatLng(result[0].y, result[0].x),
                        }),
                    });

                    resolve();

                } else {
                    // console.log(`검색 실패 주소 = ${parsedAddr[0]}`);
                    reject();
                }
            });
        }));
    }

    const clusterer = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 10,
    });

    await Promise.allSettled(addrSearchPromises);

    const markers = data.positions.map(function(position) {
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

    clusterer.addMarkers(markers);
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

function init() {
    const container = document.getElementsByClassName('map')[0]; //지도를 담을 영역의 DOM 레퍼런스
    const options = { //지도를 생성할 때 필요한 기본 옵션
        center: new kakao.maps.LatLng(37.5642135, 127.0016985), //지도의 중심좌표.
        level: 10 //지도의 레벨(확대, 축소 정도)
    };
    
    const map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

    const currentUrl = document.location.href;
    parsedUrl = currentUrl.split('/');
    
    const sgId = parsedUrl[4];
    const sgTypecode = parsedUrl[5];

    const url = "https://5zzizo8bif.execute-api.us-east-1.amazonaws.com/link-test2/election/"+encodeURIComponent(sgId)+"/"+encodeURIComponent(sgTypecode);
    const type = "GET";
    $.ajax({
        url,
        type,
        dataType: "json",
        success: (data) => {
            const body = JSON.parse(data.body);

            if(body.resultCode === "00") {
                console.log(body.item);
                showInfo(body.item.sgInfo[0]);
                makePingOnMap(body.item.votePlaces, body.item.preVotePlaces, map);
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

init();