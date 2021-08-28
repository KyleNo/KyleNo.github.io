/*  Code for lzw demo for kylenoble.net
*   Author: Kyle Noble
*   Last Modified: 8/27/2021
*/

// Maximum size of dictionary: Number of unique entries that can
// exist in the dictionary, including the original dictionary.
// This is traditionally set to 2^12 so the code lengths don't exceed
// 12 bits
const maxDictSize = 4096; //2^12
// Operation to be completed when encode button is pressed.
// Takes input data as a string and passes through it to build
// a dictionary of previously encountered substrings.
// These new substrings are given unique codes which don't
// overlap with those of the original dictionary (which contains
// only single characters)
function encode(){
    var inputText = document.getElementById("input-str");
    let originalStr = inputText.value;
    let numInputSym = originalStr.length;
    let table = document.getElementById("lzw-tab").getElementsByTagName('tbody')[0];
    let p = document.getElementById("enc-output");
    let p_dec = document.getElementById("decimal-output");
    let span = document.createElement("span");
    let spanCount = 0;
    
    let dictSel = document.getElementById("dict-select").value;
    let demarkSel = document.getElementById("str-mark-select").value;
    
    let radix = parseInt(document.getElementById("radix-sel").value, 10);
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
    let idx = buildDictEnc(dict, dictSel, customDict);
    
    if(dictSel === "A-Z" || dictSel === "an"){
        originalStr = originalStr.toUpperCase();
    }
    
    //get the size of initial dictionary for statistics
    let dSize = idx-1;
    
    //entry number which requires increasing bit width
    let bitPerCode = Math.ceil(Math.log2(dSize))+1;
    let thresh = Math.pow(2, bitPerCode);
    let totalCompressedBits = 0;
    
    //counter objects to track occurrences of symbols
    var inputCounter = {};
    var outputCounter = {};
    
    //set demarcation symbols
    var l = getLeftDemarc(demarkSel);
    var r = getRightDemarc(demarkSel);
    
    s = originalStr[0];
    addToCounter(inputCounter, s);
    for (var i=1; i < originalStr.length; i++){
        c = originalStr[i];
        addToCounter(inputCounter, c);
        if(dict[s+c] !== undefined){
            insertRow(table, l+s+r, l+c+r, "", "", "", "", "");
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
            totalCompressedBits += bitPerCode;
            
            //only add to dictionary if within max size
            if(idx < maxDictSize){
                insertRow(table, l+s+r, l+c+r, l+s+r, dict[s], idx, l+s+c+r, idx);

                //update bitPerCode and threshhold if necessary
                if(idx>=thresh-1){
                    bitPerCode++;
                    thresh <<= 1;
                }

                dict[s+c] = idx;
                idx ++;
            }
            else{
                insertRow(table, l+s+r, l+c+r, l+s+r, dict[s], "", "", "");
            }
            s = c;
        }
        
    }
    //output s
    addToCounter(outputCounter, s);
    addSpans(span, s, spanCount, dict, p, p_dec, radix, bitPerCode, useBitstream);
    spanCount ++;
    totalCompressedBits += bitPerCode;
    //insertEOF(table, s, dict, leftDemarc, rightDemarc);
    insertRow(table, l+s+r, "EOF", l+s+r, dict[s], "", "", "");
    
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
// A counter object tracks the number of occurences of each
// unique, hashable key. 
function addToCounter(c, k){ //c=counter object, k=key
    if(c[k] === undefined)
        c[k] = 1;
    else
        c[k]++;
}
// Builds the dictionary for the encoder. For this dictionary (Javascript object)
// the key is the character and the value at that key is an index
// which counts up from 0 to the size of the desired initial dictionary.
function buildDictEnc(d, sel, custom){
    var idx = 0;
    switch(sel){
        case "ASCII":
            for (idx = 0; idx < 128; idx++){
                d[String.fromCharCode(idx)] = idx;
            }
            break;
        case "UTF-8":
            for (idx = 0; idx < 256; idx++){
                d[String.fromCharCode(idx)] = idx;
            }
            break;
        case "A-Z":
            for (idx = 0; idx < 26; idx++){
                d[String.fromCharCode(idx+65)] = idx;
            }
            break;
        case "0-9":
            for (idx = 0; idx < 10; idx++){
                d[String.fromCharCode(idx+48)] = idx;
            }
            break;
        case "an":
            for (idx = 0; idx < 10; idx++){
                d[String.fromCharCode(idx+48)] = idx;
            }
            for (; idx < 26+10; idx++){
                d[String.fromCharCode(idx+65-10)] = idx;
            }
            break;
        case "csan":
            for (idx = 0; idx < 10; idx++){
                d[String.fromCharCode(idx+48)] = idx;
            }
            for (; idx < 26+10; idx++){
                d[String.fromCharCode(idx+65-10)] = idx;
            }
            for (; idx < 26+10+26; idx++){
                d[String.fromCharCode(idx+97-10-26)] = idx;
            }
            break;
        case "csanp":
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
            break;
        case "custom":
            idx = 0;
            for (var c of custom){
                if (d[c] === undefined){
                    d[c] = idx;
                    idx++;
                }
            }
            break;
    }
    return idx;
}
// Builds the dictionary for the decoder. For this dictionary,
// the key is the index and the value is the character.
function buildDictDec(d, sel, custom){
    var idx = 0;
    switch(sel){
        case "ASCII":
            for (idx = 0; idx < 128; idx++){
                d[idx] = String.fromCharCode(idx);
            }
            break;
        case "UTF-8":
            for (idx = 0; idx < 256; idx++){
                d[idx] = String.fromCharCode(idx);
            }
            break;
        case "A-Z":
            for (idx = 0; idx < 26; idx++){
                d[idx] = String.fromCharCode(idx+65);
            }
            break;
        case "0-9":
            for (idx = 0; idx < 10; idx++){
                d[idx] = String.fromCharCode(idx+48);
            }
            break;
        case "an":
            for (idx = 0; idx < 10; idx++){
                d[idx] = String.fromCharCode(idx+48);
            }
            for (; idx < 26+10; idx++){
                d[idx] = String.fromCharCode(idx+65-10);
            }
            break;
        case "csan":
            for (idx = 0; idx < 10; idx++){
                d[idx] = String.fromCharCode(idx+48);
            }
            for (; idx < 26+10; idx++){
                d[idx] = String.fromCharCode(idx+65-10);
            }
            for (; idx < 26+10+26; idx++){
                d[idx] = String.fromCharCode(idx+97-10-26);
            }
            break;
        case "csanp":
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
            break;
        case "custom":
            idx = 0;
            for (var c of custom){
                if (d[idx] === undefined){
                    d[idx] = c;
                    idx++;
                }
            }
            break;
    }
    return idx;
}
// append a row to the end of the table with strings t1, ..., t6 and an optional identifier number
function insertRow(table, t1, t2, t3, t4, t5, t6, id){
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = t1;
    cell2.innerHTML = t2;
    cell3.innerHTML = t3;
    cell4.innerHTML = t4;
    cell5.innerHTML = t5;
    cell6.innerHTML = t6;
    if(id){
        cell5.id = `idx-${id}a`;
        cell6.id = `idx-${id}b`;
    }
}

// Adds both the sequence mapping and output text when encoding
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
// Adds the sequence mapping and output text when decoding
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
// Special case for when decoder is using binary bitstream
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
// Uses the counter objects to determine entropy. Similar to python's collections.Counter
// see here: https://en.wikipedia.org/wiki/Entropy_(information_theory)
function calcEntropy(c, n){ //c = counterobject, n = number of symbols
    sum = 0.0;
    for (var key in c){
        var value = c[key];
        sum += (value/n)*Math.log2(n/value);
    }
    return sum;
}
// On load, check if certain elements should be hidden
function onPageLoad(){
    e = document.getElementById("dict-select");
    c = document.getElementById("radix-sel");
    onDictSel(e);
    onRadixSel(c);
}
// Check if custom dictionary textbox should be loaded
function onDictSel(e){
    div = document.getElementById("custom-dict-box");
    if (e.value === "custom") {
        div.style.display = "block";
    }
    else{
        div.style.display = "none";
    }
}
// Returns demarcation characters
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
// Operation to be completed when decode button is pressed.
// Collects the input string, builds a dictionary,
// decodes input, displays table and output, and calculates
// some metrics
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
    let useBitstream = document.getElementById("use-bitstream").checked;
    
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
    let thresh = Math.pow(2, bitPerCode);
    let totalCompressedBits = 0;
    
    //counter objects to track occurrences of symbols
    var inputCounter = {};
    var outputCounter = {};
    var numInputSym = 0;
    
    //set demarcation symbols
    var l = getLeftDemarc(demarkSel);
    var r = getRightDemarc(demarkSel);
    
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
            addToCounter(outputCounter, entry);
            for(char of entry){
                addToCounter(inputCounter, char);
            }
            numInputSym += entry.length;
            addSpansDec(span, index, idx, spanCount, entry, p, p_dec, radix);
            spanCount++;
            totalCompressedBits += bitPerCode;
            if (s !== undefined){
                if(idx<maxDictSize){
                    dict[idx] = s + entry[0];
                    insertRow(table, l+s+r, l+entry[0]+r, l+entry+r, index, idx, l+s+entry[0]+r, idx);
                    if(idx>=thresh-2){
                        bitPerCode++;
                        thresh <<= 1;
                    }
                    idx++;
                }
                else{
                    insertRow(table, l+s+r, l+entry[0]+r, l+entry+r, index, "", "", "");
                }
            }
            else{
                insertRow(table, "undefined", l+entry[0]+r, l+entry+r, index, "", "", "");
            }
            s = entry;
        }
    }
    else{
        //remove all whitespace and commas
        var spacelessStr = originalStr.replace(/(?:,|\s)+/g, "");
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
                if(idx<maxDictSize){
                    dict[idx] = s + entry[0];
                    insertRow(table, l+s+r, l+entry[0]+r, l+entry+r, index, idx, l+s+entry[0]+r, idx);
                    if(idx>=thresh-2){
                        bitPerCode++;
                        thresh <<= 1;
                    }
                    idx++;
                }
                else{
                    insertRow(table, l+s+r, l+entry[0]+r, l+entry+r, index, "", "", "");
                }
            }
            else{
                insertRow(table, "undefined", l+entry[0]+r, l+entry+r, index, "", "", "");
            }
            s = entry;
        }
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
// Calculates some statistics about the input data and compression results
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
// Enables/Disables bitstream button depending on whether binary is selected
function onRadixSel(e){
    check = document.getElementById("use-bitstream");
    if(e.value === "2"){
        check.disabled = false;
    }
    else{
        check.disabled = true;
    }
}
// From stackoverflow, simple function which allows textbox to expand as necessary
function auto_height(elem) {
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}
// Checks whether a string contains whitespace
function hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
}
// Select everything in a container
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
// If hovering over output container, ctrl+a selects all text in container.
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
// Copy text to clipboard
function copyToClipboard(element) { //https://codepen.io/shaikmaqsood/pen/XmydxJ
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}