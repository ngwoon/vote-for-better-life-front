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
                
            },
            error: (xhr, status, error) => {
                alert("실패 응답");
                alert(status);
            },
            complete: () => {
                
            },
        });
    }
}

function init() {
    const form = document.querySelector(".js-searchForm");
    form.addEventListener("submit", onFormSubmitted);
}

init();