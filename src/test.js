let channel = -1
let msg = "a"
setInterval(fetchData, 1000, msg, channel); 

function fetchData(msg1, channel1){
    console.log("fuck you", msg1, channel1);
}