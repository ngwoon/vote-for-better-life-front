
// 검색 결과 화면에 출력
function showResults(data) {

    sgTypes = ["NULL", "대통령", "국회의원", "시도지사", "구시군장", "시도의원", "구시군의회의원", "국회의원비례대표", "광역의원비례대표", "기초의원비례대표", "교육의원", "교육감"];

    const list = document.querySelector(".js-searchResults");
    list.innerHTML = "";

    const ul = document.createElement("ul");
    list.append(ul);
    for(election of data) {

        const date = election.SG_VOTEDATE;
        const year = date.slice(0,4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);
        const dateString = year + "년 " + month + "월 " + day + "일"

        
        const li = document.createElement("li");

        const expand = document.createElement("a");
        expand.classList.add("expand");

        const rightArrow = document.createElement("div");
        rightArrow.innerText = "+";
        rightArrow.classList.add("right-arrow");
        
        const icon = document.createElement("div");
        icon.classList.add("icon");
        icon.classList.add("default");

        // reuslt title 생성
        const title = document.createElement("h2");
        title.innerText = election.SG_NAME;
        const shortExplain = document.createElement("span");
        shortExplain.innerText = dateString;
        
        // detail div 생성
        const detailDiv = document.createElement("div");
        detailDiv.classList.add("detail");

        // detail span 생성
        const spanDiv = document.createElement("div");
        const detailSpan = document.createElement("span");
        const br = document.createElement("br");

        detailSpan.innerText = dateString + "에 실시한 대한민국 " + sgTypes[+election.SG_TYPECODE] + " 선거";
    
        spanDiv.append(detailSpan);
        
        // detail span button 생성
        const detailBtn = document.createElement("span");
        detailBtn.classList.add("button");
        detailBtn.innerText = "상세보기";
        
        detailDiv.append(spanDiv);
        detailDiv.append(br);
        detailDiv.append(detailBtn);

        expand.append(rightArrow);
        expand.append(icon);
        expand.append(title);
        expand.append(shortExplain);
        
        li.append(expand);
        li.append(detailDiv);

        ul.append(li);
    }

    if(data.length !== 0) {
        $(function() {
            $(".expand").on( "click", function() {
              $(this).next().slideToggle(100);
              $expand = $(this).find(">:first-child");
              
              if($expand.text() == "+") {
                $expand.text("-");
              } else {
                $expand.text("+");
              }
            });
        });
    }
}

function onFormSubmitted(event) {
    event.preventDefault();

    const checkBoxes = document.getElementsByClassName("js-checkbox");

    let searchRangeStat = 0;
    for(let i=0; i<checkBoxes.length; ++i) {
        const checkBox = checkBoxes[i];
        if(checkBox.checked)
            searchRangeStat += Math.pow(2, (checkBoxes.length - 1 - i));
    }

    const searchTerm = document.querySelector(".js-searchTerm").value;
    if(searchTerm === "")
        alert("검색어를 입력하세요.");
    if(searchRangeStat === 0)
        alert("하나 이상의 범주를 선택하세요");
    else {
        const url = "https://5zzizo8bif.execute-api.us-east-1.amazonaws.com/link-test/search?searchRangeStat="+searchRangeStat+"&searchTerm="+searchTerm;
        const type = "GET";
        $.ajax({
            url,
            type,
            dataType: "json",
            success: (data) => {
                const body = JSON.parse(data.body);
                console.log(body);

                if(body.resultCode === "200") {
                    showResults(body.item);
                } else {
                    alert("서버의 에러 응답");
                }
            },
            error: (xhr, status, error) => {
                alert("실패 응답");
                alert(status);
            },
        });
    }
}

function init() {
    // 검색 로직
    const form = document.querySelector(".js-searchForm");
    form.addEventListener("submit", onFormSubmitted);

    
}

init();