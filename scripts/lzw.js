const maxDictSize = 4096;
var lastRadix = 10;
function encode(){
    var inputText = document.getElementById("input-str");
    let originalStr = inputText.value;
    let numInputSym = originalStr.length;
    let tab = document.getElementById("lzw-tab");
    let table = document.getElementById("lzw-tab").getElementsByTagName('tbody')[0];
    let p = document.getElementById("enc-output");
    let p_dec = document.getElementById("decimal-output");
    let span = document.createElement("span");
    let spanCount = 0;
    
    let dictSel = document.getElementById("dict-select").value;
    let demarkSel = document.getElementById("str-mark-select").value;
    
    let radix = parseInt(document.getElementById("radix-sel").value, 10);
    lastRadix = radix;
    let useBitstream = document.getElementById("use-bitstream").checked;
    
    //let textArea = document.getElementsByClassName("auto_height")[0];
    //clear original table
    table.innerHTML = "";
    
    //clear output
    p.innerHTML = "";
    p_dec.innerHTML = "";

    //build dictionary of single chars
    var dict = {};
    customDict = (dictSel === "custom") ? document.getElementById("custom-dict").value : "";
    let idx = buildDict(dict, dictSel, customDict);
    
    if(dictSel === "A-Z" || dictSel === "an"){
        originalStr = originalStr.toUpperCase();
    }
    
    //get the size of initial dictionary for statistics
    let dSize = idx-1;
    //console.log(dSize);
    
    //entry number which requires increasing bit width
    let bitPerCode = Math.ceil(Math.log2(dSize))+1;
    //console.log(bitPerCode);
    let thresh = Math.pow(2, bitPerCode);
    let totalCompressedBits = 0;
    
    //counter objects to track occurrences of symbols
    var inputCounter = {};
    var outputCounter = {};
    
    //set demarcation symbols
    var leftDemarc = getLeftDemarc(demarkSel);
    var rightDemarc = getRightDemarc(demarkSel);
    
    s = originalStr[0];
    addToCounter(inputCounter, s);
    for (var i=1; i < originalStr.length; i++){
        c = originalStr[i];
        addToCounter(inputCounter, c);
        if(dict[s+c] !== undefined){
            insertRowNoOutput(table, s, c, leftDemarc, rightDemarc);
            s = s+c;
        }
        else{
            //count substring occurrences
            addToCounter(outputCounter, s);
            
            //output s into paragraph
            addSpans(span, s, spanCount, dict, p, p_dec, radix, bitPerCode, useBitstream);
            if (radix!==2 || !useBitstream){
                p_dec.insertAdjacentHTML('beforeend', " ");
            }
            spanCount ++;
            console.log(`enc: ${bitPerCode}`);
            totalCompressedBits += bitPerCode;
            
            //only add to dictionary if within max size
            if(idx < maxDictSize){
                //output s into table and add dictionary index for new sequence
                insertRowWithOutput(table, s, c, dict, idx, leftDemarc, rightDemarc);

                //update bitPerCode and threshhold if necessary
                if(idx>=thresh-1){
                    console.log(idx, thresh, s);
                    bitPerCode++;
                    thresh <<= 1;
                }

                dict[s+c] = idx;
                idx ++;
            }
            else{
                insertRowNoDict(table, s, c, dict, idx, leftDemarc, rightDemarc);
            }
            s = c;
        }
        
    }
    //output s
    addToCounter(outputCounter, s);
    addSpans(span, s, spanCount, dict, p, p_dec, radix, bitPerCode, useBitstream);
    spanCount ++;
    totalCompressedBits += bitPerCode;
    insertEOF(table, s, dict, leftDemarc, rightDemarc);
    
    //hover events
    p.addEventListener('mouseenter', function(e){
        if (e.target && e.target.className == "output-highlight"){
            e.target.style.background = '#31f5f5';
            let temp = dict[e.target.innerHTML];
            var cell5 = document.getElementById(`idx-${temp}a`);
            var cell6 = document.getElementById(`idx-${temp}b`);
            span = document.getElementById(e.target.id + "-dec");
            if(cell5){
                cell5.style.background = '#31f5f5';
                cell6.style.background = '#31f5f5';
            }
            if(span){
                span.style.background = '#31f5f5';
            }
        }
    }, true);
    p.addEventListener('mouseleave', function(e){
        if (e.target && e.target.className == "output-highlight"){
            e.target.style.background = '#ffffff';
            let temp = dict[e.target.innerHTML];
            var cell5 = document.getElementById(`idx-${temp}a`);
            var cell6 = document.getElementById(`idx-${temp}b`);
            span = document.getElementById(e.target.id + "-dec");
            if(cell5){
                cell5.style.background = '#ffffff';
                cell6.style.background = '#ffffff';
            }
            if(span){
                span.style.background = '#ffffff';
            }
        }
    }, true);
    
    let numStaticBits = Math.max(Math.ceil(Math.log2(dSize)), 1);
    addStats(numInputSym, spanCount, numStaticBits, totalCompressedBits, inputCounter, outputCounter);
    
    inputText.style.height = "40px";
}
function addToCounter(c, k){ //c=counter object, k=key
    if(c[k] === undefined)
        c[k] = 1;
    else
        c[k]++;
}
function buildDict(d, sel, custom){
    var idx = 0;
    if(sel === "ASCII"){
        for (idx = 0; idx < 128; idx++){
            d[String.fromCharCode(idx)] = idx;
        }
    }
    else if(sel === "UTF-8"){
        for (idx = 0; idx < 256; idx++){
            d[String.fromCharCode(idx)] = idx;
        }
    }
    else if(sel === "A-Z"){
        for (idx = 0; idx < 26; idx++){
            d[String.fromCharCode(idx+65)] = idx;
        }
    }
    else if(sel === "0-9"){
        for (idx = 0; idx < 10; idx++){
            d[String.fromCharCode(idx+48)] = idx;
        }
    }
    else if(sel === "an"){
        for (idx = 0; idx < 10; idx++){
            d[String.fromCharCode(idx+48)] = idx;
        }
        for (; idx < 26+10; idx++){
            d[String.fromCharCode(idx+65-10)] = idx;
        }
    }
    else if(sel === "csan"){
        for (idx = 0; idx < 10; idx++){
            d[String.fromCharCode(idx+48)] = idx;
        }
        for (; idx < 26+10; idx++){
            d[String.fromCharCode(idx+65-10)] = idx;
        }
        for (; idx < 26+10+26; idx++){
            d[String.fromCharCode(idx+97-10-26)] = idx;
        }
    }
    else if(sel === "csanp"){
        for (idx = 0; idx < 10; idx++){
            d[String.fromCharCode(idx+48)] = idx;
        }
        for (; idx < 26+10; idx++){
            d[String.fromCharCode(idx+65-10)] = idx;
        }
        for (; idx < 26+10+26; idx++){
            d[String.fromCharCode(idx+97-10-26)] = idx;
        }
        for (var c of " ,.?!"){
            d[c] = idx;
            idx++;
        }
    }
    else if(sel === "custom"){
        idx = 0;
        for (var c of custom){
            if (d[c] === undefined){
                d[c] = idx;
                idx++;
            }
        }
    }
    return idx;
}
function buildDictDec(d, sel, custom){
    var idx = 0;
    if(sel === "ASCII"){
        for (idx = 0; idx < 128; idx++){
            d[idx] = String.fromCharCode(idx);
        }
    }
    else if(sel === "UTF-8"){
        for (idx = 0; idx < 256; idx++){
            d[idx] = String.fromCharCode(idx);
        }
    }
    else if(sel === "A-Z"){
        for (idx = 0; idx < 26; idx++){
            d[idx] = String.fromCharCode(idx+65);
        }
    }
    else if(sel === "0-9"){
        for (idx = 0; idx < 10; idx++){
            d[idx] = String.fromCharCode(idx+48);
        }
    }
    else if(sel === "an"){
        for (idx = 0; idx < 10; idx++){
            d[idx] = String.fromCharCode(idx+48);
        }
        for (; idx < 26+10; idx++){
            d[idx] = String.fromCharCode(idx+65-10);
        }
    }
    else if(sel === "csan"){
        for (idx = 0; idx < 10; idx++){
            d[idx] = String.fromCharCode(idx+48);
        }
        for (; idx < 26+10; idx++){
            d[idx] = String.fromCharCode(idx+65-10);
        }
        for (; idx < 26+10+26; idx++){
            d[idx] = String.fromCharCode(idx+97-10-26);
        }
    }
    else if(sel === "csanp"){
        for (idx = 0; idx < 10; idx++){
            d[idx] = String.fromCharCode(idx+48);
        }
        for (; idx < 26+10; idx++){
            d[idx] = String.fromCharCode(idx+65-10);
        }
        for (; idx < 26+10+26; idx++){
            d[idx] = String.fromCharCode(idx+97-10-26);
        }
        for (var c of " ,.?!"){
            d[idx] = c;
            idx++;
        }
    }
    else if(sel === "custom"){
        idx = 0;
        for (var c of custom){
            if (d[idx] === undefined){
                d[idx] = c;
                idx++;
            }
        }
    }
    return idx;
}
function insertRowNoOutput(table, s, c, l, r){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = l+s+r;
    cell2.innerHTML = l+c+r;
    cell3.innerHTML = "";
    cell4.innerHTML = "";
    cell5.innerHTML = "";
    cell6.innerHTML = "";
}
function insertRowWithOutput(table, s, c, dict, idx, l, r){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell5.id = `idx-${idx}a`;
    cell6.id = `idx-${idx}b`;
    cell1.innerHTML = l+s+r;
    cell2.innerHTML = l+c+r;
    cell3.innerHTML = l+s+r;
    cell4.innerHTML = `${dict[s]}`;
    cell5.innerHTML = `${idx}`;
    cell6.innerHTML = l+s+c+r;
}
function insertRowNoDict(table, s, c, dict, idx, l, r){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = l+s+r;
    cell2.innerHTML = l+c+r;
    cell3.innerHTML = l+s+r;
    cell4.innerHTML = `${dict[s]}`;
    cell5.innerHTML = "";
    cell6.innerHTML = "";
}
function insertEOF(table, s, dict, l, r){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = l+s+r;
    cell2.innerHTML = "EOF";
    cell3.innerHTML = l+s+r;
    cell4.innerHTML = `${dict[s]}`;
    cell5.innerHTML = "";
    cell6.innerHTML = "";
}
function insertDecFirst(table, s, entry, index, dict, l, r){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = "undefined";
    cell2.innerHTML = l+entry[0]+r;
    cell3.innerHTML = l+entry+r;
    cell4.innerHTML = index;
    cell5.innerHTML = "";
    cell6.innerHTML = "";
}
function insertDec(table, s, entry, index, i, dict, l, r){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell5.id = `idx-${i}a`;
    cell6.id = `idx-${i}b`;
    cell1.innerHTML = l+s+r;
    cell2.innerHTML = l+entry[0]+r;
    cell3.innerHTML = l+entry+r;
    cell4.innerHTML = index;
    cell5.innerHTML = `${i}`;
    cell6.innerHTML = l+s+entry[0]+r;
}
function addSpans(span, s, spanCount, dict, p, p_dec, radix, bitPerCode, useBitstream){
    span = document.createElement("span");
    span.innerHTML = s;
    span.className = "output-highlight";
    span.id = `span-${spanCount}`;
    p.appendChild(span);
    span = document.createElement("span");
    const zero = "0";
    if(radix===2 && useBitstream){
        var str = dict[s].toString(radix);
        span.innerHTML = zero.repeat(bitPerCode - str.length) + str;
    }
    else{
        span.innerHTML = dict[s].toString(radix);
    }
    span.className = "decimal-span";
    span.id = `span-${spanCount}-dec`;
    p_dec.appendChild(span);
}
function addSpansDec(span, index, idx, spanCount, entry, p, p_dec, radix){
    span = document.createElement("span");
    span.innerHTML = index.toString(radix);
    span.className = "output-highlight";
    span.id = `span-${spanCount}`;
    p.appendChild(span);
    span = document.createElement("span");
    span.innerHTML = `${entry}`
    span.className = "decimal-span";
    span.id = `span-${spanCount}-dec`;
    p_dec.appendChild(span);
}
function addSpansDecBit(span, index, idx, spanCount, entry, p, p_dec, bin_num){
    span = document.createElement("span");
    span.innerHTML = bin_num;
    span.className = "output-highlight";
    span.id = `span-${spanCount}`;
    p.appendChild(span);
    span = document.createElement("span");
    span.innerHTML = `${entry}`
    span.className = "decimal-span";
    span.id = `span-${spanCount}-dec`;
    p_dec.appendChild(span);
}
function calcEntropy(c, n){ //c = counterobject, n = number of symbols
    sum = 0.0;
    for (var key in c){
        var value = c[key];
        sum += (value/n)*Math.log2(n/value);
    }
    return sum;
}
function hideCustomDefault(){
    e = document.getElementById("dict-select");
    c = document.getElementById("radix-sel");
    onDictSel(e);
    onRadixSel(c);
}
function onDictSel(e){
    div = document.getElementById("custom-dict-box");
    if (e.value === "custom") {
        div.style.display = "block";
    }
    else{
        div.style.display = "none";
    }
}
function getLeftDemarc(s){
    switch(s){
        case "none":    return "";
        case "single":  return "\'";
        case "double":  return "\"";
        case "saquo":   return "‹";
        case "aquo":    return `&laquo`;
    }
}
function getRightDemarc(s){
    switch(s){
        case "none":    return "";
        case "single":  return "\'";
        case "double":  return "\"";
        case "saquo":   return "›";
        case "aquo":    return `&raquo`;
    }
}
function decode(){
    var inputText = document.getElementById("input-str");
    let originalStr = inputText.value;
    let tab = document.getElementById("lzw-tab");
    let table = document.getElementById("lzw-tab").getElementsByTagName('tbody')[0];
    let p = document.getElementById("enc-output");
    let p_dec = document.getElementById("decimal-output");
    let span = document.createElement("span");
    let spanCount = 0;
    
    let dictSel = document.getElementById("dict-select").value;
    let demarkSel = document.getElementById("str-mark-select").value;
    
    let radix = parseInt(document.getElementById("radix-sel").value, 10);
    lastRadix = radix;
    let useBitstream = document.getElementById("use-bitstream").checked;
    console.log(useBitstream);
    
    //let textArea = document.getElementsByClassName("auto_height")[0];
    //clear original table
    table.innerHTML = "";
    
    //clear output
    p.innerHTML = "";
    p_dec.innerHTML = "";

    //build dictionary of single chars
    var dict = new Array(maxDictSize);
    customDict = (dictSel === "custom") ? document.getElementById("custom-dict").value : "";
    let idx = buildDictDec(dict, dictSel, customDict);
    
    //get the size of initial dictionary for statistics
    let dSize = idx-1;
    
    //entry number which requires increasing bit width
    let bitPerCode = Math.ceil(Math.log2(dSize))+1;
    //console.log(bitPerCode);
    let thresh = Math.pow(2, bitPerCode);
    let totalCompressedBits = 0;
    
    //counter objects to track occurrences of symbols
    var inputCounter = {};
    var outputCounter = {};
    var numInputSym = 0;
    
    //set demarcation symbols
    var leftDemarc = getLeftDemarc(demarkSel);
    var rightDemarc = getRightDemarc(demarkSel);
    
    if(radix !== 2 || !useBitstream){
        //get list of integers from string
        var symbols = originalStr.split(/(?:,| )+/);
        //regex to consider any amount of spaces or commas as one delimiter
        var indices = [];
        for (symbol of symbols){
            if(symbol){ //avoid parsing empty strings (if delimiter is at end of string)
                indices.push(parseInt(symbol, radix));
            }
        }
        //decoding process
        var s=undefined;
        var entry=undefined;
        for (var index of indices){
            entry = dict[index];
            if (entry === undefined){
                entry = s + s[0];
            }
            //console.log(entry);
            addToCounter(outputCounter, entry);
            for(char of entry){
                addToCounter(inputCounter, char);
            }
            numInputSym += entry.length;
            addSpansDec(span, index, idx, spanCount, entry, p, p_dec, radix);
            spanCount++;
            //console.log(`dec: ${bitPerCode}`);
            totalCompressedBits += bitPerCode;
            if (s !== undefined){
                dict[idx] = s + entry[0];
                insertDec(table, s, entry, index, idx, dict, leftDemarc, rightDemarc);
                if(idx>=thresh-2){
                    //console.log(idx, thresh, entry);
                    bitPerCode++;
                    thresh <<= 1;
                }
                idx++;
            }
            else{
                insertDecFirst(table, s, entry, index, dict, leftDemarc, rightDemarc);
            }
            s = entry;
        }
    }
    else{
        var spacelessStr = originalStr.replace(/(?:,|\s)+/g, "");
        console.log(spacelessStr);
        //decoding process
        var s=undefined;
        var entry=undefined;
        var done = false;
        var ptr = 0;
        var decoded = "";

        while (ptr<spacelessStr.length){
            var nextBin = spacelessStr.substr(ptr, bitPerCode);
            var index = parseInt(nextBin, 2);
            ptr += bitPerCode;
            entry = dict[index];
            if (entry === undefined){
                entry = s + s[0];
            }
            addToCounter(outputCounter, entry);
            for(char of entry){
                addToCounter(inputCounter, char);
            }
            numInputSym += entry.length;
            addSpansDecBit(span, index, idx, spanCount, entry, p, p_dec, nextBin);
            spanCount++;
            totalCompressedBits += bitPerCode;
            decoded += entry;
            if (s !== undefined){
                dict[idx] = s + entry[0];
                insertDec(table, s, entry, index, idx, dict, leftDemarc, rightDemarc);
                if(idx>=thresh-2){
                    //console.log(idx, thresh, entry);
                    bitPerCode++;
                    thresh <<= 1;
                }
                idx++;
            }
            else{
                insertDecFirst(table, s, entry, index, dict, leftDemarc, rightDemarc);
            }
            s = entry;
        }
        //console.log(decoded);
    }
        //hover events
    p.addEventListener('mouseenter', function(e){
        if (e.target && e.target.className == "output-highlight"){
            e.target.style.background = '#31f5f5';
            let temp = parseInt(e.target.innerHTML, radix).toString(10);
            var cell5 = document.getElementById(`idx-${temp}a`);
            var cell6 = document.getElementById(`idx-${temp}b`);
            span = document.getElementById(e.target.id + "-dec");
            if(cell5){
                cell5.style.background = '#31f5f5';
                cell6.style.background = '#31f5f5';
            }
            if(span){
                span.style.background = '#31f5f5';
            }
        }
    }, true);
    p.addEventListener('mouseleave', function(e){
        if (e.target && e.target.className == "output-highlight"){
            e.target.style.background = '#ffffff';
            let temp = parseInt(e.target.innerHTML, radix).toString(10);
            var cell5 = document.getElementById(`idx-${temp}a`);
            var cell6 = document.getElementById(`idx-${temp}b`);
            span = document.getElementById(e.target.id + "-dec");
            if(cell5){
                cell5.style.background = '#ffffff';
                cell6.style.background = '#ffffff';
            }
            if(span){
                span.style.background = '#ffffff';
            }
        }
    }, true);
    
    let numStaticBits = Math.max(Math.ceil(Math.log2(dSize)), 1);
    addStats(numInputSym, spanCount, numStaticBits, totalCompressedBits, inputCounter, outputCounter);
    
    inputText.style.height = "40px";
}
function addStats(numInputSym, spanCount, numStaticBits, totalCompressedBits, inputCounter, outputCounter){
    //Enter statistics into table
    document.getElementById("i-num").innerHTML = `${numInputSym}`;
    document.getElementById("o-num").innerHTML = `${spanCount}`;
    
    document.getElementById("i-bit").innerHTML = `${numInputSym * numStaticBits}`;
    document.getElementById("o-bit").innerHTML = `${totalCompressedBits}`;
    
    document.getElementById("i-acl").innerHTML = `${numStaticBits}`;
    document.getElementById("o-acl").innerHTML = `${(totalCompressedBits/spanCount).toFixed(2)}`;
    
    document.getElementById("i-ent").innerHTML = `${calcEntropy(inputCounter, numInputSym).toFixed(2)}`;
    document.getElementById("o-ent").innerHTML = `${calcEntropy(outputCounter, spanCount).toFixed(2)}`;
    
    document.getElementById("i-com").innerHTML = "1:1";
    document.getElementById("o-com").innerHTML = `${(numInputSym * numStaticBits / totalCompressedBits).toFixed(2)}:1`;
    
    document.getElementById("i-sps").innerHTML = "0%";
    document.getElementById("o-sps").innerHTML = `${((1 - totalCompressedBits/(numInputSym * numStaticBits)) * 100).toFixed(2)}%`;
}
function onRadixSel(e){
    check = document.getElementById("use-bitstream");
    if(e.value === "2"){
        check.disabled = false;
    }
    else{
        check.disabled = true;
    }
}
function auto_height(elem) {  /* javascript */
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}
function hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
}
function selectText1(containerid) {
    //from stack overflow: https://stackoverflow.com/questions/24553251/is-it-possible-to-restrict-the-range-of-select-all-ctrla
        if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(document.getElementById(containerid));
            range.select();
        } else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(document.getElementById(containerid));
            window.getSelection().addRange(range);
        }
    }
$(document).keydown(function(e) {
    if($("#decimal-output").is(":hover")){
        if (e.keyCode == 65 && e.ctrlKey) {
            selectText1('decimal-output');
            e.preventDefault();
        }
    }
});
$("#decimal-output").keydown(function(e) {
        if (e.keyCode == 65 && e.ctrlKey) {
            selectText1("decimal-output");
            e.preventDefault();
        }
});
function copyToClipboard(element) { //https://codepen.io/shaikmaqsood/pen/XmydxJ
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}